var workerFarm = require('worker-farm'),
    Promise = require('bluebird'),
    chalk = require('chalk'),
    pluralize = require('pluralize'),
    loadConfigurationFile = require('./src/loadConfigurationFile');

function notSilent(options) {
    return !options.json;
}

function startFarm(config, configPath, options, runWorker) {
    config = Array.isArray(config) ? config : [config];
    options = options || {};

    if(notSilent(options)) {
        console.log(chalk.blue('[WEBPACK]') + ' Building ' + chalk.yellow(config.length) + ' ' + pluralize('target', config.length));
    }
    var builds = config.map(function (c, i) {
        return runWorker(configPath, options, i, config.length);
    });
    if(options.bail) {
        return Promise.all(builds);
    } else {
        return Promise.settle(builds).then(function(results) {
            return Promise.all(results.map(function (result) {
                if(result.isFulfilled()) {
                    return result.value();
                }
                return Promise.reject(result.reason());
            }));
        });
    }
}

/**
 * Runs the specified webpack configuration in parallel.
 * @param {String} configPath The path to the webpack.config.js
 * @param {Object} options
 * @param {Boolean} [options.watch=false] If `true`, Webpack will run in
 *   `watch-mode`.
 * @param {boolean} [options.maxRetries=Infinity] The maximum amount of retries
 *   on build error
 * @param {Number} [options.maxConcurrentWorkers=require('os').cpus().length] The
 *   maximum number of parallel workers
 * @param {Function} [callback] A callback to be invoked once the build has
 *   been completed
 * @return {Promise} A Promise that is resolved once all builds have been
 *   created
 */
function run(configPath, options, callback) {
    var config,
        argvBackup = process.argv;
    options = options || {};
    if(options.colors === undefined) {
        options.colors = chalk.supportsColor;
    }
    if(!options.argv) {
        options.argv = [];
    }
    options.argv.unshift(process.execPath, 'parallel-webpack');
    try {
        process.argv = options.argv;
        config = loadConfigurationFile(configPath);
        process.argv = argvBackup;
    } catch(e) {
        process.argv = argvBackup;
        return Promise.reject(new Error(
            chalk.red('[WEBPACK]') + ' Could not load configuration file ' + chalk.underline(configPath) + "\n"
            + e
        ));
    }

    var maxRetries = parseInt(options.maxRetries, 10) || 0,
        maxConcurrentWorkers = parseInt(options.maxConcurrentWorkers, 10)
            || require('os').cpus().length,
        workers = workerFarm({
            maxRetries: maxRetries,
            maxConcurrentWorkers: maxConcurrentWorkers
        }, require.resolve('./src/webpackWorker'));

    var shutdownCallback = function() {
        if (notSilent(options)) {
            console.log(chalk.red('[WEBPACK]') + ' Forcefully shutting down');
        }
        workerFarm.end(workers);
    };

    process.on('SIGINT', shutdownCallback);

    var startTime = Date.now();
    return startFarm(
        config,
        configPath,
        options,
        Promise.promisify(workers)
    ).error(function(err) {
        if(notSilent(options)) {
            console.log('%s Build failed after %s seconds', chalk.red('[WEBPACK]'), chalk.blue((Date.now() - startTime) / 1000));
        }
        return Promise.reject(err);
    }).then(function (results) {
        if(notSilent(options)) {
            console.log('%s Finished build after %s seconds', chalk.blue('[WEBPACK]'), chalk.blue((Date.now() - startTime) / 1000));
        }
        results = results.filter(function(result) {
            return result;
        });
        if(results.length) {
            return results;
        }
    }).finally(function () {
        process.removeListener('SIGINT', shutdownCallback);
        workerFarm.end(workers);
    }).asCallback(callback);
}

module.exports = {
    createVariants: require('./src/createVariants'),
    run: run
};
