import fs from 'fs';
import { jsVariants } from 'interpret';
import { decorate } from './logger';

const potentialExtensions = ['', ...Object.keys(jsVariants)];

const checkWithAccess = path => {
    try {
        fs.accessSync(path);
        return true;
    } catch (ignore) {
        return false;
    }
};

const checkWithStatSync = path => {
    try {
        var stats = fs.statSync(path);
        return stats.isFile();
    } catch (ignore) {
        return false;
    }
};

const exists = path =>
    fs.accessSync ? checkWithAccess(path) : checkWithStatSync(path);

module.exports = configPath => {
    const ext = potentialExtensions.find(ext => exists(configPath + ext));
    // can be extensionless
    if (ext !== undefined) {
        return configPath + ext;
    }
    throw new Error(decorate('File does not exist', 'red'));
};
