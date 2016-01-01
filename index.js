var workerFarm = require('worker-farm'),
    Promise = require('bluebird'),
    _ = require('lodash');

function isSilent(options) {
    return options && !options.json;
}

function startSingleConfigWorker(configPath, options, runWorker) {
    if(isSilent(options)) {
        console.log('[WEBPACK] Building 1 configuration');
    }
    return runWorker(configPath, options, 0).then(function(stats) {
        return [stats];
    });
}

function startMultiConfigFarm(config, configPath, options, runWorker) {
    if(isSilent(options)) {
        console.log('[WEBPACK] Building %s targets in parallel', config.length);
    }
    var builds = _.map(config, function (c, i) {
        return runWorker(configPath, options, i);
    });
    if(options.bail) {
        return Promise.all(builds);
    } else {
        return Promise.all(builds.map(function(build) {
            return build.reflect();
        })).then(function(results) {
            return Promise.all(results.map(function(buildInspection) {
                if(buildInspection.isFulfilled) {
                    return buildInspection.value();
                } else {
                    return Promise.reject(buildInspection.reason());
                }
            }));
        });
    }
}

function startFarm(config, configPath, options, runWorker) {
    if(!_.isArray(config)) {
        return startSingleConfigWorker(configPath, options, runWorker);
    } else {
        return startMultiConfigFarm(config, configPath, options, runWorker);
    }
}

function closeFarm(workers, options, done, startTime) {
    return function(stats) {
        workerFarm.end(workers);
        if(isSilent(options)) {
            console.log('[WEBPACK] Finished build after %s seconds', (new Date().getTime() - startTime) / 1000);
        }
        if (done) {
            done(stats);
        }
        return stats;
    }
}

/**
 * Runs the specified webpack configuration in parallel.
 * @param {String} configPath The path to the webpack.config.js
 * @param {Object} options
 * @param {Boolean} [options.watch=false] If `true`, Webpack will run in `watch-mode`.
 * @param {boolean} [options.maxRetries=Infinity] The maximum amount of retries on build error
 * @param {Number} [options.maxConcurrentWorkers=require('os').cpus().length] The maximum number of parallel workers
 * @param {Function} [callback] A callback to be invoked once the build has been completed
 * @return {Promise} A Promise that is resolved once all builds have been created
 */
function run(configPath, options, callback) {
    var config;
    try {
        config = require(configPath);
    } catch(e) {
        console.error('Could not load configuration file %s', configPath);
        return Promise.reject(e);
    }

    var maxRetries = options && Number.parseInt(options.maxRetries, 10) || Infinity,
        maxConcurrentWorkers = options
            && Number.parseInt(options.maxConcurrentWorkers, 10)
            || require('os').cpus().length,
        workers = workerFarm({
            maxRetries: maxRetries,
            maxConcurrentWorkers: maxConcurrentWorkers
        }, require.resolve('./src/webpackWorker')),
        done = closeFarm(workers, options, callback, +new Date());

    process.on('SIGINT', function() {
        console.log('[WEBPACK] Forcefully shutting down');
        done();
    });

    return startFarm(
        config,
        configPath,
        options || {},
        Promise.promisify(workers)
    ).then(done, function(err) {
        throw done(err);
    });
}

module.exports = {
    createVariants: require('./src/createVariants'),
    run: run
};

