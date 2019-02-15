'use strict';

const logger = require('@adenin/cf-logger');
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

            ctx.status = 401;
        } else if (!body.Request || !body.Context) {
            logger.error('Invalid request body');

            body.Response = {
                ErrorCode: 400,
                Data: {
                    ErrorText: 'Activity body structure is invalid'
                }
            };

            ctx.status = 400;
        } else if (ctx.params && ctx.params.activity && activities.has(ctx.params.activity.toLowerCase())) {
            const activity = require(activities.get(ctx.params.activity.toLowerCase()));

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

            ctx.status = 404;
        }

        ctx.body = body;
    };
};
