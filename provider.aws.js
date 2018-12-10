'use strict';

const logger = require('@adenin/cf-logger');
const authenticate = require('./auth');

module.exports = (service) => {
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

        const activity = JSON.parse(event.body);

        await service(activity);

        return {
            isBase64Encoded: false,
            statusCode: 200,
            body: JSON.stringify(activity)
        };
    };
};
