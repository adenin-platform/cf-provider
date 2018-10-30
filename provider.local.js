const logger = require('@adenin/cf-logger');
const authenticate = require('./auth');

module.exports = service => {
    return async ctx => {
        const authorized = authenticate(ctx.header);

        if (!authorized) {
            logger.error('Unauthorized request\n' + JSON.stringify(ctx.header));

            ctx.status = 401;
            ctx.body = {
                error: 'Access key missing or invalid'
            };
        } else {
            ctx.body = await service(
                ctx.request.body
            );
        }
    };
};
