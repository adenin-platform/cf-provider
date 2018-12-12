# Cloud Function Provider

This module returns middleware / entrypoints for FaaS providers Microsoft Azure, AWS Lambda, and Google Cloud functions. 

It detects execution environment at runtime before returning the appropriate entrypoint for that environment, therefore enabling you to abstract away provider-specific code and have solely the function business logic in your cloud function repo. 

By default, if neither of the 3 providers are detected, it will return a Koa middleware that allows you to execute your cloud functions in a local environment by calling the returned function from a Koa server.

## Installation

Use npm:

```bash
npm install @adenin/cf-provider
```

## Usage

The module assumes your function repo to take the following structure:

```
.
├── functions
|   ├── myfunction.js
|   ├── anotherfunction.js
|   └── function.json
└── index.js
```

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
            "route": "test2/{service}"
        },
        {
            "type": "http",
            "direction": "out",
            "name": "res"
        }
    ],
    "scriptFile": "../index.js",
    "entryPoint": "function"
}
```

Within `index.js`, you then simply need to do the following:

```js
const provide = require('@adenin/cf-provider');
const { resolve } = require('path');

provide(exports, resolve(__dirname + '/functions'));
```

Your functions repo will now be exporting an entrypoint for all the scripts contained in `/functions`, via the middleware required for the current execution environment. 

You can use the following function entry points for deployment to cloud providers:

**GCP**: _function_

**AWS**: _index.function_

Azure function entrypoint is already configured in `function.json`.

To call functions from a Koa server we can just provide the following route:

```js
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

const controller = require('./index');

router.post('/:service', async (ctx) => {
    await controller.function(ctx);
});

// set up koa app
app
    .use(bodyParser())
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(3000);
```

The exported middleware will pass the request body on to your function file, which should mutate the object it receives (the request body) - this will automatically become the response body when function execution ends (no need to `return` the object).

The function file should export a single `async` function similar to the following:

```js
module.exports = async body => {
    if (body.request === 'Say hello') {
        body.response = 'Hello world!';
    }
}
```

It also allows for authentication with an API key if an environment variable `API_KEYS`, containing a `;` delimited set of keys, is set in the execution environment. The key can then be provided in the `x-api-key` request header.

If neither this header nor the environment variable are set, authentication will not be required, unless otherwise configured within your cloud service's internal settings. Requests made when authorization is disabled will however be logged.

Logging is provided via [@adenin/cf-logger](https://www.npmjs.com/package/@adenin/cf-logger), therefore any information logged while execution is within _cf-provider_ code, is dependent on the _cf-logger_'s `LOG_FILTER` environment variable.