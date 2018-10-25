# Cloud Function Provider

This module returns middleware / entrypoint functions for FaaS providers Microsoft Azure, AWS Lambda, and Google Cloud Platform functions. 

It detects execution environment at runtime before returning the appropriate function for that environment, therefore enabling you to abstract away provider-specific code and have solely the function business logic in your cloud function repo. 

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
├── myfunction
|   ├── index.js
|   └── function.json
├── app.js
└── index.js
```

...where `app.js` is the optional local Koa server, and there may be one or more function folders, each named after the function itself. 

The function's `function.json` file is an [Azure function configuration](https://github.com/Azure/azure-functions-host/wiki/function.json) which will require the following properties to be set (in addition to the bindings and other required properties):

```json
{
    "scriptFile": "../index.js",
    "entryPoint": "myfunction"
}
```

...where _myfunction_ is the name of the function (determined by the name of the function's folder). This file can be omitted if you do not wish to deploy to Azure.

Within `index.js`, you then simply need to do the following:

```js
const provide = require('@adenin/cf-provider');
const { resolve } = require('path');

provide(
    exports, resolve('./')
);
```

Your functions repo will now be exporting each of your function modules, via the middleware required for the current execution environment. 

You can use the following function entry points for deployment to cloud providers:

**GCP**: _<function_name>_

**AWS**: _index.<function_name>_

Azure will automatically detect functions in your repo upon deployment and use the entry points we already specified in the `function.json` files.

To call functions from a Koa server we can just provide the following route in `app.js`:

```js
const routes = require('./index');

// set up koa app

app.use(async ctx => {
    const service = ctx.url.split('/')[1];

    if (routes[service]) await routes[service](ctx);
});
```

The exported middleware will pass the request body on to your function file, which should return the intended response body. The function file should export a single `async` function in the following manner:

```js
module.exports = async body => {
    var result;

    // Do something

    return result;
}
```

It also allows for authentication with an API key if an environment variable `API_KEYS`, containing a `;` delimited set of keys, is set in the execution environment. The key can then be provided in the `x-api-key` request header.

If neither this header nor the environment variable are set, authentication will not be required, unless otherwise configured within your cloud service settings.