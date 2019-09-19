'use strict';

const fs = require('fs');
const {promisify} = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

const yaml = require('js-yaml');

module.exports = async () => {
  const files = await readdir('./');
  const activities = [];

  for (let i = 0; i < files.length; i++) {
    if (files[i].indexOf('_service.') !== -1 && files[i].indexOf('.yaml') !== -1) {
      const activity = yaml.safeLoad(await readFile(`./${files[i]}`));

      activity.Name = files[i].substring(files[i].indexOf('_service.') + 9, files[i].lastIndexOf('.yaml'));

      activities.push(activity);
    }
  }

  return {
    definition: yaml.safeLoad(await readFile('./_definition.yaml')),
    activities: activities
  };
};
