const run = jest.fn();
const close = jest.fn();
const watch = jest.fn().mockReturnValue({ close });
const compiler = jest.fn().mockReturnValue({ run, watch });

jest.setMock('webpack', compiler); // try to get rid of this.
jest.mock('../watchModeIPC');
jest.mock('webpack/lib/Stats');

let webpackWorker;
let promiseMock;
let webpackMock;
let webpackStatsMock;
let notifyIPCWatchCompileDone;

describe('webpackWorker', () => {
    beforeEach(() => {
        promiseMock = require('bluebird');
        webpackMock = require('webpack');
        webpackStatsMock = require('webpack/lib/Stats');
        webpackWorker = require('../webpackWorker.js');
        notifyIPCWatchCompileDone = require('../watchModeIPC').notifyIPCWatchCompileDone;
        jest.doMock('testConfig', () => ({ webpack: 'config' }), { virtual: true });
        jest.resetModules();
        jest.clearAllMocks();
        process.removeAllListeners();
    });

    describe('arguments', () => {
        describe('options', () => {

            let _argv;
            beforeEach(() => {
                _argv = process.argv;
            });
            afterEach(() => {
                process.argv = _argv;
            });

            const optionsTest = (options) => {
                const finishStats = {
                        compilation: {},
                        startTime: 1500034498,
                        endTime: 1500054500,
                };
                const doneCallback = jest.fn();
                jest.spyOn(console, 'log').mockImplementation(() => {});


                webpackWorker('testConfig', options , 0, 1, doneCallback);
                const thenCb = promiseMock.then.mock.calls[0][0];
                thenCb({ webpack: 'config', name: 'testApp' });
                const finishedCallback = run.mock.calls[0][0];
                finishedCallback(null, finishStats);

                expect(doneCallback).toHaveBeenCalled();
                if (options.json) {
                    expect(console.log).not.toHaveBeenCalled();
                } else {
                    expect(console.log).toHaveBeenCalledTimes(2);
                    expect(console.log).toHaveBeenLastCalledWith(
                        '%s Finished building %s within %s seconds',
                        '[WEBPACK]',
                        'testApp',
                        '20.002'
                    );
                }

                if (options.argv) {
                    expect(process.argv).toEqual(options.argv);
                }
            };


            it('should report json only when json: true', () => {
                optionsTest({ json: true });
            });

            it('should report to console as well only when json: false', () => {
                optionsTest({ json: false });
            });

            it('should set process arguments to the passed ones', () => {
                optionsTest({ json:true, argv: ['--watch', '--bail']});
            });

            it('should call done with stats when there is stats object', () => {
                const doneCallback = jest.fn();
                const statsObj = {
                    compilation: {
                        errors: [
                            { message: 'module not found' },
                            { message: 'module not found 2' },
                        ]
                    },
                    toJson: jest.fn().mockReturnThis()
                };
                webpackWorker('testConfig', {}, 0, 1, doneCallback);
                const thenCb = promiseMock.then.mock.calls[0][0];
                thenCb({ webpack: 'config', name: 'testApp' });
                let finishedCallback = run.mock.calls[0][0];

                expect(process.listenerCount('SIGINT')).toBe(1);
                finishedCallback(null, statsObj);

                expect(process.listenerCount('SIGINT')).toBe(0);
                expect(doneCallback).toHaveBeenCalled();
                expect(doneCallback.mock.calls[0][0]).toMatchSnapshot();

            });

            it('should log in watch mode instead of calling done callback', () => {
                jest.useFakeTimers();
                const _temp = global.Date;
                global.Date = jest.fn(() => (
                    {
                        toTimeString: jest.fn().mockReturnValue({
                            split: jest.fn().mockReturnValue(["12:05:54"])
                        })
                    }
                ));
                jest.spyOn(console, 'log');
                const doneCallback = jest.fn();
                const statsObj = {
                    compilation: {
                        errors: [
                            { message: 'module not found' },
                            { message: 'module not found 2' },
                        ]
                    },
                    toJson: jest.fn().mockReturnThis()
                };
                webpackWorker('testConfig', { watch: true }, 0, 1, doneCallback);
                const thenCb = promiseMock.then.mock.calls[0][0];
                thenCb({ webpack: 'config', name: 'testApp' });
                let finishedCallback = watch.mock.calls[0][1];

                expect(process.listenerCount('SIGINT')).toBe(1);
                finishedCallback(null, statsObj);

                expect(process.listenerCount('SIGINT')).toBe(1);
                expect(doneCallback).not.toHaveBeenCalled();
                expect(console.log.mock.calls).toMatchSnapshot();
                expect(notifyIPCWatchCompileDone).toHaveBeenCalledWith(0);
                process.removeAllListeners('SIGINT');
                jest.useRealTimers();
                global.Date = _temp;
            });

        });

        describe('multi config options', () => {
            const multiConfigTest = options => {
                const errorMessage = '[WEBPACK] There is a difference between the amount of the provided configs. Maybe you where expecting command line arguments to be passed to your webpack.config.js. If so, you\'ll need to separate them with a -- from the parallel-webpack options.'
                jest.doMock('multiTestConfig', () => ( [{ fail: true}, { webpack: 'config'}]), { virtual: true });
                jest.doMock('testConfig', () => ({ webpack: 'config' }), { virtual: true });
                jest.spyOn(console, 'error').mockImplementation(() => {});

                webpackWorker(
                    options.multi ?  'multiTestConfig' : 'testConfig',
                    { json: true },
                    options.configIndex,
                    options.expectedConfigs,
                    jest.fn()
                );
                const allConfigs = promiseMock.resolve.mock.calls[0][0];
                const thenCb = promiseMock.then.mock.calls[0][0];
                if (options.multi && options.expectedConfigs < 3) {
                    const targetConfig = allConfigs[options.configIndex];
                    thenCb(allConfigs)
                    expect(compiler.mock.calls[0][0]).toEqual(targetConfig);
                } else {
                    expect(() => thenCb(allConfigs)).toThrow(errorMessage)
                    expect(console.error).toHaveBeenCalled();
                }
            }

            it('should select the correct indexed one if configs are array', () => {
                multiConfigTest({ multi: true, configIndex: 1, expectedConfigs: 2 });
            });

            it('should fail if expectedConfigLength > 1 in case of single config', () => {
                multiConfigTest({ multi: false, configIndex: 1, expectedConfigs: 2 });
            });

            it('should fail if expectedConfigLength dont match with config.length', () => {
                multiConfigTest({ multi: true, configIndex: 1, expectedConfigs: 3 });
            });

            it('should be able to handle config function return promise of array of config object', () => {
                const originalConfigs = [{ webpack: 'config' }, { webpack: 'config2' }];
                jest.doMock('promiseReturnConfigArray', () => Promise.resolve(originalConfigs), { virtual: true });
                const configIndex = 1
                const expectedConfigLength = 2
                 webpackWorker(
                    'promiseReturnConfigArray',
                    { json: true },
                    configIndex,
                    expectedConfigLength,
                    jest.fn()
                )
                const thenCb = promiseMock.then.mock.calls[0][0];
                const targetConfig = originalConfigs[configIndex];
                thenCb(originalConfigs);
                expect(compiler.mock.calls[0][0]).toEqual(targetConfig);
            })
        })
    });

    describe('module functions', () => {
        describe('getAppName', () => {
            const getAppNameTest = (options, appName) => {
                const doneCallback = jest.fn();
                jest.spyOn(console, 'log');
                webpackWorker('testConfig', { json: false }, 0, 1, doneCallback);

                const thenCb = promiseMock.then.mock.calls[0][0];
                thenCb(Object.assign({ webpack: 'config' }, options));

                let finishedCallback = run.mock.calls[0][0];
                finishedCallback(null, { compilation: {}});

                expect(console.log.mock.calls[1][2]).toBe(appName);
            };

            it('should get the name from config.name', () => {
                getAppNameTest({ name: 'testApp' }, 'testApp');
            });

            it('should get the name from output.filename', () => {
                getAppNameTest(
                    {
                        output: {
                            filename: 'test.app.js'
                        }
                    },
                    'test.app.js'
                );
            });

            it('should replace "[name]" pattern if there is one entry point', () => {
                getAppNameTest(
                    {
                        output: {
                            filename: 'bundle.[name].js',
                        },
                        entry: {
                            testApp: 'filepath',
                        }
                    },
                    'bundle.testApp.js'
                );
            });

            it('should replace all matches of "[name]" pattern if there is one entry point', () => {
                getAppNameTest(
                    {
                        output: {
                            filename: 'bundle/[name]/[name].js',
                        },
                        entry: {
                            testApp: 'filepath',
                        }
                    },
                    'bundle/testApp/testApp.js'
                );
            });
        });

        describe('getOutputOptions', () => {
            it('should get stats options if they set', () => {
                const statsObj = {
                    compilation: {
                    },
                    toString: jest.fn().mockReturnValue('size: 321.kb'),
                    toJson: jest.fn().mockReturnValue('size: 321.kb')
                };
                jest.spyOn(console, 'log');
                const doneCallback = jest.fn();
                webpackWorker('testConfig', {
                    stats: true,
                    modulesSort: 'name',
                    chunksSort: 'size',
                    assetsSort: 'name',
                    exclude: ['file'],
                    colors: true
                }, 0, 1, doneCallback);

                expect(promiseMock.resolve.mock.calls[0][0]).toEqual({ webpack: 'config' });
                const thenCb = promiseMock.then.mock.calls[0][0];
                thenCb({ webpack: 'config', name: 'testApp' });


                let finishedCallback = run.mock.calls[0][0];
                finishedCallback(null, statsObj);
                expect(statsObj.toString.mock.calls).toMatchSnapshot();
            });

            it('should translate stats string to object', () => {
                jest.spyOn(console, 'log');
                let presetToOptions = jest.spyOn(webpackStatsMock, 'presetToOptions');

                const doneCallback = jest.fn();

                webpackWorker('testConfig', {
                    stats: true,
                    modulesSort: 'name',
                    chunksSort: 'size',
                    assetsSort: 'name',
                    exclude: ['file'],
                    colors: true
                }, 0, 1, doneCallback);

                expect(promiseMock.resolve.mock.calls[0][0]).toEqual({ webpack: 'config' });
                const thenCb = promiseMock.then.mock.calls[0][0];
                thenCb({ webpack: 'config', name: 'testApp', 'stats': 'verbose' });

                expect(presetToOptions).toHaveBeenCalled();
            })
        });
    });

    describe('creator function', () => {
        describe('shutdownCallback', () => {

            let _exit;
            beforeEach(() => {
                _exit = process.exit;
            });
            afterEach(() => {
                process.exit  = _exit;
                process.removeAllListeners('SIGINT');
            });

            const shutdownCallbackTest = options => {
                const doneCallback = jest.fn();
                const statsObj = {
                    compilation: {
                        errors: [
                            { message: 'module not found' },
                            { message: 'module not found 2' },
                        ]
                    },
                    toJson: jest.fn().mockReturnThis()
                };
                process.exit = jest.fn();

                webpackWorker('testConfig', options , 0, 1, doneCallback);
                const thenCb = promiseMock.then.mock.calls[0][0];
                thenCb({ webpack: 'config', name: 'testApp' });
                const shutdownCallback = process.listeners('SIGINT')[0];
                shutdownCallback();


                if (options.watch) {
                    expect(close.mock.calls[0][0]).toBe(doneCallback);
                    expect(doneCallback.mock.calls[0][0]).toMatchSnapshot();
                } else {
                    expect(close).not.toHaveBeenCalled();
                    expect(doneCallback.mock.calls[0][0]).toMatchSnapshot();
                }
            };

            it('should watcher.close and done in watch mode on SIGINT', () => {
                shutdownCallbackTest({ watch: true });
            });

            it('should call done callback', () => {
                shutdownCallbackTest({ watch: false });
            });
        });

        describe('finishedCallback', () => {
            const finishCbTest = options => {
                const statsObj = {
                    compilation: {
                    },
                    toString: jest.fn().mockReturnValue('size: 321.kb'),
                    toJson: jest.fn().mockReturnValue('size: 321.kb')
                };
                const doneCallback = jest.fn();
                jest.spyOn(console, 'log');
                jest.spyOn(console, 'error');

                webpackWorker('testConfig', options.worker, 0, 1, doneCallback);
                expect(promiseMock.resolve.mock.calls[0][0]).toEqual({ webpack: 'config' });

                const thenCb = promiseMock.then.mock.calls[0][0];
                thenCb({ webpack: 'config', name: 'testApp' });
                expect(process.listenerCount('SIGINT')).toBe(1);

                let finishedCallback = run.mock.calls[0][0];


                if (options.isError) {
                    finishedCallback({ error: 'Exception' }, { compilation: {}});
                    expect(console.error).toHaveBeenCalledTimes(2);
                    expect(doneCallback.mock.calls[0]).toEqual([{error: 'Exception'}]);
                } else if (options.isStats) {
                    finishedCallback(null, statsObj);
                    expect(doneCallback.mock.calls[0]).toMatchSnapshot();
                    expect(console.log.mock.calls[1]).toEqual(['size: 321.kb']);
                } else { // success
                    finishedCallback(null, statsObj);
                    expect(doneCallback.mock.calls[0]).toEqual([null, '']);
                }
                expect(process.listenerCount('SIGINT')).toBe(0);

            };

            it('should spit out error, remove SIGINT and close when an exception happen', () => {
                finishCbTest({
                    worker: { json: true },
                    isError: true
                });
            });

            it('should remove SIGINT and call done with stats', () => {
                finishCbTest({
                    worker: { stats: true },
                    isError: false,
                    isStats: true
                });
            });

            it('should set the promise and call done on success', () => {
                finishCbTest({
                    worker: { json: true },
                    isError: false,
                    isStats: false
                });
            });
        });
    });
});
