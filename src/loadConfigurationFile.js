import { jsVariants } from 'interpret';
import { endsWith } from 'lodash';
import chalk from 'chalk';

export const availableExtensions = Object.keys(jsVariants).sort((a, b) => {
    // sort extensions to ensure that .babel.js and
    // similar ones are always matched before .js
    const res = -(a.split(/\./).length - b.split(/\./).length);
    // all things being equal, we need to
    // prioritize .js as it is most likely
    if (res === 0) {
        if (a === '.js') {
            return -1;
        }
        if (b === '.js') {
            return 1;
        }
        return 0;
    }
    return res;
});

export const getMatchingLoader = (
    configPath,
    extensions = availableExtensions,
    variants = jsVariants,
) => {
    const ext = extensions.find(ext => endsWith(configPath, ext));
    return ext ? variants[ext] : null;
};

const callConfigFunction = fn =>
    fn(require('minimist')(process.argv, { '--': true }).env || {});

const getConfig = configPath => {
    const configModule = require(configPath);
    const configDefault =
        configModule && configModule.__esModule
            ? configModule.default
            : configModule;
    return typeof configDefault === 'function'
        ? callConfigFunction(configDefault)
        : configDefault;
};

export default (configPath, getMatchingLoaderFn = getMatchingLoader) => {
    const mod = getMatchingLoaderFn(configPath);

    if (mod) {
        const mods = Array.isArray(mod) ? mod : [mod];
        const installed = mods.some(mod => {
            if (typeof mod === 'string') {
                try {
                    require(mod);
                    return true;
                } catch (ignored) {}
            } else if (typeof mod === 'object') {
                try {
                    var s = require(mod.module);
                    mod.register(s);
                    return true;
                } catch (ignored) {}
            }
        });

        if (!installed) {
            throw new Error(
                'Could not load required module loading for ' +
                    chalk.underline(configPath),
            );
        }
    }
    return getConfig(configPath);
};
