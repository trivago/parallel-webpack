# parallel-webpack - Building multi-configs in parallel

`parallel-webpack` allows you to run multiple webpack builds in parallel,
spreading the work across your processors and thus helping to significantly speed
up your build. For us at [trivago](http://www.trivago.com) it has reduced
the build from 16 minutes to just 2 minutes - for 32 variants. That performance
improvement naturally comes at the expense of utilizing all available CPU cores.

## Installation

```sh
npm install parallel-webpack --save-dev
```

You can choose whether to install `parallel-webpack` globally or locally.
At [trivago](http://www.trivago.com), we keep our build tools locally to the project
so that we have full control over its versions.

## Basic example

Given a `webpack.config.js` like this:

```javascript
module.exports = [{
    entry: 'pageA.js',
    output: {
        path: './dist',
        filename: 'pageA.bundle.js'
    }
}, {
    entry: 'pageB.js',
    output: {
        path: './dist',
        filename: 'pageB.bundle.js'
    }
}];
```

`parallel-webpack` will run both specified builds in parallel.

## Variants example

Sometimes, just using different configurations like above won't be enough and what
you really want or need is the same configuration with some adjustments.
`parallel-webpack` can help you with generating those `configuration variants` as
well.

```javascript
var createVariants = require('parallel-webpack').createVariants;

// Those options will be mixed into every variant
// and passed to the `createConfig` callback.
var baseOptions = {
    preferredDevTool: process.env.DEVTOOL || 'eval'
};

// This object defines the potential option variants
// the key of the object is used as the option name, its value must be an array
// which contains all potential values of your build.
var variants = {
    minified: [true, false],
    debug: [true, false],
    target: ['commonjs2', 'var', 'umd', 'amd']
};

function createConfig(options) {
    var plugins = [
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.DefinePlugin({
            DEBUG: JSON.stringify(JSON.parse(options.debug))
        })
    ];
    if(options.minified) {
        plugins.push(new webpack.optimize.UglifyJsPlugin({
            sourceMap: false,
            compress: {
                warnings: false
            }
        }));
    }
    return {
        entry: './index.js',
        devtool: options.preferredDevTool,
        output: {
            path: './dist/',
            filename: 'MyLib.' +
                options.target +
                (options.minified ? '.min' : '') +
                (options.debug ? '.debug' : '')
                + '.js',
            libraryTarget: options.target
        },
        plugins: plugins
    };
}

module.exports = createVariants(baseOptions, variants, createConfig);
```

The above configuration will create 16 variations of the build for you, which
`parallel-webpack` will distribute among your processors for building.

```
[WEBPACK] Building 16 targets in parallel
[WEBPACK] Started building MyLib.umd.js
[WEBPACK] Started building MyLib.umd.min.js
[WEBPACK] Started building MyLib.umd.debug.js
[WEBPACK] Started building MyLib.umd.min.debug.js

[WEBPACK] Started building MyLib.amd.js
[WEBPACK] Started building MyLib.amd.min.js
[WEBPACK] Started building MyLib.amd.debug.js
[WEBPACK] Started building MyLib.amd.min.debug.js

[WEBPACK] Started building MyLib.commonjs2.js
[WEBPACK] Started building MyLib.commonjs2.min.js
[WEBPACK] Started building MyLib.commonjs2.debug.js
[WEBPACK] Started building MyLib.commonjs2.min.debug.js

[WEBPACK] Started building MyLib.var.js
[WEBPACK] Started building MyLib.var.min.js
[WEBPACK] Started building MyLib.var.debug.js
[WEBPACK] Started building MyLib.var.min.debug.js
```

## Running the watcher

One of the features that made webpack so popular is certainly its watcher which
continously rebuilds your application.

When using `parallel-webpack`, you can easily use the same feature as well by
specifying the `--watch` option on the command line:

```
parallel-webpack --watch
```

## Specifying retry limits

As a side-effect of using `parallel-webpack`, an error will no longer lead to
you having to restart webpack. Instead, `parallel-webpack` will keep retrying to
build your application until you've fixed the problem.

While that is highly useful for development it can be a nightmare for
CI builds. Thus, when building with `parallel-webpack` in a CI context, you should
consider to use the `--max-retries` (or `-m` option) to force `parallel-webpack` to give
up on your build after a certain amount of retries:

```
parallel-webpack --max-retries=3
```

## Specifying the configuration file

When you need to use a configuration file that is not `webpack.config.js`, you can
specify its name using the `--config` parameter:

```
parallel-webpack --config=myapp.webpack.config.js
```

## Switch off statistics (improves performance)

While the statistics generated by Webpack are very usually very useful, they also
take time to generate and print and create a lot of visual overload if you don't
actually need them.

Since version *1.3.0*, generating them can be turned off:

```
parallel-webpack --no-stats
```

## Limiting parallelism

Under certain circumstances you might not want `parallel-webpack` to use all of your
available CPUs for building your assets. In those cases, you can specify the `parallel`,
or `p` for short, option to tell `parallel-webpack` how many CPUs it may use.

```
parallel-webpack -p=2
```


## Configurable configuration

Sometimes, you might want to access command line arguments within your `webpack.config.js`
in order to create a more specific configuration.

`parallel-webpack` will forward every parameter specified after `--` to the configuration
as is:

```
parallel-webpack -- --app=trivago
```


Within `webpack.config.js`:

```
console.log(process.argv);
// => [ 'node', 'parallel-webpack', '--app=trivago' ]
```

`parallel-webpack` adds the first two values to `process.argv` to ensure that there
are no differences between various ways of invoking the `webpack.config.js`.

## Node.js API

Just like webpack, you can also use `parallel-webpack` as an API from node.js
(You can specify any other option used in [worker-farm](https://www.npmjs.com/package/worker-farm)):

```javascript
var run = require('parallel-webpack').run,
    configPath = require.resolve('./webpack.config.js');
run(configPath, {
    watch: false,
    maxRetries: 1,
    stats: true, // defaults to false
    maxConcurrentWorkers: 2 // use 2 workers
});
```

### createVariants

#### createVariants(baseConfig: Object, variants: Object, configCallback: Function): Object[]

Alters the given `baseConfig` with all possible `variants` and maps the result into
a valid webpack configuration using the given `configCallback`.

#### createVariants(variants: Object, configCallback: Function): Object[]

Creates all possible variations as specified in the `variants` object and
maps the result into a valid webpack configuration using the given `configCallback`.

#### createVariants(baseConfig: Object, variants: Object): Object[]

Alters the given `baseConfig` with all possible `variants` and returns it.

#### createVariants(variants: Object): Object[]

Creates all possible variations from the given `variants` and returns them as a flat array.
