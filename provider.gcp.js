const logger = require('@adenin/cf-logger');
const authenticate = require('./auth');

module.exports = service => {
    return async (req, res) => {
        const authorized = authenticate(req.headers);

        if (!authorized) {
            logger.error('Unauthorized request\n' + JSON.stringify(req.headers));

            res.status(401).send({
                error: 'Access key missing or invalid'
            });
        } else {
            res.send(
                await service(req.body)
            );
        }
    };
};
