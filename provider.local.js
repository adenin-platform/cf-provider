'use strict';

const logger = require('@adenin/cf-logger');
const authenticate = require('./auth');

module.exports = (activities) => {
    return async (ctx) => {
        const authorized = authenticate(ctx.header);

        if (!authorized) {
            logger.error('Unauthorized request\n' + JSON.stringify(ctx.header, null, 4));

            ctx.status = 401;
            ctx.body = {
                error: 'Access key missing or invalid'
            };
        } else if (ctx.params && ctx.params.activity && activities.has(ctx.params.activity.toLowerCase())) {
            if (ctx.params.activity.toLowerCase() === '_info') {
                ctx.body = activities.get('_info');
            } else {
                const activity = require(activities.get(ctx.params.activity.toLowerCase()));
                const body = ctx.request.body;

                await activity.main(body);

                ctx.body = body;
            }
        } else {
            logger.error('Invalid activity request\n' + JSON.stringify(ctx.params, null, 4));

            ctx.status = 404;
            ctx.body = {
                error: 'Requested activity not found'
            };
        }
    };
};
