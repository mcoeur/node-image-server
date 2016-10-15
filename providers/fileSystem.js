let fs = require("fs");
let uuid = require("uuid");

let config = {
    'dataPath' : './data'
};

module.exports = function(userConf) {
    config = Object.assign({}, config, userConf);
    fs.stat(config.dataPath, function(err, stats) {
        if (err || !stats.isDirectory())
            console.log("WARNING : data path is not a directory : "+config.dataPath);
    });
    return {
        getImage : getImage,
        storeImage : storeImage
    }
};

const getImage = function(path) {
    let filePath = config.dataPath+path;
    return new Promise( function(resolve, reject) {
        fs.access(filePath, fs.constants.F_OK, function(err) {
            if (err)
                reject({ type : "NOT_FOUND", debug : filePath });
            else {
                resolve(fs.createReadStream(filePath));
            }
        })
    });
};

const storeImage = function(stream, extension) {
    return new Promise(function(resolve, reject) {
        let fileName = uuid.v4()+"."+extension;
        let filePath = config.dataPath+"/"+fileName;
        const fileStream = fs.createWriteStream(filePath);
        fileStream.on("finish", function() {
            resolve(fileName);
        });
        fileStream.on("error", function(err) {
            reject( {type : "DEFAULT", debug : error});
        });
        stream.pipe(fileStream);
    });
};