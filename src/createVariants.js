import { flatten, rearg } from 'lodash';

/**
 * Creates configuration variants.
 *
 * @param {Object} [baseConfig={}] The base configuration
 * @param {Object} variants The variants
 * @param {Function} [configCallback] A callback executed for each configuration to
 *      transform the variant into a webpack configuration
 * @returns {*|Array}
 */
const createVariants = (baseConfig = {}, variants, configCallback) => {
    // Okay, so this looks a little bit messy but it really does make some sense.
    // Essentially, for each base configuration, we want to create every
    // possible combination of the configuration variants specified above.
    const transforms = Object.keys(variants).map(key => config =>
        variants[key].map(value => ({ ...config, [key]: value })),
    );
    const configs = transforms.reduce(
        (options, transform) => flatten(options.map(transform)),
        [baseConfig],
    );

    return (configCallback && configs.map(configCallback)) || configs;
};

export default function variants(baseConfig, variants, configCallback) {
    let fn = createVariants;
    if (arguments.length === 2) {
        if (typeof variants === 'function') {
            // createVariants(variants: Object, configCallback: Function)
            fn = rearg(createVariants, [2, 0, 1]);
        }
        // createVariants(baseConfig: Object, variants: Object)
        // => don't do anything
    } else if (arguments.length === 1) {
        // createVariants(variants: Object)
        fn = rearg(createVariants, [1, 0, 2]);
    }

    return fn(baseConfig, variants, configCallback);
}
