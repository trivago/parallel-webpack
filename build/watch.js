const chokidar = require('chokidar');
const path = require('path');
const debounce = require('lodash.debounce');
const execSync = require('child_process').execSync;
const chalk = require('chalk');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.resolve(ROOT_DIR, 'src');
const BUILD_SCRIPT = path.resolve(ROOT_DIR, 'build/build.js');

const BUILD_CMD = `node ${BUILD_SCRIPT}`;

const build = debounce(() => {
    try {
        execSync(BUILD_CMD, {
            cwd: ROOT_DIR,
            stdio: [0, 1, 2],
        });
    } catch (e) {
        console.log(`${chalk.red('x Build Failed')} \n`);
    }
}, 100);

const watcher = chokidar.watch(SRC_DIR, {
    ignored: /node_modules|__tests__|__mocks__/,
});
watcher.on('ready', () => {
    console.log(`${chalk.keyword('cyan')('🔍')}  Watching changes...`);
    build();
    watcher.on('all', (event, path) => {
        console.log(
            `${chalk.cyan('ℹ')} File changed: ${chalk.underline(path)}`
        );
        build();
    });
});
