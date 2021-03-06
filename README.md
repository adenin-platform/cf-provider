# Cloud Function Provider

This module returns entrypoints for FaaS providers Microsoft Azure, AWS Lambda, and Google Cloud functions.

It detects execution environment at runtime before returning the appropriate entrypoint for that environment, therefore enabling you to abstract away provider-specific code and implement only the business logic in your project repository, which will work for all 3 providers without modification.

By default, if neither of the 3 providers are detected, it will return a Koa middleware that allows you to execute your cloud functions in a local environment by calling the returned function from a Koa server.

## Installation

Use npm:

```bash
npm install @adenin/cf-provider
```

## Usage

The module assumes your function repo to take the following structure:

```txt
.
├── activities
|   ├── common/
|   ├── myactivity.js
|   ├── anotheractivity.js
|   └── function.json
└── index.js
```

Each `.js` file within the `/activities` folder will then be accessible through the exported cloud function middleware by name. Helper scripts used by these files should reside in the subfolder `/common`, to avoid inadvertently exposing them to the function endpoint also.

The function's `function.json` file is an [Azure function configuration](https://github.com/Azure/azure-functions-host/wiki/function.json) which will require the following properties to be set (in addition to the bindings and other required properties):

```json
{
    "disabled": false,
    "bindings": [
        {
            "authLevel": "anonymous",
            "type": "httpTrigger",
            "direction": "in",
            "name": "req",
            "methods": [
                "post"
            ],
            "route": "{activity}"
        },
        {
            "type": "http",
            "direction": "out",
            "name": "res"
        }
    ],
    "scriptFile": "../index.js",
    "entryPoint": "activities"
}
```

Within `index.js`, you then simply need to do the following:

```js
require('@adenin/cf-provider')(exports);
```

Your functions repo will now be exporting an entrypoint to access all the scripts contained in `/activities`, which will be correct for the current execution environment detected. The activity to be executed is specified by a mandatory path parameter `/:activity` to be appended to the endpoint of the deployed cloud function.

You can use the following function entry points for deployment to cloud providers:

**GCP**: _activities_

**AWS**: _index.activities_

Azure function entrypoint is already configured in `function.json`.

To call functions from a Koa server we can just provide the following route:

```js
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

global.logger = require('@adenin/cf-logger');

const app = new Koa();
const router = new Router();

const index = require('./index');

router.post('/:activity', async (ctx) => {
    await index.activities(ctx);
});

// set up koa app
app
    .use(bodyParser())
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(3000);
```

The exported middleware accepts POST requests, and the request body will be passed into each activity function - this object will automatically become the response body when function execution ends (no need to `return` it).

The activity script should export a single `async` function similar to the following:

```js
module.exports = async (activity) => {
    if (activity.Request.Data === 'Say hello') {
        activity.Response.Data = 'Hello world!';
    }
}
```

The module will enforce that the body has the valid structure for an adenin activity object, that is that it contains the following root nodes:

```json
{
    "Request": {},
    "Context": {}
}
```

It also allows for authentication with an API key if an environment variable `API_KEYS`, containing a `;` delimited set of keys, is set in the execution environment. The key can then be provided in the `x-api-key` request header.

If neither this header nor the environment variable are set, authentication will not be required, unless otherwise configured within your cloud service's internal settings. Requests made when authorization is disabled will however be logged.

Logging is provided via [@adenin/cf-logger](https://www.npmjs.com/package/@adenin/cf-logger), therefore any information logged while execution is within _cf-provider_ code, is dependent on the _cf-logger_'s `LOG_FILTER` environment variable.