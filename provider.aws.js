'use strict';

global.logger = require('@adenin/cf-logger');

const {makeGlobal} = require('@adenin/cf-activity');
const authenticate = require('./auth');

module.exports = (activities) => {
  return async (event) => {
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

    const authorized = authenticate(event.headers);
    const body = JSON.parse(event.body);

    if (!authorized) {
      logger.error('Unauthorized request');

      body.Response = {
        ErrorCode: 401,
        Data: {
          ErrorText: 'Access key missing or invalid'
        }
      };

      return {
        isBase64Encoded: false,
        statusCode: body.Response.ErrorCode,
        body: JSON.stringify(body)
      };
    }

    if (!body.Request || !body.Context || !body.Context.connector) {
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

      if (!body.Response) {
        body.Response = {
          Data: {}
        };
      }

      makeGlobal(body);

      await activity(body);

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
