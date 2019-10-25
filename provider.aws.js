'use strict';

global.logger = require('@adenin/cf-logger');

const {resolve} = require('path');

const {initialize} = require('@adenin/cf-activity');

const authenticate = require('./auth');
const info = require('./info');
const settings = require('./settings');

module.exports = (activities) => {
  return async (event) => {
    process.env.HOST = event.headers.host + event.path;

    const pathParameters = event.pathParameters;

    if (pathParameters && pathParameters.activity && pathParameters.activity.toLowerCase() === 'keepalive') {
      return {
        isBase64Encoded: false,
        statusCode: 200,
        body: JSON.stringify({
          date: new Date().toISOString()
        })
      };
    }

    if (pathParameters && pathParameters.activity && pathParameters.activity.toLowerCase() === '_info') {
      return {
        isBase64Encoded: false,
        statusCode: 200,
        body: await info()
      };
    }

    if (pathParameters && pathParameters.activity && pathParameters.activity.toLowerCase() === '_settings') {
      return {
        isBase64Encoded: false,
        statusCode: 200,
        body: await settings()
      };
    }

    const authenticated = authenticate(event.headers);
    const body = JSON.parse(event.body);

    if (!authenticated) {
      logger.error('Unauthenticated request: API key missing or invalid');

      body.Response = {
        ErrorCode: 401,
        Data: {
          ErrorText: 'API key missing or invalid'
        }
      };

      return {
        isBase64Encoded: false,
        statusCode: body.Response.ErrorCode,
        body: JSON.stringify(body)
      };
    }

    if (!body || !body.Request || !body.Context) {
      logger.error('Invalid request body');

      body.Response = {
        ErrorCode: 400,
        Data: {
          ErrorText: 'Activity body structure is invalid'
        }
      };

      return {
        isBase64Encoded: false,
        statusCode: body.Response.ErrorCode,
        body: JSON.stringify(body)
      };
    }

    if (pathParameters && pathParameters.activity && activities.has(pathParameters.activity.toLowerCase())) {
      const activity = require(activities.get(pathParameters.activity.toLowerCase()));

      if (!body.Request.Query) body.Request.Query = {};
      if (!body.Context.connector) body.Context.connector = {};
      if (!body.Response) body.Response = {};
      if (!body.Response.Data) body.Response.Data = {};

      body.Context.ScriptFolder = resolve('./activities');

      try {
        await initialize(body);
        await activity(body);
      } catch (error) {
        logger.error(error);

        body.Response = {
          ErrorCode: 500,
          Data: {
            ErrorText: error.message
          }
        };
      }

      body.Context.connector.ProxyServer = undefined; // avoid circular json error

      return {
        isBase64Encoded: false,
        statusCode: 200,
        body: JSON.stringify(body)
      };
    }

    logger.error('Invalid activity requested');

    body.Response = {
      ErrorCode: 404,
      Data: {
        ErrorText: 'Requested activity not found'
      }
    };

    return {
      isBase64Encoded: false,
      statusCode: body.Response.ErrorCode,
      body: JSON.stringify(body)
    };
  };
};
