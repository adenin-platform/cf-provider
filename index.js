'use strict';

const {readdirSync} = require('fs');
const {join, sep} = require('path');

module.exports = (_exports) => {
    const path = module.parent.filename.substring(0, module.parent.filename.lastIndexOf(sep)) + sep + 'activities';

    const files = readdirSync(path);
    const activities = new Map();

    const info = {};

    // loop through the activities folder, if .js file, map its name to its path in the activities map
    for (let i = 0; i < files.length; i++) {
        if (files[i].indexOf('.json') === -1 && files[i].indexOf('.js') !== -1) {
            const name = files[i].substring(0, files[i].lastIndexOf('.'));

            info[name] = require(join(path, files[i]))._info();

            activities.set(name.toLowerCase(), join(path, files[i]));
        }
    }

    activities.set('_info', info);

    if (process.env.GCP_PROJECT) {
        _exports.activities = require('./provider.gcp')(activities);
    } else if (process.env.AWS_EXECUTION_ENV) {
        _exports.activities = require('./provider.aws')(activities);
    } else if (process.env.AzureWebJobsStorage) {
        _exports.activities = require('./provider.azure')(activities);
    } else {
        _exports.activities = require('./provider.local')(activities);
    }
};
