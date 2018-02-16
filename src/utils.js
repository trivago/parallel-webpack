import Ajv from 'ajv';
import schema from '../schema.json';
import loadConfigurationFile from './loadConfigurationFile';
import { decorate } from './logger';
import chalk from 'chalk';

export const validateOptions = farmOptions => {
    const validate = new Ajv({
        allErrors: true,
        coerceTypes: true,
        removeAdditional: 'all',
        useDefaults: true,
    }).compile(schema);

    if (!validate(farmOptions)) {
        const errorMessage = validate.errors
            .map(({ dataPath, message }) => {
                return `Property: "options ${dataPath}" ${message}`;
            })
            .join('\n');
        return Promise.reject(
            `Options validation failed:
            ${errorMessage}
            `,
        );
    }
    return Promise.resolve('Options validation succeeded.');
};
export const loadConfig = (configPath, options) => {
    const argvBackup = process.argv;
    try {
        process.argv = options.argv;
        const config = loadConfigurationFile(configPath);
        process.argv = argvBackup;
        return Promise.resolve(config);
    } catch (e) {
        process.argv = argvBackup;
        return Promise.reject(
            new Error(
                decorate(
                    `Could not load configuration file ${chalk.underline(
                        configPath,
                    )} \n ${e}`,
                    'red',
                ),
            ),
        );
    }
};
