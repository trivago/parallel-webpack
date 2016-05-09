/**
 * Created by pgotthardt on 07/12/15.
 */
var assign = require('lodash.assign');
var flatten = require('lodash.flatten');

/**
 * Creates configuration variants.
 *
 * @param {Object} [baseConfig={}] The base configuration
 * @param {Object} variants The variants
 * @param {Function} [configCallback] A callback executed for each configuration to
 *      transform the variant into a webpack configuration
 * @returns {*|Array}
 */
module.exports = function createVariants(baseConfig, variants, configCallback) {
    if(arguments.length < 3) {
        if(arguments.length === 2) {
            if(typeof variants === 'function') {
                // createVariants(variants: Object, configCallback: Function)
                configCallback = variants;
                variants = baseConfig;
                baseConfig = {};
            }
            // createVariants(baseConfig: Object, variants: Object)
            // => don't do anything
        } else {
            // createVariants(variants: Object)
            variants = baseConfig;
            baseConfig = {};
        }
    }

    // Okay, so this looks a little bit messy but it really does make some sense.
    // Essentially, for each base configuration, we want to create every
    // possible combination of the configuration variants specified above.
    var transforms = Object.keys(variants).map(function(key) {
            return function(config) {
                return variants[key].map(function(value) {
                    var result = assign({}, config);
                    result[key] = value;
                    return result;
                });
            };
        }),
        configs = transforms.reduce(function(options, transform) {
            return flatten(options.map(transform));
        }, [baseConfig]);


    return configCallback && configs.map(configCallback) || configs;
};
