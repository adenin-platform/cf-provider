/* eslint-disable no-console */
'use strict';

global.logger = require('@adenin/cf-logger');

const {resolve, sep} = require('path');

const {initialize} = require('@adenin/cf-activity');

const authenticate = require('./auth');
const info = require('./info');
const settings = require('./settings');

module.exports = (activities) => {
  return async (context) => {
    const body = context.req.body;

    try {
      process.chdir(context.executionContext.functionDirectory.replace(`${sep}activities`, ''));
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

      if (params && params.activity && params.activity.toLowerCase() === '_settings') {
        context.res.body = await settings();
        return;
      }

      const authenticated = authenticate(context.req.headers);

      if (!authenticated) {
        logger.error('Unauthenticated request: API key missing or invalid');

        body.Response = {
          ErrorCode: 401,
          Data: {
            ErrorText: 'API key missing or invalid'
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

        await initialize(body);
        await activity(body);

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
    } catch (error) {
      logger.error(error);

      body.Response = {
        ErrorCode: 500,
        Data: {
          ErrorText: error.message
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
