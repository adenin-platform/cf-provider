/* eslint-disable no-console */
'use strict';

global.logger = require('@adenin/cf-logger');

const {resolve} = require('path');

const {initialize} = require('@adenin/cf-activity');

const authenticate = require('./auth');
const info = require('./info');

module.exports = (activities) => {
  return async (context) => {
    process.env.HOST = context.req.url;

    mapConsole(context);

    const params = context.req.params;

    if (params && params.activity && params.activity.toLowerCase() === 'keepalive') {
      context.res.body = {
        date: new Date().toISOString()
      };

      return;
    }

    if (params && params.activity && params.activity.toLowerCase() === '_info') {
      context.res.body = await info();
      return;
    }

    const authorized = authenticate(context.req.headers);
    const body = context.req.body;

    if (!authorized) {
      logger.error('Unauthorized request');

      body.Response = {
        ErrorCode: 401,
        Data: {
          ErrorText: 'Access key missing or invalid'
        }
      };
    } else if (!body || !body.Request || !body.Context) {
      logger.error('Invalid request body');

      body.Response = {
        ErrorCode: 400,
        Data: {
          ErrorText: 'Activity body structure is invalid'
        }
      };
    } else if (params && params.activity && activities.has(params.activity.toLowerCase())) {
      const activity = require(activities.get(params.activity.toLowerCase()));

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
    } else {
      logger.error('Invalid activity requested');

      body.Response = {
        ErrorCode: 404,
        Data: {
          ErrorText: 'Requested activity not found'
        }
      };
    }

    context.res.status = body.Response.ErrorCode || 200;
    context.res.body = body;
  };
};

function mapConsole(context) {
  console.log = context.log;
  console.info = context.log.info;
  console.error = context.log.error;
  console.warn = context.log.warn;
  console.debug = context.log.verbose;
}
