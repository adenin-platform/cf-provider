const logger = require('@adenin/cf-logger');
const authenticate = require('./auth');

module.exports = service => {
    return async context => {
        map_console(context);

        const authorized = authenticate(context.req.headers);

        if (!authorized) {
            logger.error('Unauthorized request\n' + JSON.stringify(context.req.headers, null, 4));

            context.res.status = 401;
            context.res.body = {
                error: 'Access key missing or invalid'
            };
        } else {
            context.res.body = await service(
                context.req.body
            );
        }
    };
};

function map_console(context) {
    console.log = context.log;
    console.info = context.log.info;
    console.error = context.log.error;
    console.warn = context.log.warn;
    console.debug = context.log.verbose;
}
