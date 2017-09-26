import { loadConfig, validateOptions } from '../utils';
import loadConfigurationFile from '../loadConfigurationFile';
jest.mock('../loadConfigurationFile');

describe('Utility functions', () => {
    describe('loadConfig', () => {
        const testConfig = {
            name: 'testconfig',
        };
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it('should resolve when load is successful', () => {
            loadConfigurationFile.mockImplementationOnce(() => testConfig);
            expect(loadConfig('/path/to/webpack', {})).resolves.toEqual(
                testConfig,
            );
        });
        it('should reject when load is unsuccessful', () => {
            loadConfigurationFile.mockImplementationOnce(() => {
                throw new Error('File not existing');
            });
            expect(
                loadConfig('/path/to/webpack', {}),
            ).rejects.toMatchSnapshot();
        });
    });

    describe('validateOptions', () => {
        it('should resolve when validation is successful', () => {
            expect(
                validateOptions({
                    maxRetries: 3,
                    numWorkers: 6,
                    forkOptions: {
                        stdio: 'pipe',
                    },
                }),
            ).resolves.toBe('Options validation succeeded.');
        });

        it('should reject with error when validation is unsuccessful', () => {
            expect(
                validateOptions({
                    maxRetries: '3',
                    forkOptions: [],
                }),
            ).rejects.toMatchSnapshot();
        });
    });
});
