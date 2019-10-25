'use strict';

const fs = require('fs');
const yaml = require('js-yaml');

const {promisify} = require('util');

const readFile = promisify(fs.readFile);

module.exports = async () => yaml.safeLoad(await readFile('./_settings.form'));
