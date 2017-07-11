import createVariants from '../createVariants';

describe('createVariants', () => {
    function test(withBase, withCallback) {
        // these are stupid examples but enough to prove transformation works
        const baseConfig = {
            name: 'bundle.base'
        };
        const variants = {
            rtl: [true, false],
            debug: [true, false],
            features: [0, 1, 2]
        };
        const callback = (x) => {
            const ret = Object.assign({}, x);
            ret.name = `bundle.${x.rtl ? 'rtl' : 'no-rtl'}.${x.debug ? 'dbg': 'no-debug'}.${x.features}.js`;
            return ret;
        };

        let result;

        if (withBase && withCallback) {
            result = createVariants(baseConfig, variants, callback);
        } else if (withBase && !withCallback) {
            result = createVariants(baseConfig, variants);
        } else if (!withBase && withCallback) {
            result = createVariants(variants, callback);
        } else { //!withBase && !withCallback
            result = createVariants(variants);
        }
        expect(result).toMatchSnapshot();
    }
    it('should generate configs with "baseConfig, variants, configCallback" as params', () => {
        test(true, true);
    });
    it('should generate configs with "variants, configCallback" as params', () => {
        test(false, true);
    });
    it('should generate configs with "variants" as params', () => {
        test(false, false);
    });

    it('should generate configs with baseConfig and variants', () => {
        test(true, false);
    });
});
