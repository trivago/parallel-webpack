#! /usr/bin/env node

const run = require('../dist/index').run;
const path = require('path');
const chalk = require('chalk');
const findConfigFile = require('../dist/findConfigFile');
const argv = require('minimist')(process.argv.slice(2), {
    '--': true,
    default: {
        'max-retries': Infinity,
        // leave off file extension so that we can find the most appropriate one
        config: 'webpack.config',
        parallel: require('os').cpus().length - 1,
        json: false,
        colors: require('supports-color'),
        bail: true,
        stats: true,
    },
    alias: {
        m: 'max-retries',
        p: 'parallel',
        v: 'version',
    },
});

let configPath;

if (argv.version) {
    process.stdout.write(
        'parallel-webpack ' + chalk.blue(require('../package').version) + '\n'
    );
} else {
    try {
        chalk.enabled = argv.colors;
        configPath = findConfigFile(path.resolve(argv.config));

        run(configPath, {
            maxRetries: argv['max-retries'],
            numWorkers: argv['parallel'],
            bail: argv.bail,
            json: argv.json,
            modulesSort: argv['sort-modules-by'],
            chunksSort: argv['sort-chunks-by'],
            assetsSort: argv['sort-assets-by'],
            exclude: argv['display-exclude'],
            colors: argv['colors'],
            stats: argv['stats'],
            argv: argv['--'],
        })
            .then(function(stats) {
                if (argv.json && stats) {
                    process.stdout.write(
                        JSON.stringify(
                            stats.map(function(stat) {
                                return JSON.parse(stat);
                            }),
                            null,
                            2
                        ) + '\n'
                    );
                }
            })
            .catch(function(err) {
                console.log(err.message);
                process.exit(1);
            });
    } catch (e) {
        if (e.message) {
            process.stdout.write(e.message + '\n');
            console.error(e.error);
        } else {
            process.stdout.write(
                chalk.red('[WEBPACK]') +
                    ' Could not load configuration ' +
                    chalk.underline(process.cwd() + '/' + argv.config) +
                    '\n'
            );
        }
        process.exit(1);
    }
}
