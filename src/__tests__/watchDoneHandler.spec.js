let watchDoneHandler;
let ipc;

describe('watchDoneHandler', () => {
    beforeEach(() => {
        watchDoneHandler = require('../watchDoneHandler');
        ipc = {
            server: {
                stop: jest.fn()
            }
        }
    });

     describe('watchDoneHandler', () => {
        it('should remove index 1 from config', () => {
            let configIndices = [0, 1];
            let callback = jest.fn();
            watchDoneHandler(null, null, configIndices, 1);
            expect(configIndices).toEqual([0]);
        });

        it('should stop server and invoke callback', () => {
            let configIndices = [0, 1];
            let callback = jest.fn();
            watchDoneHandler(callback, ipc, configIndices, 0);
            watchDoneHandler(callback, ipc, configIndices, 1);
            expect(configIndices).toEqual([]);
            expect(callback).toHaveBeenCalled();
            expect(ipc.server.stop).toHaveBeenCalled();
        });

        it('should stop server', () => {
            let configIndices = [0, 1];
            let callback = jest.fn();
            watchDoneHandler(null, ipc, configIndices, 0);
            watchDoneHandler(null, ipc, configIndices, 1);
            expect(configIndices).toEqual([]);
            expect(ipc.server.stop).toHaveBeenCalled();
        });
    });
});
