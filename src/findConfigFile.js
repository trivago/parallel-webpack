var potentialExtensions = [''].concat(Object.keys(require('interpret').jsVariants)),
    accessSync = require('fs').accessSync;

module.exports = function(configPath) {
    for(var i = 0, len = potentialExtensions.length; i < len; i++) {
        var ext = potentialExtensions[i];
        try {
            accessSync(configPath + ext);
            // file exists, use that extension
            return configPath + ext;
        } catch(ignore) {
            // just means the file doesn't exist and we look at the next one
        }
    }
    
    throw new Error('File does not exist');
}