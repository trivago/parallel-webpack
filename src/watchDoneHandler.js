/**
 * Handler for done event
 * @param data - the configuration index of the completed webpack run
 */
module.exports = function watchDoneHandler(callback, ipc, configIndices, data) {
    // Once every configuration has completed once, stop the server and invoke the callback
    configIndices.splice(configIndices.indexOf(data), 1);
    if (!configIndices.length) {
        ipc.server.stop();

        if (typeof callback === 'function') {
            callback();
        }
    }
};
