var ipc = require('node-ipc'),
    serverName = 'webpack',
    watchDoneHandler = require('./watchDoneHandler');

module.exports = {

    /**
     * Start IPC server and listens for 'done' message from child processes
     * @param {any} callback - callback invoked once 'done' has been emitted by each confugration
     * @param {Function} watchCallback - callback invoked on every webpack compile in watch mode
     * @param {any} configIndices - array indices of configuration
     */
    startWatchIPCServer: function startWatchIPCServer(callback, watchCallback, configIndices) {
        ipc.config.id = serverName;
        ipc.config.retry = 3;
        ipc.config.silent = true;

        var dontStopServer = !!watchCallback;

        ipc.serve(
            function() {
                ipc.server.on(
                    'done',
                    watchDoneHandler.bind(this, callback, ipc, configIndices, dontStopServer)
                );
                if (watchCallback) {
                    ipc.server.on(
                        'watchCallback',
                        watchCallback.bind(null, [].concat(configIndices))
                    )
                }
            }
        );

        ipc.server.start();
    },

    /*
    * Notifies parent process that a complete compile has occured in watch mode
    * @param {any} index
    */
    notifyIPCWatchCompileDone: function notifyIPCWatchCompileDone(index) {
        ipc.config.id = serverName + index;
        ipc.config.stopRetrying = 3;
        ipc.config.silent = true;

        ipc.connectTo(
            serverName,
            function() {
                ipc.of.webpack.emit('done', index);
            }
        );
    },

    notifyIPCWatchCallback: function notifyIPCWatchCallback(index) {
        ipc.config.id = serverName + index;
        ipc.config.stopRetrying = 3;
        ipc.config.silent = true;

        ipc.connectTo(
            serverName,
            function() {
                ipc.of.webpack.emit('watchCallback', index);
            }
        );
    },
}
