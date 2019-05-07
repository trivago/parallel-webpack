jest.mock('fs');

import fs from 'fs';

import findConfigFile from '../findConfigFile';

const possibleExtensions = [
    '',
    '.js',
    '.babel.js',
    '.babel.ts',
    '.buble.js',
    '.cirru',
    '.cjsx',
    '.co',
    '.coffee',
    '.coffee.md',
    '.eg',
    '.esm.js',
    '.iced',
    '.iced.md',
    '.jsx',
    '.litcoffee',
    '.liticed',
    '.ls',
    '.ts',
    '.tsx',
    '.wisp'
];

describe('findConfigFile', () => {
    it('should throw error when config file not exists', () => {
        fs.accessSync.mockImplementation(() => {throw new Error()});

        expect(() => {
            findConfigFile('/path/to/file');
        }).toThrow('File does not exist');
    });

    it('should try for all of possible file extensions', () => {
        fs.accessSync.mockImplementation(() => {throw new Error()});

        expect(() => {
            findConfigFile('/path/to/file');
        }).toThrow('File does not exist');

        possibleExtensions.forEach((ext, index) => {
            expect(fs.accessSync.mock.calls[index][0]).toBe('/path/to/file' + ext);
        });

    });
    it('should use statSync when accessSync is not available', () => {
        fs.accessSync = null;
        fs.statSync = jest.fn(() => { isFile: jest.fn().mockReturnValue(false)})

        expect(() => {
            findConfigFile('/path/to/file')
        }).toThrow();

        expect(fs.statSync).toHaveBeenCalledTimes(possibleExtensions.length);
    });

    it('should return file from accessSync', () => {
        fs.accessSync = jest.fn();

        expect(findConfigFile('/path/to/file')).toBe('/path/to/file');
    });

    it('should return file from statSync', () => {
        fs.accessSync =  null;
        fs.statSync = jest.fn(() => ({ isFile: jest.fn().mockReturnValue(true)}));

        expect(findConfigFile('/path/to/file')).toBe('/path/to/file');
    })
});
