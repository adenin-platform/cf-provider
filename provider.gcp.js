const authenticate = require('./auth');

module.exports = service => {
    return async (req, res) => {
        const authorized = authenticate(req.headers);

        if (!authorized) {
            console.error({
                message: 'Unauthorized request',
                headers: req.headers
            });

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
