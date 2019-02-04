'use strict';

const logger = require('@adenin/cf-logger');
const authenticate = require('./auth');

module.exports = (activities) => {
    return async (req, res) => {
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
            const activityName = req.path.substring(req.path.lastIndexOf('/') + 1, req.path.length);

            if (activities.has(activityName.toLowerCase())) {
                const activity = require(activities.get(activityName.toLowerCase()));

                if (!body.Response) {
                    body.Response = {};
                }

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
