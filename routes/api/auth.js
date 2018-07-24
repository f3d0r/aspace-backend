var router = require('express').Router();
var sql = require('@sql');
var errors = require('@errors');
var twilio = require('@twilio');
var timestamp = require("@timestamp");
const constants = require('@config');
var moment = require('moment');
var uniqueString = require('unique-string');
const VoiceResponse = require('twilio').twiml.VoiceResponse;

router.get('/', function (req, res) {
    res.status(200).send("This is the user authentication sub-API for aspace! :)");
});

router.get('/ping', function (req, res) {
    res.status(200).send("pong");
});

router.get('/verification_twiml', function (req, res) {
    errors.checkQueries(req, res, ['verification_pin', 'auth_key'], function () {
        var pin = req.query.verification_pin;
        if (req.query.auth_key == constants.auth.INTERNAL_AUTH_KEY) {
            const response = new VoiceResponse();
            response.say('Your aspace verification code is ' + pin[0]);
            for (var index = 0; index < pin.length; index++) {
                response.say(pin[index]);
                response.pause();
            }
            response.say('Happy Parking!');
            res.set('Content-Type', 'text/xml');
            res.status(200).send(response.toString());
        } else {
            res.status(401).send('INVALID_AUTH_KEY');
        }
    });
});

router.post("/phone_login", function (req, res, next) {
    errors.checkQueries(req, res, ['phone_number', 'device_id', 'call_verify'], function () {
        twilio.lookupPhone(req.query.phone_number, function (formattedPhoneNumber) {
            verifyUser = {};
            verifyUser['phone_number'] = formattedPhoneNumber;
            var pin = Math.floor(100000 + Math.random() * 900000);
            verifyUser['verify_pin'] = pin;
            verifyUser['device_id'] = req.query.device_id;
            verifyUser['expiry_date'] = timestamp.getExpiryTimestamp(constants.auth.PIN_EXPIRY_MINUTES, 'm');
            sql.select.regularSelect('users', ['phone_number'], '=', [formattedPhoneNumber], 1, function (rows) {
                verifyUser['user_id'] = rows[0].user_id;
                sql.insert.addObject('user_verify_codes', verifyUser, function () {
                    if (req.query.call_verify == 'T') {
                        twilio.sendVerifyCall(formattedPhoneNumber, pin);
                    } else {
                        twilio.sendVerifyText(formattedPhoneNumber, pin);
                    }
                    next('RETURN_PHONE');
                }, function (error) {
                    next(error);
                });
            }, function () {
                verifyUser['user_id'] = uniqueString();
                sql.insert.addObject('user_verify_codes', verifyUser, function () {
                    if (req.query.call_verify == 'T') {
                        twilio.sendVerifyCall(formattedPhoneNumber, pin);
                    } else {
                        twilio.sendVerifyText(formattedPhoneNumber, pin);
                    }
                    next('NEW_PHONE');
                }, function (error) {
                    next(error);
                });
            }, function (error) {
                next(error);
            });
        }, function () {
            next('INVALID_PHONE');
        });
    });
});

router.post("/check_pin", function (req, res, next) {
    errors.checkQueries(req, res, ['phone_number', 'device_id', 'verify_pin'], function () {
        twilio.lookupPhone(req.query.phone_number, function (formattedPhoneNumber) {
                sql.select.regularSelect("user_verify_codes", ['phone_number', 'device_id', 'verify_pin'], ['=', '=', '='], [formattedPhoneNumber, req.query.device_id, req.query.verify_pin], 1,
                    function (rows) {
                        if (timestamp.timePassed(moment.utc(rows[0].expiry_date))) {
                            sql.remove.regularDelete('user_verify_codes', ['phone_number', 'device_id'], [formattedPhoneNumber, req.query.device_id], function () {
                                next('PIN_EXPIRED');
                            }, function (error) {
                                next(error);
                            });
                        } else {
                            var newAccessCode = uniqueString();
                            accessCode = {};
                            expiry_date = timestamp.getExpiryTimestamp(2, 'months');
                            accessCode['user_id'] = rows[0].user_id;
                            accessCode['access_code'] = newAccessCode;
                            accessCode['device_id'] = req.query.device_id;
                            accessCode['expiry_date'] = expiry_date;
                            accessCode['grant_date'] = timestamp.getFormattedTime(moment().utc());
                            sql.insert.addObject('user_access_codes', accessCode, function () {
                                jsonReturn = {};
                                jsonReturn['access_code'] = newAccessCode
                                jsonReturn['expiry'] = expiry_date;
                                next('NEW_ACCESS_CODE', jsonReturn);
                                sql.remove.regularDelete('user_verify_codes', ['phone_number', 'device_id'], [formattedPhoneNumber, req.query.device_id], function () {
                                    sql.select.regularSelect('users', ['user_id'], ['='], [rows[0].user_id], 1, function () {}, function () {
                                        newUserJSON = {};
                                        newUserJSON['user_id'] = accessCode['user_id'];
                                        newUserJSON['phone_number'] = formattedPhoneNumber;
                                        sql.insert.addObject('users', newUserJSON, function () {}, function (error) {
                                            next(error);
                                        });
                                    }, function (error) {
                                        next(error);
                                    })
                                }, function (error) {
                                    next(error);
                                });
                            }, function (error) {
                                next(error);
                            });
                        }
                    },
                    function () {
                        next('INVALID_PIN')
                    },
                    function (error) {
                        next(error);
                    });
            },
            function () {
                next('INVALID_PHONE');
            });;
    });
});

module.exports = router;