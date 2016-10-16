let AWS = require("aws-sdk");
let stream = require("streamifier");
let uuid = require("uuid");
let S3;

let config = {};

module.exports = function(userConf) {
    config = Object.assign({}, config, userConf);
    AWS.config.update(config);
    S3 = new AWS.S3();
    return {
        getImage : getImage,
        storeImage : storeImage
    }
};

const getImage = function(path) {
    const params = {Bucket: config.bucket, Key: path.replace('/', '')};

    return new Promise(function(resolve, reject) {
        S3.getObject(params, function(err, data) {
           if (err) {
               if (err.statusCode === 404)
                   reject({type:'NOT_FOUND'});
               else
                   reject({type:'DEFAULT', debug:err});
           }
            else
               resolve(stream.createReadStream(data.Body));
        });
    })
};

const storeImage = function(stream, extension) {
    return new Promise(function(resolve, reject) {
       const params = {
           Key : uuid.v4()+"."+extension,
           Bucket : config.bucket,
           Body : stream
       };
       S3.upload(params, function(err, data) {
          if (err)
              reject({type:'DEFAULT', debug:err});
           else {
               console.log(data);
              resolve(params.Key);
          }

       });
    });
};