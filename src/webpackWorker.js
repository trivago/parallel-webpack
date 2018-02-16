import chalk from 'chalk';
import loadConfigurationFile from './loadConfigurationFile';
import { info, error, rawLog, decorate } from './logger';
import { presetToOptions } from 'webpack/lib/Stats';

/**
 * Choose the most correct version of webpack, prefer locally installed version,
 * fallback to the own dependency if there's none.
 * @returns {*}
 */
const getWebpack = () => {
    try {
        return require(process.cwd() + '/node_modules/webpack');
    } catch (e) {
        return require('webpack');
    }
};

const getAppName = webpackConfig => {
    let appName = webpackConfig.name || webpackConfig.output.filename;
    if (~appName.indexOf('[name]') && typeof webpackConfig.entry === 'object') {
        const entryNames = Object.keys(webpackConfig.entry);
        if (entryNames.length === 1) {
            // we can only replace [name] with the entry point if there is only one entry point
            appName = appName.replace(/\[name]/g, entryNames[0]);
        }
    }
    return appName;
};

const getOutputOptions = (webpackConfig, options) => ({
    ...(typeof webpackConfig.stats === 'string'
        ? presetToOptions(stats)
        : webpackConfig.stats),
    modulesSort: options.modulesSort,
    assetsSort: options.assetsSort,
    chunkSort: options.chunkSort,
    exclude: options.exclude,
    colors: options.colors,
});

/**
 * Create a single webpack build using the specified configuration.
 *
 * @param {string} configuratorFileName The app configuration filename
 * @param {Object} options The build options
 * @param {boolean} options.json If `true`, then the webpack watcher will only report the result as JSON but not produce any other output
 * @param {number} index The configuration index
 * @param {number} expectedConfigLength
 */
export const build = (
    configuratorFileName,
    options,
    index,
    expectedConfigLength,
) =>
    new Promise((resolve, reject) => {
        if (options.argv) {
            process.argv = options.argv;
        }
        chalk.enabled = options.colors;
        if (options.colors) {
            // TODO check with options
            process.env.FORCE_COLOR = 1;
        }
        let config = loadConfigurationFile(configuratorFileName);
        const silent = !!options.json;

        if (
            (expectedConfigLength !== 1 && !Array.isArray(config)) ||
            (Array.isArray(config) && config.length !== expectedConfigLength)
        ) {
            if (config.length !== expectedConfigLength) {
                const errorMessage =
                    'There is a difference between the amount of the' +
                    ' provided configs. Maybe you where expecting command line' +
                    ' arguments to be passed to your webpack.config.js. If so,' +
                    " you'll need to separate them with a -- from the parallel-webpack options.";
                error(errorMessage);
                return Promise.reject(decorate(errorMessage, 'red'));
            }
        }
        if (Array.isArray(config)) {
            config = config[index];
        }
        Promise.resolve(config).then(webpackConfig => {
            const webpack = getWebpack();
            const outputOptions = getOutputOptions(webpackConfig, options);
            let hasCompletedOneCompile = false;

            const finishedCallback = (err, stats) => {
                if (err) {
                    error('Fatal error occured \n %s', err);
                    reject(err);
                }
                if (
                    stats.compilation.errors &&
                    stats.compilation.errors.length
                ) {
                    const message =
                        'Errors building ' +
                        chalk.yellow(getAppName(webpackConfig)) +
                        '\n' +
                        stats.compilation.errors
                            .map(error => {
                                return error.message;
                            })
                            .join('\n');
                    reject({
                        message: decorate(message, 'red'),
                        stats: JSON.stringify(
                            stats.toJson(outputOptions),
                            null,
                            2,
                        ),
                    });
                }
                if (!silent) {
                    if (options.stats) {
                        rawLog(stats.toString(outputOptions));
                    }
                    info(
                        'Finished building %s within %s seconds',
                        chalk.yellow(getAppName(webpackConfig)),
                        chalk.blue((stats.endTime - stats.startTime) / 1000),
                    );
                }
                resolve(
                    options.stats
                        ? JSON.stringify(stats.toJson(outputOptions), null, 2)
                        : '',
                );
            };
            if (!silent) {
                info(
                    'Started building %s',
                    chalk.yellow(getAppName(webpackConfig)),
                );
            }
            const compiler = webpack(webpackConfig);
            compiler.run(finishedCallback);
        });
    });
