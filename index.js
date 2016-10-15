"use strict";

let Busboy = require('busboy');
let mime = require('mime-types');

let config = {
    provider : {type : "fileSystem"},
    logger : console
};
let provider = {};

module.exports = function(userConf) {
    config = Object.assign({}, config, userConf);
    config.logger.log("config : ", config);
    provider = require("./providers/"+config.provider.type)(config.provider);
    return function (req, res, next) {
        try {
            if (req.method === "GET")
                getImage(provider, req, res);
            else if (req.method === "POST")
                storeImage(provider, req, res);
            else
                next();
        }
        catch(e) {
            config.logger.error("Internal error : ", e);
            res.status(500).send("internal error");
        }
    };
};

function storeImage(provider, req, res) {
    const busboy = new Busboy({ headers: req.headers });
    busboy.on('file', function(fieldname, stream, filename, encoding, mimetype) {
        provider.storeImage(stream, mime.extension(mimetype))
            .then(function(data) {
                res.status(201).set('Location', req.baseUrl+"/"+data).send();
            })
            .catch(function(err) { handleError(req, res, err)});
    });
    req.pipe(busboy);
}

function getImage(provider, req, res) {
    provider.getImage(req.path)
        .then(function(data) {
            data.pipe(res);
        })
        .catch(function(err) { handleError(req, res, err)});
}

function handleError(req, res, err) {
    const errors = {
        "NOT_FOUND" : {code : 404, message : 'not found'},
        "DEFAULT" : {code : 500, message : 'internal error'}
    };
    config.logger.log("An error occured : ", err);
    if (typeof errors[err.type] !== "undefined")
        res.status(errors[err.type].code).send(err.message || errors[err.type].message);
    else
        res.status(errors.DEFAULT.code).send(errors.DEFAULT.message);
}