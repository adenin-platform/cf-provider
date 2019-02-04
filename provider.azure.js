/* eslint-disable no-console */
'use strict';

const logger = require('@adenin/cf-logger');
const authenticate = require('./auth');

module.exports = (activities) => {
    return async (context) => {
        mapConsole(context);

        const authorized = authenticate(context.req.headers);
        const body = context.req.body;
        const params = context.req.params;

        if (!authorized) {
            logger.error('Unauthorized request');

            body.Response = {
                ErrorCode: 401,
                Data: {
                    ErrorText: 'Access key missing or invalid'
                }
            };

            context.res.status = 401;
        } else if (!body.Request || !body.Context) {
            logger.error('Invalid request body');

            body.Response = {
                ErrorCode: 400,
                Data: {
                    ErrorText: 'Activity body structure is invalid'
                }
            };

            context.res.status = 400;
        } else if (params && params.activity && activities.has(params.activity.toLowerCase())) {
            const activity = require(activities.get(params.activity.toLowerCase()));

            if (!body.Response) {
                body.Response = {};
            }

            await activity(body);
        } else {
            logger.error('Invalid activity requested');

            body.Response = {
                ErrorCode: 404,
                Data: {
                    ErrorText: 'Requested activity not found'
                }
            };

            context.res.status = 404;
        }

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
