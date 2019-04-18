'use strict';

global.logger = require('@adenin/cf-logger');

const {resolve} = require('path');
const {initialize} = require('@adenin/cf-activity');
const authenticate = require('./auth');

module.exports = (activities) => {
  return async (req, res) => {
    const name = req.path.substring(req.path.lastIndexOf('/') + 1, req.path.length).toLowerCase();

    if (name === 'keepalive') {
      res.status(200).send({
        date: new Date().toISOString()
      });
    }

    const authorized = authenticate(req.headers);
    const body = req.body;

    if (!authorized) {
      logger.error('Unauthorized request');

      body.Response = {
        ErrorCode: 401,
        Data: {
          ErrorText: 'Access key missing or invalid'
        }
      };

      res.status(401).send(body);
    } else if (!body.Request || !body.Context) {
      logger.error('Invalid request body');

      body.Response = {
        ErrorCode: 400,
        Data: {
          ErrorText: 'Activity body structure is invalid'
        }
      };

      res.status(400).send(body);
    } else {
      if (activities.has(name)) {
        const activity = require(activities.get(name));

        if (!body.Request.Query) body.Request.Query = {};
        if (!body.Context.connector) body.Context.connector = {};
        if (!body.Response) body.Response = {};
        if (!body.Response.Data) body.Response.Data = {};

        body.Context.ScriptFolder = resolve('./activities');

        initialize(body);

        await activity(body);

        res.status(200).send(body);
      } else {
        logger.error('Invalid activity requested');

        body.Response = {
          ErrorCode: 404,
          Data: {
            ErrorText: 'Requested activity not found'
          }
        };

        res.status(404).send(body);
      }
    }
  };
};
