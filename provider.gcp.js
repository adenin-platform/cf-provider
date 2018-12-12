'use strict';

const logger = require('@adenin/cf-logger');
const authenticate = require('./auth');

module.exports = (services) => {
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
            const serviceName = req.path.substring(
                req.path.lastIndexOf('/') + 1, req.path.length
            );

            if (services.has(serviceName)) {
                const service = require(
                    services.get(serviceName)
                );

                const activity = req.body;

                await service(activity);

                res.send(activity);
            } else {
                logger.error(
                    'Invalid request\n' +
                        JSON.stringify(req.path, null, 4)
                );

                res.status(404).send({
                    error: 'Requested service not found'
                });
            }
        }
    };
};
