'use strict';

const logger = require('@adenin/cf-logger');
const authenticate = require('./auth');

module.exports = (activities) => {
    return async (event) => {
        const authorized = authenticate(event.headers);

        if (!authorized) {
            logger.error('Unauthorized request\n' + JSON.stringify(event.headers, null, 4));

            return {
                isBase64Encoded: false,
                statusCode: 401,
                body: JSON.stringify({
                    error: 'Access key missing or invalid'
                })
            };
        }

        if (event.pathParameters && event.pathParameters.activity &&
            activities.has(event.pathParameters.activity.toLowerCase())) {
            const activity = require(activities.get(event.pathParameters.activity.toLowerCase()));
            const body = JSON.parse(event.body);

            await activity(body);

            return {
                isBase64Encoded: false,
                statusCode: 200,
                body: JSON.stringify(body)
            };
        }

        logger.error('Invalid activity request\n' + JSON.stringify(event.pathParameters, null, 4));

        return {
            isBase64Encoded: false,
            statusCode: 404,
            body: JSON.stringify({
                error: 'Requested activity not found'
            })
        };
    };
};
