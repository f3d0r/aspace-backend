var router = require('express').Router();
var multer = require('multer');
var sharp = require('sharp');
var fs = require('fs');
var uniqueString = require('unique-string');
var errors = require('@errors');
const constants = require('@config');
var sql = require('@sql');
var userAuth = require('@auth-user');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/profile_pic_temp');
    },
    filename: function (req, file, cb) {
        cb(null, 'profile-pic-' + uniqueString());
    }
});

var upload = multer({
    storage: storage
});

router.get('/', function (req, res, next) {
    var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', "This is the user info sub-API for aspace! :)");
    res.status(response.code).send(response.res);
});

router.get('/ping', function (req, res, next) {
    var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', "pong");
    res.status(response.code).send(response.res);
});

router.get('/check_auth', function (req, res, next) {
    errors.checkQueries(req, res, ['access_code', 'device_id'], function () {
        userAuth.accessAuth(req.query.access_code, req.query.device_id, function (user) {
            var response = errors.getResponseJSON('VALID_ACCESS_CODE');
            res.status(response.code).send(response.res);
        }, function () {
            var response = errors.getResponseJSON('INVALID_ACCESS_CODE');
            res.status(response.code).send(response.res);
        });
    });
});

router.get('/get_vehicles', function (req, res, next) {
    errors.checkQueries(req, res, ['access_code', 'device_id'], function () {
        userAuth.accessAuth(req.query.access_code, req.query.device_id, function (user) {
            sql.select.regularSelect('user_vehicles', ['vehicle_id', 'vehicle_vin', 'vehicle_year', 'vehicle_make', 'vehicle_model', 'vehicle_color', 'vehicle_length_feet'], ['user_id'], ['='], [user[0].user_id], null, function (userVehicles) {
                var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', userVehicles);
                res.status(response.code).send(response.res);
            }, function () {
                var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', {});
                res.status(response.code).send(response.res);
            }, function (error) {
                var response = errors.getResponseJSON('GENERAL_SERVER_ERROR', error);
                next({
                    response,
                    error
                });
            });
        }, function () {
            var response = errors.getResponseJSON('INVALID_ACCESS_CODE');
            res.status(response.code).send(response.res);
        });
    });
});

router.post('/remove_vehicle', function (req, res, next) {
    errors.checkQueries(req, res, ['access_code', 'device_id', 'vehicle_id'], function () {
        userAuth.accessAuth(req.query.access_code, req.query.device_id, function (user) {
            sql.remove.regularDelete('user_vehicles', ['user_id', 'vehicle_id'], [user[0].user_id, req.query.vehicle_id], function (rows) {
                if (rows.affectedRows == 0) {
                    response = errors.getResponseJSON('INVALID_VEHICLE_ID');
                    res.status(response.code).send(response.res);
                } else {
                    response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS');
                    res.status(response.code).send(response.res);
                }
            }, function (error) {
                var response = errors.getResponseJSON('GENERAL_SERVER_ERROR', error);
                next({
                    response,
                    error
                });
            });
        }, function () {
            var response = errors.getResponseJSON('INVALID_ACCESS_CODE');
            res.status(response.code).send(response.res);
        });
    });
});

router.post('/add_vehicle', function (req, res, next) {
    errors.checkQueries(req, res, ['access_code', 'device_id', 'vehicle_vin'], function () {
        userAuth.accessAuth(req.query.access_code, req.query.device_id, function (user) {
            var newVehicle = {};
            newVehicle.user_id = user[0].user_id;
            newVehicle.vehicle_id = uniqueString();
            newVehicle.vehicle_vin = req.query.vehicle_vin;
            if (typeof req.query.vehicle_year != 'undefined' && req.query.vehicle_year !== null && req.query.vehicle_year != '')
                newVehicle.vehicle_year = req.query.vehicle_year;
            if (typeof req.query.vehicle_make != 'undefined' && req.query.vehicle_make !== null && req.query.vehicle_make != '')
                newVehicle.vehicle_make = req.query.vehicle_make;
            if (typeof req.query.vehicle_model != 'undefined' && req.query.vehicle_model !== null && req.query.vehicle_model != '')
                newVehicle.vehicle_model = req.query.vehicle_model;
            if (typeof req.query.vehicle_color != 'undefined' && req.query.vehicle_color !== null && req.query.vehicle_color != '')
                newVehicle.vehicle_color = req.query.vehicle_color;
            sql.insert.addObject('user_vehicles', newVehicle, function () {
                var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', newVehicle.vehicle_id);
                res.status(response.code).send(response.res);
            }, function (error) {
                var response = errors.getResponseJSON('GENERAL_SERVER_ERROR', error);
                next({
                    response,
                    error
                });
            });
        }, function () {
            var response = errors.getResponseJSON('INVALID_ACCESS_CODE');
            res.status(response.code).send(response.res);
        });
    });
});

