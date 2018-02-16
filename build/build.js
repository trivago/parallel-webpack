const babel = require('babel-core');
const glob = require('glob');
const path = require('path');
const mkdirp = require('mkdirp');
const minimatch = require('minimatch');
const fs = require('fs');
const compose = require('lodash.flowright');
const chalk = require('chalk');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.resolve(ROOT_DIR, 'src');
const OUT_DIR = path.resolve(ROOT_DIR, 'dist');

const IGNORE_PATTERNS = '!{**/__mocks__/**,**/__tests__/**}';
const TRANSFORM_PATTERN = '**/*.js';

const readSourceFiles = SRC_DIR =>
    glob.sync(path.resolve(SRC_DIR, '**/*'), {
        nodir: true,
    });

const filterIgnored = files => minimatch.match(files, IGNORE_PATTERNS);

const getDestinationPath = filePath => {
    const relativePath = path.relative(SRC_DIR, filePath);
    const destPath = path.resolve(OUT_DIR, relativePath);
    return {
        filename: relativePath,
        outputPath: destPath,
        srcPath: filePath,
    };
};

const buildAndSave = data => {
    mkdirp.sync(path.dirname(data.outputPath));
    if (minimatch(data.filename, TRANSFORM_PATTERN)) {
        console.log(
            `${chalk.blue('Transforming file:')} ${chalk.underline(
                data.filename
            )}`
        );
        const transformed = babel.transformFileSync(data.srcPath);
        fs.writeFileSync(data.outputPath, transformed.code);
    } else {
        console.log(
            `${chalk.yellow('Copying file:')}      ${chalk.underline(
                data.filename
            )}`
        );
        fs
            .createReadStream(data.srcPath)
            .pipe(fs.createWriteStream(data.outputPath));
    }
};

const buildFiles = compose(
    files => files.forEach(buildAndSave),
    files => files.map(getDestinationPath),
    filterIgnored,
    readSourceFiles
);

const build = () => {
    console.log(`\n${chalk.keyword('orange')('~')} Build started\n`);
    mkdirp.sync(OUT_DIR);
    buildFiles(SRC_DIR);
    console.log(`\n${chalk.green('✓')} Success\n`);
};

build();
