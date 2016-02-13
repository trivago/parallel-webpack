var workerFarm = require('worker-farm'),
    Promise = require('bluebird'),
    chalk = require('chalk'),
    _ = require('lodash');

function isSilent(options) {
    return options && !options.json;
}

function startSingleConfigWorker(configPath, options, runWorker) {
    if(isSilent(options)) {
        process.stdout.write(chalk.blue('[WEBPACK]') + ' Building ' + chalk.yellow('1') + ' configuration' + "\n");
    }
    var worker = require('./src/webpackWorker');
    return new Promise(function(resolve, reject) {
        worker(configPath, options, 0, 1, function(err, stats) {
            if(err) {
                return reject(err);
            }
            resolve([stats]);
        });
    });
}

function startMultiConfigFarm(config, configPath, options, runWorker) {
    if(isSilent(options)) {
        process.stdout.write(chalk.blue('[WEBPACK]') + ' Building ' + chalk.yellow(config.length) + ' targets in parallel' + "\n");
    }
    var builds = config.map(function (c, i) {
        return runWorker(configPath, options, i, config.length);
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
    // special handling for cases where only one config is exported as array
    // unpack and treat as single config
    if(_.isArray(config) && config.length === 1) {
        config = config[0];
    }
    if(!_.isArray(config)) {
        return startSingleConfigWorker(configPath, options, runWorker);
    } else {
        return startMultiConfigFarm(config, configPath, options, runWorker);
    }
}

function closeFarm(workers, options, done, startTime) {
    return function(err, stats) {
        workerFarm.end(workers);
        if(isSilent(options)) {
            if(err) {
                console.log('%s Build failed after %s seconds', chalk.red('[WEBPACK]'), chalk.blue((new Date().getTime() - startTime) / 1000));
            } else {
                console.log('%s Finished build after %s seconds', chalk.blue('[WEBPACK]'), chalk.blue((new Date().getTime() - startTime) / 1000));
            }
        }
        if (done) {
            done(err, stats);
        }
        if(err) {
            throw err;
        }
        return stats;
    }
}

function promisify(workers) {
    return function(configPath, options, i, configLength) {
        return new Promise(function(resolve, reject) {
            workers(configPath, options, i, configLength, function(err, res) {
                if(err) {
                    return reject(err);
                }
                resolve(res);
            });
        });
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
    var config,
        argvBackup = process.argv;
    if(!options.argv) {
        options.argv = [];
    }
    options.argv = ['node', 'parallel-webpack'].concat(options.argv);
    try {
        process.argv = options.argv;
        config = require(configPath);
        process.argv = argvBackup;
    } catch(e) {
        throw {
            message: chalk.red('[WEBPACK]') + ' Could not load configuration file ' + chalk.underline(configPath),
            error: e
        };
    }

    var maxRetries = options && parseInt(options.maxRetries, 10) || Infinity,
        maxConcurrentWorkers = options
            && parseInt(options.maxConcurrentWorkers, 10)
            || require('os').cpus().length,
        workers = workerFarm({
            maxRetries: maxRetries,
            maxConcurrentWorkers: maxConcurrentWorkers
        }, require.resolve('./src/webpackWorker')),
        done = closeFarm(workers, options, callback, +new Date());

    process.on('SIGINT', function() {
        console.log(chalk.red('[WEBPACK]') + ' Forcefully shutting down');
        done();
    });

    return startFarm(
        config,
        configPath,
        options || {},
        promisify(workers)
    ).then(function(err, res) {
        return done(null, res);
    }, function(err) {
        throw done(err);
    });
}

module.exports = {
    createVariants: require('./src/createVariants'),
    run: run
};

