import chalk from 'chalk';
import { info } from './logger';
import pluralize from 'pluralize';
import jestWorker from 'jest-worker';
import settle from 'p-settle';

export const startFarm = (config, configPath, options = {}, workers) => {
    config = Array.isArray(config) ? config : [config];
    const silent = !!options.json;

    if (!silent) {
        info(
            'Building %s %s',
            chalk.yellow(config.length),
            pluralize('target', config.length),
        );
    }

    const builds = config.map((c, i) =>
        workers.build(configPath, options, i, config.length),
    );

    if (options.bail) {
        return Promise.all(builds);
    } else {
        return settle(builds).then(results =>
            Promise.all(
                results.map(
                    result =>
                        result.isFulfilled
                            ? result.value
                            : Promise.reject(result.reason),
                ),
            ),
        );
    }
};

export const createFarm = farmOptions =>
    new jestWorker(require.resolve('./webpackWorker'), {
        forkOptions: {
            stdio: [0, 1, 2, 'ipc'],
        },
        ...farmOptions,
    });
