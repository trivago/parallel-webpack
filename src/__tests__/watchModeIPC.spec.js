let webpackWorker;
let nodeIpc;
let serveSpy;
jest.mock('node-ipc');

describe('watchModeIPC', () => {
    beforeEach(() => {
        webpackWorker = require('../watchModeIPC.js');
        nodeIpc = require('node-ipc');
        nodeIpc.server = {
            start: jest.fn()
        };
        nodeIpc.of = {
            webpack: {
                emit: jest.fn()
            }
        };

        nodeIpc.connectTo = function(serverName, onConnect) {
            onConnect();
        }
    });

    describe('startWatchIPCServer', () => {
        it('should start ipc socket server', () => {
            webpackWorker.startWatchIPCServer();
            expect(nodeIpc.config.id).toEqual('webpack');
            expect(nodeIpc.config.retry).toEqual(3);
            expect(nodeIpc.config.silent).toEqual(true);
            expect(nodeIpc.serve).toHaveBeenCalled();
            expect(nodeIpc.server.start).toHaveBeenCalled();
        });
    });

     describe('notifyIPCWatchCompileDone', () => {
        it('should call connectTo', () => {
            webpackWorker.notifyIPCWatchCompileDone(0);
            expect(nodeIpc.config.id).toEqual('webpack0');
            expect(nodeIpc.config.stopRetrying).toEqual(3);
            expect(nodeIpc.config.silent).toEqual(true);
            expect(nodeIpc.of.webpack.emit).toHaveBeenCalledWith('done', 0);
        })
    });
});
