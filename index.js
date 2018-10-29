const { lstatSync, readdirSync } = require('fs');
const { join, sep } = require('path');

const isDirectory = source => lstatSync(source).isDirectory();

module.exports = (_exports, path) => {
    const directories = readdirSync(path)
        .map(name => join(path, name))
        .filter(isDirectory);

    for (let i = 0; i < directories.length; i++) {
        const directory = directories[i];

        const service = directory.substring(
            directory.lastIndexOf(sep) + 1, directory.length
        );

        if (service != 'node_modules' && service.indexOf('_') == -1 && service != '.git') {
            _exports[service] = provide(
                require(directory)
            );
        }
    }

    function provide(service) {
        if (process.env.GCP_PROJECT) {
            return require('./provider.gcp')(service);
        }
                
        if (process.env.AWS_EXECUTION_ENV) {
            return require('./provider.aws')(service);
        }

        if (process.env.AzureWebJobsStorage) {
            return require('./provider.azure')(service);
        }

        return require('./provider.local')(service);
    }
};
