import chalk from 'chalk';

const DECORATOR = '[WEBPACK]';

export const info = (string, ...subStrings) => {
    console.log(`${chalk.blue(DECORATOR)} ${string}`, ...subStrings);
};
export const warning = (string, ...subStrings) => {
    console.log(`${chalk.yellow(DECORATOR)} ${string}`, ...subStrings);
};
export const error = (string, ...subStrings) => {
    console.error(`${chalk.red(DECORATOR)} ${string}`, ...subStrings);
};
export const rawLog = (string, ...subStrings) => {
    console.log(`${string}`, ...subStrings);
};
export const decorate = (string, color) =>
    `${chalk[color](DECORATOR)} ${string}`;
export default {
    info,
    warning,
    error,
    rawLog,
    decorate,
};
