'use strict';

if (!global.logger) {
  // in case server did not use it, or did not make it global
  global.logger = require('@adenin/cf-logger');
}

const {resolve} = require('path');
const {initialize} = require('@adenin/cf-activity');
const authenticate = require('./auth');

module.exports = (activities) => {
  return async (ctx) => {
    if (ctx.params && ctx.params.activity && ctx.params.activity.toLowerCase() === 'keepalive') {
      ctx.body = {
        date: new Date().toISOString()
      };

      return;
    }

    const authorized = authenticate(ctx.header);
    const body = ctx.request.body;

    if (!authorized) {
      logger.error('Unauthorized request');

      body.Response = {
        ErrorCode: 401,
        Data: {
          ErrorText: 'Access key missing or invalid'
        }
      };
    } else if (!body.Request || !body.Context) {
      logger.error('Invalid request body');

      body.Response = {
        ErrorCode: 400,
        Data: {
          ErrorText: 'Activity body structure is invalid'
        }
      };
    } else if (ctx.params && ctx.params.activity && activities.has(ctx.params.activity.toLowerCase())) {
      const activity = require(activities.get(ctx.params.activity.toLowerCase()));

      if (!body.Request.Query) body.Request.Query = {};
      if (!body.Context.connector) body.Context.connector = {};
      if (!body.Response) body.Response = {};
      if (!body.Response.Data) body.Response.Data = {};

      body.Context.ScriptFolder = resolve('./activities');

      initialize(body);
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

    ctx.status = body.Response.ErrorCode || 200;
    ctx.body = body;
  };
};
