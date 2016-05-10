var jsVariants = require('interpret').jsVariants,
    endsWith = require('lodash.endswith'),
    availableExtensions = Object.keys(jsVariants);

// sort extensions to ensure that .babel.js and
// similar ones are always matched before .js
availableExtensions.sort(function(a, b) {
    var res = -(a.split(/\./).length - b.split(/\./).length);
    // all things being equal, we need to
    // prioritize .js as it is most likely
    if(res === 0) {
        if(a === '.js') {
            return -1;
        }
        if(b === '.js') {
            return 1;
        }
        return 0;
    }
    return res;
});

function getMatchingLoader(configPath) {
    for(var i = 0, len = availableExtensions.length; i < len; i++) {
        var ext = availableExtensions[i];
        if(endsWith(configPath, ext)) {
            return jsVariants[ext];
        }
    }
    return null;
}

module.exports = function(configPath) {
    var mod = getMatchingLoader(configPath);
    if(mod) {
        var mods = Array.isArray(mod) ? mod : [mod],
            installed = false;
        
        for(var i = 0, len = mods.length; i < len; i++) {
            mod = mods[i];
            if(typeof mod === 'string') {
                try {
                    require(mod);
                    installed = true;
                } catch(ignored) {}
            } else if(typeof mod === 'object') {
                try {
                    var s = require(mod.module);
                    mod.register(s);
                    installed = true;
                } catch(ignored) {}
            }
            
            if(installed) {
                break;
            }
        }
        
        if(!installed) {
            throw new Error('Could not load required module loading for ' + chalk.underline(configPath));
        }
    }
    return require(configPath);
}