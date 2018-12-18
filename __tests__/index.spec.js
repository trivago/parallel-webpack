jest.mock('testConfig.js', () => ({}), { virtual: true });
jest.useFakeTimers();

import { run } from '../index';
import workerFarm  from 'worker-farm';
import Bluebird, {
    promisify,
    error,
    then,
    asCallback,
} from 'bluebird';

describe('index.js', () => {
    describe('run', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        afterEach(() => {
            process.removeAllListeners('SIGINT');
        })

        it('should reject promise config cannot get loaded', () => {
            const returnPromise = run('./does/not/exist.js', { colors: false }, jest.fn());
            expect(returnPromise.reject.mock.calls[0][0].toString()).toMatchSnapshot();
        });

        it('should reject promise if options validation fails', () => {
            const returnPromise = run('testConfig.js', { maxConcurrentWorkers: 'fail' }, jest.fn());
            expect(returnPromise.reject.mock.calls[0]).toMatchSnapshot();
        });

        it('should call generate workers and return farm promise', () => {
            jest.spyOn(console, 'log').mockImplementation(() => {});
            promisify.mockReturnValueOnce(jest.fn());

            const returnPromise = run('testConfig.js', { colors: false }, jest.fn());
            expect(workerFarm.mock.calls[0][0]).toEqual({ maxRetries: 0 });

            expect(returnPromise).toBe(Bluebird);
            expect(promisify).toHaveBeenCalledTimes(1);
            expect(error).toHaveBeenCalledTimes(1);
            expect(then).toHaveBeenCalledTimes(2);
            expect(Bluebird.finally).toHaveBeenCalledTimes(1);
            expect(asCallback).toHaveBeenCalledTimes(1);
        });

        describe('error callback', () => {
            beforeEach(() => {
                jest.spyOn(console, 'log').mockImplementation(() => {});
                jest.spyOn(Date, 'now')
                    .mockImplementationOnce(() => 0)
                    .mockImplementationOnce(() => 300);
            });

            const errorCbTest = options => {
                promisify.mockReturnValueOnce(jest.fn());

                const returnPromise = run('testConfig.js', {
                    json: options.silent,
                    colors: false
                }, jest.fn());
                const cb = returnPromise.error.mock.calls[0][0];
                const response = cb('Exception on worker farm');

                expect(response).toBe(Bluebird);
                expect(Bluebird.reject).toHaveBeenCalledWith('Exception on worker farm');
                if (options.silent) {
                    expect(console.log).not.toHaveBeenCalled();
                } else {
                    expect(console.log.mock.calls).toMatchSnapshot();
                }
            };

            it('should log and reject with error', () => {
                errorCbTest({ silent: false });
            });
            it('should only reject with error when silent', () => {
                errorCbTest({ silent: true });
            });
        });

        describe('then callback', () => {
            beforeEach(() => {
                jest.spyOn(console, 'log').mockImplementation(() => {});
                jest.spyOn(Date, 'now')
                    .mockImplementationOnce(() => 30000)
                    .mockImplementationOnce(() => 0);
            });

            const thenCbTest = options => {
                promisify.mockReturnValueOnce(jest.fn());

                const returnPromise = run('testConfig.js', {
                    json: options.silent,
                    colors: false
                }, jest.fn());
                const cb = returnPromise.then.mock.calls[1][0];
                const response = cb([true, true, false, undefined, '', 0]);

                expect(response).toEqual([ true, true ]);
                if(options.silent) {
                    expect(console.log).not.toHaveBeenCalled();
                } else {
                    expect(console.log.mock.calls).toMatchSnapshot();
                }
            };

            it('should filter non-truthy and return results', () => {
                thenCbTest({ silent: false });
            });
            it('should not log when silent', () => {
                thenCbTest({ silent: true });
            });
        });

        describe('finally callback', () => {
            it('should call end workerFarm and remove SIGINT listener', () => {
                promisify.mockReturnValueOnce(jest.fn());

                const returnPromise = run('testConfig.js', { colors: false }, jest.fn());
                const cb = returnPromise.finally.mock.calls[0][0];

                expect(process.listenerCount('SIGINT')).toBe(1);
                cb();
                jest.runOnlyPendingTimers();
                expect(process.listenerCount('SIGINT')).toBe(0);

                // called with workers
                expect(workerFarm.end.mock.calls[0][0]).toBe(workerFarm.end);
            });
            it('should call keepAliveAfterFinishCallback if flag is set', () => {
                const options = {};
                Object.defineProperty(options, 'keepAliveAfterFinish', {
                    value: 500
                });
                const keepAliveAfterFinishCallback = jest.fn(() => {
                    setTimeout(expect.any(Function), options.keepAliveAfterFinish);
                });
                keepAliveAfterFinishCallback();
                expect(setTimeout).toHaveBeenCalledTimes(1);
                expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 500);
            });
        });

        describe('shutdownCallback', () => {
            const shutdownTest = options => {
                promisify.mockReturnValueOnce(jest.fn());

                const returnPromise = run('testConfig.js', {
                    json: options.silent,
                    colors: false
                }, jest.fn());

                expect(process.listenerCount('SIGINT')).toBe(1);

                process.emit('SIGINT');
                // called with workers
                expect(workerFarm.end.mock.calls[0][0]).toBe(workerFarm.end);
                if(options.silent) {
                    expect(console.log).not.toHaveBeenCalled();
                } else {
                    expect(console.log.mock.calls).toMatchSnapshot();
                }
            };

            it('should call end  and remove callback', () => {
                shutdownTest({ silent: false });
            });

            it('should call end  and remove callback silently', () => {
                shutdownTest({ silent: true });

            });
        });
    });

});
