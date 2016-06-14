var potentialExtensions = [''].concat(Object.keys(require('interpret').jsVariants)),
    fs = require('fs');

function existsWithAccess(path) {
    try {
        fs.accessSync(path);
        return true;
    } catch(ignore) {
        return false;
    }
}

function exists(path) {
    if(fs.accessSync) {
        return existsWithAccess(path);
    } else {
        try {
            var stats = fs.statSync(path);
            return stats.isFile();
        } catch(ignore) {
            return false;
        }
    }
}

module.exports = function(configPath) {
    for(var i = 0, len = potentialExtensions.length; i < len; i++) {
        var ext = potentialExtensions[i];
        if(exists(configPath + ext)) {
            // file exists, use that extension
            return configPath + ext;
        }
    }
    
    throw new Error('File does not exist');
}