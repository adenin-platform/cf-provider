'use strict';

const logger = require('@adenin/cf-logger');
const authenticate = require('./auth');

module.exports = (activities) => {
    return async (ctx) => {
        const authorized = authenticate(ctx.header);

        if (!authorized) {
            logger.error(
                'Unauthorized request\n' + JSON.stringify(ctx.header, null, 4)
            );

            ctx.status = 401;
            ctx.body = {
                error: 'Access key missing or invalid'
            };
        } else if (
            ctx.params &&
            ctx.params.activity &&
            activities.has(ctx.params.activity)
        ) {
            const activity = require(
                activities.get(ctx.params.activity)
            );

            const body = ctx.request.body;

            await activity(body);

            ctx.body = body;
        } else {
            logger.error(
                'Invalid request\n' +
                    JSON.stringify(ctx.req, null, 4)
            );

            ctx.status = 404;
            ctx.body = {
                error: 'Requested activity not found'
            };
        }
    };
};
