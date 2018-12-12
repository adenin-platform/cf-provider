'use strict';

const {readdirSync} = require('fs');
const {join} = require('path');

module.exports = (_exports, path) => {
    const services = new Map();

    readdirSync(path)
        .map(
            (name) => services.set(
                name.substring(
                    0, name.lastIndexOf('.')),
                join(path, name)
            )
        );

    if (process.env.GCP_PROJECT) {
        _exports.function = require('./provider.gcp')(services);
    } else if (process.env.AWS_EXECUTION_ENV) {
        _exports.function = require('./provider.aws')(services);
    } else if (process.env.AzureWebJobsStorage) {
        _exports.function = require('./provider.azure')(services);
    } else {
        _exports.function = require('./provider.local')(services);
    }
};
