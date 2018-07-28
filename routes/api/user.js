var router = require('express').Router();
var multer = require('multer');
var sharp = require('sharp');
var fs = require('fs');
var uniqueString = require('unique-string');
var errors = require('@errors');
const constants = require('@config');
var sql = require('@sql');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/profile_pic_temp');
    },
    filename: function (req, file, cb) {
        cb(null, 'photos-' + Date.now());
    }
})

var upload = multer({
    storage: storage
});

router.get('/', function (req, res, next) {
    next(errors.getResponseJSON('USER_ENDPOINT_FUNCTION_SUCCESS', "This is the user info sub-API for aspace! :)"));
});

router.get('/ping', function (req, res, next) {
    next(errors.getResponseJSON('USER_ENDPOINT_FUNCTION_SUCCESS', "pong"));
});

router.get('/get_car', function (req, res, next) {
    errors.checkQueries(req, res, ['access_key', 'car_id'], function () {

    });
});

router.post('/manipulate_car', function (req, res, next) {
    errors.checkQueries(req, res, ['access_key', 'car_id', 'action'], function () {

    });
});

router.post('/update_profile_pic', upload.single('photo'), function (req, res, next) {
    errors.checkQueries(req, res, ['access_key', 'device_id'], function () {
        sharp(req.file.path).resize(200, 200).toBuffer(function (err, buf) {
            var keyName = uniqueString() + ".png";
            var params = {
                Bucket: constants.digitalocean.BUCKET_NAME,
                Key: keyName,
                ACL: 'public-read',
                Body: buf,
            };
            constants.digitalocean.S3.upload(params, function (err, data) {
                if (err) {
                    next(err);
                } else {
                    fs.unlink(req.file.path, function (err) {
                        if (err) {
                            next(err);
                        } else {
                            next(errors.getResponseJSON('USER_ENDPOINT_FUNCTION_SUCCESS', data.Location));
                        }
                    });
                }
            });
        });
    });
});

router.get('/get_profile_pic', function (req, res, next) {
    errors.checkQueries(req, res, ['access_key', 'device_id'], function () {
        //If access_key and device_id are a match, return the picture that is received from the S3 link
    });
});

module.exports = router;