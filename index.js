var workerFarm = require('worker-farm'),
    Promise = require('bluebird'),
    _ = require('lodash');

function runWorker(configFileName, watch, index, workers) {
    return new Promise(function(resolve) {
        workers(configFileName, watch, index, resolve);
    });
}

function startSingleConfigWorker(configPath, watch, workers) {
    console.log('[WEBPACK] Building 1 configuration');
    return runWorker(configPath, watch, 0, workers);
}

function startMultiConfigFarm(config, configPath, watch, workers) {
    console.log('[WEBPACK] Building %s targets in parallel', config.length);
    return Promise.all(_.map(config, function(c, i) {
        return runWorker(configPath, watch, i, workers);
    }));
}

function startFarm(config, configPath, watch, workers) {
    if(!_.isArray(config)) {
        return startSingleConfigWorker(configPath, watch, workers);
    } else {
        return startMultiConfigFarm(config, configPath, watch, workers);
    }
}

function closeFarm(workers, done, startTime) {
    return function() {
        workerFarm.end(workers);
        console.log('[WEBPACK] Finished build after %s seconds', (new Date().getTime() - startTime) / 1000);
        if (done) {
            done();
        }
    }
}

/**
 * Runs the specified webpack configuration in parallel.
 * @param {String} configPath The path to the webpack.config.js
 * @param {Object} options
 * @param {Boolean} [options.watch=false] If `true`, Webpack will run in `watch-mode`.
 * @param {boolean} [options.maxRetries=Infinity] The maximum amount of retries on build error
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

    var watch = options && !!options.watch,
        maxRetries = options && Number.parseInt(options.maxRetries, 10) || Infinity,
        workers = workerFarm({
            maxRetries: maxRetries
        }, require.resolve('./src/webpackWorker')),
        done = closeFarm(workers, callback, +new Date());

    process.on('SIGINT', function() {
        console.log('[WEBPACK] Forcefully shutting down');
        done();
    });

    return startFarm(config, configPath, watch, workers).then(done, done);
}

module.exports = {
    createVariants: require('./src/createVariants'),
    run: run
};

