const authenticate = require('./auth');

module.exports = service => {
    return async ctx => {
        const authorized = authenticate(ctx.header);

        if (!authorized) {
            console.error({
                message: 'Unauthorized request',
                headers: ctx.header
            });

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
