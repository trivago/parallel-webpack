import jestWorker from 'jest-worker';
import { createFarm, startFarm } from '../farm';
import settle from 'p-settle';

jest.mock('jest-worker');
jest.mock('p-settle');

jestWorker.mockImplementation(() => ({
    isConstructorCalled: true,
}));
settle.mockImplementation((...args) =>
    require.requireActual('p-settle')(...args),
);
process.env.FORCE_COLOR = 0;
describe('Farm utils', () => {
    describe('createFarm', () => {
        it('should create webpackWorkers with passed options', () => {
            const farm = createFarm({ json: false });
            expect(jestWorker).toHaveBeenCalledWith(
                require.resolve('../webpackWorker'),
                {
                    forkOptions: { stdio: [0, 1, 2, 'ipc'] },
                    json: false,
                },
            );
            expect(farm).toEqual({ isConstructorCalled: true });
        });
    });
    describe('startFarm', () => {
        const configs = [{}, {}, {}];
        let webpackOptions;
        let farm;
        beforeEach(() => {
            jest.clearAllMocks();
            jest.spyOn(console, 'log').mockImplementationOnce(() => {});
            webpackOptions = { optimize: false, env: 'prod', color: false };
            farm = {
                build: jest.fn((...args) => args),
            };
        });
        it('should run workers', async () => {
            const result = await startFarm(
                configs,
                '/path/to/cfg',
                webpackOptions,
                farm,
            );
            expect(result).toMatchSnapshot();
        });
        it('should bail out', async () => {
            webpackOptions = {
                ...webpackOptions,
                bail: true,
                json: true,
            };
            const farm = {
                build: jest.fn(
                    (configPath, options, i, length) =>
                        i === 1
                            ? Promise.reject('Failed at index 1')
                            : Promise.resolve('resolved index' + i),
                ),
            };
            let result;
            try {
                result = await startFarm(
                    configs,
                    '/path/to/cfg',
                    webpackOptions,
                    farm,
                );
                fail('it should go to catch');
            } catch (err) {
                expect(err).toBe('Failed at index 1');
                expect(result).not.toBeDefined();
                expect(console.log.mock.calls).toMatchSnapshot();
            }
        });

        it('should settle all results', async () => {
            webpackOptions = {
                ...webpackOptions,
                bail: false,
            };
            const farm = {
                build: jest.fn((configPath, options, i, length) => {
                    if (i === 1) {
                        return Promise.reject('Failed at index 1');
                    } else {
                        return Promise.resolve('resolved index' + i);
                    }
                }),
            };

            let result;
            try {
                result = await startFarm(
                    configs,
                    '/path/to/cfg',
                    webpackOptions,
                    farm,
                );
            } catch (error) {
                expect(console.log.mock.calls).toMatchSnapshot();
                expect(error).toBe('Failed at index 1');
                expect(result).not.toBeDefined();
            }
        });
    });
});
