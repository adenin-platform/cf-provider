'use strict';

const logger = require('@adenin/cf-logger');
const authenticate = require('./auth');

module.exports = (services) => {
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
            ctx.params.service &&
            services.has(ctx.params.service)
        ) {
            const service = require(services.get(ctx.params.service));
            const activity = ctx.request.body;

            await service(activity);

            ctx.body = activity;
        } else {
            logger.error(
                'Invalid request\n' +
                    JSON.stringify(ctx.req, null, 4)
            );

            ctx.status = 404;
            ctx.body = {
                error: 'Requested service not found'
            };
        }
    };
};
