jest.mock('configPath', () => ({ test: 'config' }), { virtual: true });

import loadConfigurationFile, {
    getMatchingLoader,
    availableExtensions,
} from '../loadConfigurationFile';

import { underline } from 'chalk';
import { jsVariants } from 'interpret';

describe('loadConfigurationFile module', () => {
    it('should require configPath when there is no matching loaders', () => {
        expect(loadConfigurationFile('configPath')).toEqual({ test: 'config' });
    });

    it('should sort the extensions', () => {
        const unsortedVariants = Object.keys(jsVariants);
        const sortedVariants = [
            '.buble.js',
            '.coffee.md',
            '.babel.js',
            '.iced.md',
            '.js',
            '.co',
            '.coffee',
            '.wisp',
            '.cirru',
            '.iced',
            '.cjsx',
            '.jsx',
            '.litcoffee',
            '.liticed',
            '.ls',
            '.ts',
            '.eg',
        ];

        expect(sortedVariants).toEqual(availableExtensions);
        expect(unsortedVariants).not.toEqual(availableExtensions);
    });

    describe('getMatchingLoader', () => {
        it('should get correct matcher', () => {
            availableExtensions.forEach(extension => {
                const expectedLoader = getMatchingLoader(
                    `configpath.${extension}`,
                );
                expect(expectedLoader).toEqual(jsVariants[extension]);
            });
        });

        it('should return null if cannot find loader', () => {
            const expectedLoader = getMatchingLoader(
                `configpath.unknownextension`,
            );
            expect(expectedLoader).toEqual(null);
        });
    });

    describe('loadConfigurationFile function', () => {
        const loadertest = loaderType => {
            jest.doMock('testloader', () => 'loaded', { virtual: true });
            jest.doMock('test.test', () => `testModuleFrom${loaderType}`, {
                virtual: true,
            });
            if (loaderType === 'Iteration') {
                jest.doMock(
                    'stopIterating',
                    () => fail('this should not happen'),
                    { virtual: true },
                );
            }
            jest.resetModules();

            const mockLoaderAsString = () => 'testloader';
            const mockLoaderAsObject = () => ({
                module: 'testloader',
                register: s => expect(s).toEqual('loaded'),
            });
            const mockLoaderAsArray = () => ['testloader'];
            const mockLoaderIteration = () => [
                'fail',
                { module: 'fail' },
                'testloader',
                'stopIterating',
            ];

            const mockGetLoader =
                loaderType === 'String'
                    ? mockLoaderAsString
                    : loaderType === 'Object'
                      ? mockLoaderAsObject
                      : loaderType === 'Array'
                        ? mockLoaderAsArray
                        : mockLoaderIteration;

            const result = loadConfigurationFile('test.test', mockGetLoader);
            expect(result).toBe(`testModuleFrom${loaderType}`);
        };

        it('should require loaders as string', () => {
            loadertest('String');
        });

        it('should require loaders as object', () => {
            loadertest('Object');
        });

        it('should require loaders as array', () => {
            loadertest('Array');
        });

        it('should iterate and stop when it is successfully loads a module', () => {
            loadertest('Iteration');
        });

        it('should throw when it cannot find module', () => {
            expect(() => {
                loadConfigurationFile('/does/not/exist.co');
            }).toThrow(
                `Could not load required module loading for ${underline(
                    '/does/not/exist.co',
                )}`,
            );
        });

        // not a string, object or array. Should never happen anyways
        it('should throw when the loader is not possible to evaluate', () => {
            expect(() => {
                loadConfigurationFile('/does/not/exist.co', () => [null]);
            }).toThrow(
                `Could not load required module loading for ${underline(
                    '/does/not/exist.co',
                )}`,
            );
        });

        it('should pass `env` when config exports a function', () => {
            jest.doMock('test.js', () => env => env, { virtual: true });
            const oldArgv = process.argv;
            process.argv = [
                '--env.foo',
                'bar',
                '--env.bar',
                '--foo',
                '--env.baz="foo bar"',
            ];
            const result = loadConfigurationFile('test.js', () => null);
            expect(result).toEqual({ foo: 'bar', bar: true, baz: '"foo bar"' });
            process.argv = oldArgv;
        });
    });
});
