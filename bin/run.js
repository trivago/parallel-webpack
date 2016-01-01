#! /usr/bin/env node

/**
 * Created by pgotthardt on 07/12/15.
 */
var run = require('../index').run,
    path = require('path'),
    argv = require('minimist')(process.argv.slice(2), {
        '--': true,
        default: {
            watch: false,
            'max-retries': Infinity,
            config: 'webpack.config.js',
            'parallel': require('os').cpus().length,
            json: false,
            colors: require('supports-color')
        },
        alias: {
            'm': 'max-retries',
            'p': 'parallel',
            'v': 'version'
        }
    }),
    configPath;

if(argv.version) {
    console.log('parallel-webpack ' + require('../package').version);
} else {
    try {
        configPath = path.resolve(argv.config);
        run(configPath, {
            watch: argv.watch,
            maxRetries: Number.parseInt(argv['max-retries'], 10),
            maxConcurrentWorkers: Number.parseInt(argv['parallel'], 10),
            bail: argv.bail,
            json: argv.json,
            modulesSort: argv['sort-modules-by'],
            chunksSort: argv['sort-chunks-by'],
            assetsSort: argv['sort-assets-by'],
            exclude: argv['display-exclude'],
            colors: argv['colors']
        }).then(function(stats) {
            if(argv.json && stats) {
                process.stdout.write(JSON.stringify(stats.map(function(stat) {
                    return JSON.parse(stat);
                }), null, 2) + "\n");
            }
        }).catch(function(err) {
            console.error(err);
        });
    } catch (e) {
        console.error('[WEBPACK] Could not load configuration %s', process.cwd() + '/' + argv.config);
        console.error(e);
    }
}
