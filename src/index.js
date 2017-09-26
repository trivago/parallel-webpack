import chalk from 'chalk';
import createVariants from './createVariants';
import regeneratorRuntime from 'regenerator-runtime';
import { info, error } from './logger';
import { createFarm, startFarm } from './farm';
import { validateOptions, loadConfig } from './utils';

/**
 * Runs the specified webpack configuration in parallel.
 * @param {String} configPath The path to the webpack.config.js
 * @param {Object} options
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
export const run = async (configPath, paramOptions = {}, callback) => {
    const options = {
        argv: [],
        colors: chalk.supportsColor,
        ...paramOptions,
    };
    const farmOptions = { ...paramOptions };
    const silent = !!options.json;
    let config;

    if (options.colors) {
        process.env.FORCE_COLOR = 1;
    }

    options.argv.unshift(process.execPath, 'parallel-webpack');

    try {
        config = await loadConfig(configPath, options);
    } catch (error) {
        return Promise.reject(error);
    }

    try {
        await validateOptions(farmOptions);
    } catch (error) {
        return Promise.reject(error);
    }

    const workers = createFarm(farmOptions);

    const shutdownCallback = () => {
        if (!silent) {
            error(`Forcefully shutting down`);
        }
        workers.end();
        process.exit(1);
    };

    process.on('SIGINT', shutdownCallback);

    const startTime = Date.now();
    const farmPromise = startFarm(
        config,
        configPath,
        options,
        workers,
        callback,
    )
        .then(results => {
            if (!silent) {
                const finishTime = (Date.now() - startTime) / 1000;
                info('Finished build after %s seconds', chalk.blue(finishTime));
            }

            workers.end();
            process.removeListener('SIGINT', shutdownCallback);

            results = results.filter(result => result);
            if (results.length) {
                if (callback) {
                    callback(null, results);
                }
                return results;
            }
        })
        .catch(err => {
            if (!silent) {
                const finishTime = (Date.now() - startTime) / 1000;
                error('Build failed after %s seconds', chalk.blue(finishTime));
            }

            workers.end();
            process.removeListener('SIGINT', shutdownCallback);

            if (callback) {
                callback(err);
            } else {
                return Promise.reject(err);
            }
        });

    if (!callback) {
        return farmPromise;
    }
};

export { createVariants };
