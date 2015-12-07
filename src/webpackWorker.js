/**
 * Created by pgotthardt on 07/12/15.
 */

var Promise = require('bluebird');

function getWebpack() {
    try {
        return require(process.cwd() + '/node_modules/webpack');
    } catch(e) {
        return require('webpack');
    }
}

function getAppName(webpackConfig) {
    return webpackConfig.output.filename.replace('[name]', webpackConfig.appName);
}

/**
 * Create a single webpack build using the specified configuration.
 * Calls the done callback once it has finished its work.
 *
 * @param {string} configuratorFileName The app configuration filename
 * @param {boolean} watch If `true`, then the webpack watcher is being run; if `false`, runs only ones
 * @param {Number} index The configuration index
 * @param {Function} done The callback that should be invoked once this worker has finished the build.
 */
module.exports = function(configuratorFileName, watch, index, done) {
    var config = require(configuratorFileName);
    if(Array.isArray(config)) {
        config = config[index];
    }
    Promise.resolve(config).then(function(webpackConfig) {
        var webpack = getWebpack(),
            finishedCallback = function(err, stats) {
                if(err) {
                    console.error('[WEBPACK] Error building %s', webpackConfig.output.filename);
                    console.log(err);
                    return;
                }
                console.log(stats.toString({
                    colors: true
                }));
                console.log('[WEBPACK] Finished building %s', getAppName(webpackConfig));
                if(!watch) done();
            };
        if(!webpackConfig.plugins) {
            webpackConfig.plugins = [];
        }
        webpackConfig.plugins.push(function() {
            this.plugin('done', function(stats) {
                if (stats.compilation.errors && stats.compilation.errors.length) {
                    console.log(stats.compilation.errors);
                    process.exit(1);
                }
            });
        });
        console.log('[WEBPACK] Started %s %s', watch ? 'watching' : 'building', getAppName(webpackConfig));
        var compiler = webpack(webpackConfig),
            watcher;
        if(watch || webpack.watch) {
            watcher = compiler.watch({}, finishedCallback);
        } else {
            compiler.run(finishedCallback);
        }

        process.on('SIGINT', function() {
            console.log('[WEBPACK] Forcefully shutting down %s', getAppName(webpackConfig));
            watcher.close(done);
        });
    });
};