router.post('/update_profile_pic', upload.single('photo'), function (req, res, next) {
    errors.checkQueries(req, res, ['access_code', 'device_id'], function () {
        sql.update.updateProfilePic(req.query.access_code, req.query.device_id, function (profilePicID) {
            if (typeof req.file == 'undefined') {
                var response = errors.getResponseJSON('MULTI_PART_BODY_MISSING', 'multi-part body with key \'photo\' missing.');
                res.status(response.code).send(response.res);
            } else {
                sharp(req.file.path).resize(200, 200).toBuffer(function (error, buf) {
                    var keyName = "***REMOVED***" + profilePicID + ".png";
                    var params = {
                        Bucket: constants.digitalocean.BUCKET_NAME,
                        Key: keyName,
                        ACL: 'public-read',
                        Body: buf,
                    };
                    constants.digitalocean.S3.upload(params, function (error, data) {
                        if (error) {
                            response = errors.getResponseJSON('GENERAL_SERVER_ERROR', error);
                            next({
                                response,
                                error
                            });
                        } else {
                            fs.unlink(req.file.path, function (error) {
                                if (error) {
                                    response = errors.getResponseJSON('GENERAL_SERVER_ERROR', error);
                                    next({
                                        response,
                                        error
                                    });
                                } else {
                                    response = errors.getResponseJSON('PROFILE_PIC_UPDATED', data.Location);
                                    res.status(response.code).send(response.res);
                                }
                            });
                        }
                    });
                });
            }
        }, function (error) {
            fs.unlink(req.file.path, function (err) {
                if (err) {
                    response = errors.getResponseJSON('GENERAL_SERVER_ERROR', err);
                    next({
                        response,
                        err
                    });
                } else {
                    response = errors.getResponseJSON('GENERAL_SERVER_ERROR', error);
                    next({
                        response,
                        error
                    });
                }
            });
        });
    });
});

router.get('/get_profile_pic', function (req, res, next) {
    errors.checkQueries(req, res, ['access_code', 'device_id'], function () {
        userAuth.accessAuth(req.query.access_code, req.query.device_id, function (user) {
                sql.select.regularSelect('users', null, ['user_id'], ['='], [user[0].user_id], 0, function (userInfo) {
                        if (userInfo[0].profile_pic == null) {
                            response = errors.getResponseJSON('PROFILE_PIC_NULL');
                            res.status(response.code).send(response.res);
                        } else {
                            response = errors.getResponseJSON('PROFILE_PIC_EXISTS', constants.digitalocean.BUCKET_BASE_URL + constants.digitalocean.PROFILE_PIC_ENDPOINT + userInfo[0].profile_pic + constants.digitalocean.PROFILE_PIC_EXTENSION);
                            res.status(response.code).send(response.res);
                        }
                    }, function () {
                        var response = errors.getResponseJSON('PROFILE_PIC_NULL');
                        res.status(response.code).send(response.res);
                    },
                    function (error) {
                        var response = errors.getResponseJSON('GENERAL_SERVER_ERROR', error);
                        next({
                            response,
                            error
                        });
                    });
            },
            function () {
                var response = errors.getResponseJSON('INVALID_ACCESS_CODE');
                res.status(response.code).send(response.res);
            });
    });
});

module.exports = router;