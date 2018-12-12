/* eslint-disable no-console */
'use strict';

const logger = require('@adenin/cf-logger');
const authenticate = require('./auth');

module.exports = (services) => {
    return async (context) => {
        mapConsole(context);

        const authorized = authenticate(context.req.headers);

        if (!authorized) {
            logger.error(
                'Unauthorized request\n' +
                    JSON.stringify(context.req.headers, null, 4)
            );

            context.res.status = 401;
            context.res.body = {
                error: 'Access key missing or invalid'
            };
        } else if (
            context.req.params &&
            context.req.params.service &&
            services.has(context.req.params.service)
        ) {
            const service = require(
                services.get(context.req.params.service)
            );

            const activity = context.req.body;

            await service(activity);

            context.res.body = activity;
        } else {
            logger.error(
                'Invalid request\n' +
                    JSON.stringify(context.req, null, 4)
            );

            context.res.status = 404;
            context.res.body = {
                error: 'Requested service not found'
            };
        }
    };
};

function mapConsole(context) {
    console.log = context.log;
    console.info = context.log.info;
    console.error = context.log.error;
    console.warn = context.log.warn;
    console.debug = context.log.verbose;
}
