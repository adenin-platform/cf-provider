'use strict';

const logger = require('@adenin/cf-logger');
const authenticate = require('./auth');

module.exports = (activities) => {
    return async (req, res) => {
        const authorized = authenticate(req.headers);

        if (!authorized) {
            logger.error(
                'Unauthorized request\n' +
                    JSON.stringify(req.headers, null, 4)
            );

            res.status(401).send({
                error: 'Access key missing or invalid'
            });
        } else {
            const activityName = req.path.substring(
                req.path.lastIndexOf('/') + 1, req.path.length
            );

            if (activities.has(activityName)) {
                const activity = require(
                    activities.get(activityName)
                );

                const body = req.body;

                await activity(body);

                res.send(body);
            } else {
                logger.error(
                    'Invalid activity request\n' +
                        JSON.stringify(req.path, null, 4)
                );

                res.status(404).send({
                    error: 'Requested activity not found'
                });
            }
        }
    };
};
