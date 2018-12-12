'use strict';

const logger = require('@adenin/cf-logger');
const authenticate = require('./auth');

module.exports = (services) => {
    return async (event) => {
        const authorized = authenticate(event.headers);

        if (!authorized) {
            logger.error(
                'Unauthorized request\n' +
                    JSON.stringify(event.headers, null, 4)
            );

            return {
                isBase64Encoded: false,
                statusCode: 401,
                body: JSON.stringify({
                    error: 'Access key missing or invalid'
                })
            };
        }

        if (
            event.pathParameters &&
            event.pathParameters.service &&
            services.has(event.pathParameters.service)
        ) {
            const service = require(
                services.get(event.pathParameters.service)
            );

            const activity = JSON.parse(event.body);

            await service(activity);

            return {
                isBase64Encoded: false,
                statusCode: 200,
                body: JSON.stringify(activity)
            };
        }

        logger.error(
            'Invalid request\n' +
                JSON.stringify(event, null, 4)
        );

        return {
            isBase64Encoded: false,
            statusCode: 404,
            body: JSON.stringify({
                error: 'Requested service not found'
            })
        };
    };
};
