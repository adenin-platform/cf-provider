'use strict';

const {readdirSync} = require('fs');
const {join, sep} = require('path');

module.exports = (_exports) => {
    const path = module.parent.filename.substring(
        0, module.parent.filename.lastIndexOf(sep)
    ) + sep + 'activities';

    const activities = new Map();

    readdirSync(path).map(
        (name) => activities.set(
            name.substring(0, name.lastIndexOf('.')),
            join(path, name)
        )
    );

    if (process.env.GCP_PROJECT) {
        _exports.function = require('./provider.gcp')(activities);
    } else if (process.env.AWS_EXECUTION_ENV) {
        _exports.function = require('./provider.aws')(activities);
    } else if (process.env.AzureWebJobsStorage) {
        _exports.function = require('./provider.azure')(activities);
    } else {
        _exports.function = require('./provider.local')(activities);
    }
};
