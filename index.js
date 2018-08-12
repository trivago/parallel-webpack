var workerFarm = require('worker-farm'),
    Ajv = require('ajv'),
    Promise = require('bluebird'),
    chalk = require('chalk'),
    assign = require('lodash.assign'),
    pluralize = require('pluralize'),
    schema = require('./schema.json'),
    loadConfigurationFile = require('./src/loadConfigurationFile').default,
    startWatchIPCServer = require('./src/watchModeIPC').startWatchIPCServer;

var ajv = new Ajv({
    allErrors: true,
    coerceTypes: true,
    removeAdditional: 'all',
    useDefaults: true
});
var validate = ajv.compile(schema);

function notSilent(options) {
    return !options.json;
}

function startFarm(config, configPath, options, runWorker, callback) {
    return Promise.resolve(config).then(function(config) {
        config = Array.isArray(config) ? config : [config];
        options = options || {};

        // When in watch mode and a callback is provided start IPC server to invoke callback
        // once all webpack configurations have been compiled
        if (options.watch) {
            startWatchIPCServer(callback, Object.keys(config));
        }

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
    })
}

/**
 * Runs the specified webpack configuration in parallel.
 * @param {String} configPath The path to the webpack.config.js
 * @param {Object} options
 * @param {Boolean} [options.watch=false] If `true`, Webpack will run in
 *   `watch-mode`.
 * @param {Number} [options.maxCallsPerWorker=Infinity] The maximum amount of calls
 *   per parallel worker
 * @param {Number} [options.maxConcurrentWorkers=require('os').cpus().length] The
 *   maximum number of parallel workers
 * @param {Number} [options.maxConcurrentCallsPerWorker=10] The maximum number of
 *   concurrent call per prallel worker
 * @param {Number} [options.maxConcurrentCalls=Infinity] The maximum number of
 *   concurrent calls
 * @param {Number} [options.maxRetries=0] The maximum amount of retries
 *   on build error
 * @param {Function} [callback] A callback to be invoked once the build has
 *   been completed
 * @return {Promise} A Promise that is resolved once all builds have been
 *   created
 */
function run(configPath, options, callback) {
    var config,
        argvBackup = process.argv,
        farmOptions = assign({}, options);
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

    if (!validate(farmOptions)) {
        return Promise.reject(new Error(
          'Options validation failed:\n' +
          validate.errors.map(function(error) {
            return 'Property: "options' + error.dataPath + '" ' + error.message;
          }).join('\n')
        ));
    }

    var workers = workerFarm(farmOptions, require.resolve('./src/webpackWorker'));

    var shutdownCallback = function() {
        if (notSilent(options)) {
            console.log(chalk.red('[WEBPACK]') + ' Forcefully shutting down');
        }
        workerFarm.end(workers);
    };

    function keepAliveAfterFinishCallback(cb){
        if(options.keepAliveAfterFinish){
            setTimeout(cb, options.keepAliveAfterFinish);
        } else {
            cb();
        }
    }

    function finalCallback(){
        workerFarm.end(workers);
        process.removeListener("SIGINT", shutdownCallback);
    }

    process.on('SIGINT', shutdownCallback);

    var startTime = Date.now();
    var farmPromise = startFarm(
        config,
        configPath,
        options,
        Promise.promisify(workers),
        callback
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
    }).finally(function() {
        keepAliveAfterFinishCallback(finalCallback);
    });

    if (!options.watch) {
        farmPromise.asCallback(callback);
    }
    return farmPromise;
}

module.exports = {
    createVariants: require('./src/createVariants'),
    run: run
};
