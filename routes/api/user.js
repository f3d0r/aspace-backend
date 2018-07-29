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
        cb(null, 'profile-pic-' + uniqueString());
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
    errors.checkQueries(req, res, ['access_code', 'car_id'], function () {

    });
});

router.post('/manipulate_car', function (req, res, next) {
    errors.checkQueries(req, res, ['access_code', 'device_id', 'car_id', 'action'], function () {

    });
});

router.post('/update_profile_pic', upload.single('photo'), function (req, res, next) {
    errors.checkQueries(req, res, ['access_code', 'device_id'], function () {
        sql.update.updateProfilePic(req.query.access_code, req.query.device_id, function (profilePicID) {
            if (typeof req.file == 'undefined') {
                next(errors.getResponseJSON('MULTI_PART_BODY_MISSING', 'multi-part body with key \'photo\' missing.'));
            } else {
                sharp(req.file.path).resize(200, 200).toBuffer(function (err, buf) {
                    var keyName = "***REMOVED***" + profilePicID + ".png";
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
                                    next(errors.getResponseJSON('PROFILE_PIC_UPDATED', data.Location));
                                }
                            });
                        }
                    });
                });
            }
        }, function (error) {
            next(errors.getResponseJSON(error));
        });
    });
});

router.get('/get_profile_pic', function (req, res, next) {
    errors.checkQueries(req, res, ['access_code', 'device_id'], function () {
        sql.select.regularSelect('user_access_codes', ['access_code', 'device_id'], ['=', '='], [req.query.access_code, req.query.device_id], 1, function (user) {
                sql.select.regularSelect('users', ['user_id'], ['='], [user[0].user_id], 0, function (userInfo) {
                        if (userInfo[0].profile_pic == null) {
                            next(errors.getResponseJSON('PROFILE_PIC_NULL'));
                        } else {
                            next(errors.getResponseJSON('PROFILE_PIC_EXISTS', constants.digitalocean.BUCKET_BASE_URL + constants.digitalocean.PROFILE_PIC_ENDPOINT + userInfo[0].profile_pic + constants.digitalocean.PROFILE_PIC_EXTENSION));
                        }
                    }, function () {
                        next(errors.getResponseJSON('INVALID_USER'));
                    },
                    function (err) {
                        next(err)
                    });
            },
            function () {
                next(errors.getResponseJSON('INVALID_ACCESS_CODE'));
            },
            function (err) {
                next(err);
            });
    });
});

module.exports = router;