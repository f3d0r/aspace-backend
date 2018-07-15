var router = require('express').Router();
var basicAuth = require('@auth_basic');
var bcrypt = require('@auth_bcrypt');
var sql = require('@sql');
var errors = require('@errors');
var uniqueString = require('unique-string');
var path = require('path');
var express = require('express');

// router.use(express.static("html/key"));

router.get('/', function (req, res) {
    basicAuth.authenticate(req, function () {
        res.status(200).send("Welcome to the admin sub-API for aspace! :)");
    }, function (error) {
        if (error == 'NO_AUTH') {
            res.set("WWW-Authenticate", "Basic realm=\"Authorization Required\"");
            res.status(401).send("Authorization Required");
        } else if (error == 'INVALID_BASIC_AUTH') {
            errors.sendErrorJSON(res, 'INVALID_BASIC_AUTH');
        }
    });
});

router.get('/ping', function (req, res) {
    basicAuth.authenticate(req, function () {
        res.status(200).send("pong");
    }, function (error) {
        if (error == 'NO_AUTH') {
            res.set("WWW-Authenticate", "Basic realm=\"Authorization Required\"");
            res.status(401).send("Authorization Required");
        } else if (error == 'INVALID_BASIC_AUTH') {
            errors.sendErrorJSON(res, 'INVALID_BASIC_AUTH');
        }
    });
});

router.get('/get_auth_key', function (req, res) {
    basicAuth.authenticate(req, function (username, permissions) {
        var newTempAuthKeyInsert = {};
        newTempAuthKeyInsert['request_user'] = username;
        var tempKey = uniqueString();
        newTempAuthKeyInsert['temp_key'] = tempKey;
        newTempAuthKeyInsert['permissions'] = permissions;
        var metaData = {
            username: username,
            temp_auth_key: tempKey
        };
        sql.insert.addObject('temp_gen_auth_key', newTempAuthKeyInsert, function () {
            res.render('get_auth_key.ejs', metaData);
        }, function (error) {
            res.status(400).send(error);
        });
    }, function (error) {
        if (error == 'NO_AUTH') {
            res.set("WWW-Authenticate", "Basic realm=\"Authorization Required\"");
            res.status(401).send("Authorization Required");
        } else if (error == 'INVALID_BASIC_AUTH') {
            errors.sendErrorJSON(res, 'INVALID_BASIC_AUTH');
        }
    });
});

router.post('/finalize_temp_auth_key', function (req, res) {
    if (!errors.queryExists(req, 'request_user')) {
        errors.sendErrorJSON(res, 'MISSING_PARAMETER', 'request_user required');
    } else if (!errors.queryExists(req, 'temp_auth_key')) {
        errors.sendErrorJSON(res, 'MISSING_PARAMETER', 'temp_auth_key required');
    } else if (!errors.queryExists(req, 'requested_permission')) {
        errors.sendErrorJSON(res, 'MISSING_PARAMETER', 'requested_permission required');
    } else {
        sql.select.tempAuthKeyCheck('temp_gen_auth_key', req.query.request_user, req.query.temp_auth_key, req.query.requested_permission,
            function (results) {
                var newAuth = {};
                newAuth['request_user'] = req.query.request_user;
                newAuth['auth_key'] = uniqueString();
                newAuth['permission'] = req.query.requested_permission;
                sql.insert.addObject('database_authority', newAuth, function (results) {
                    sql.remove.regularDelete('temp_gen_auth_key', ['temp_key'], [req.query.temp_auth_key], function () {
                        errors.sendErrorJSON(res, 'AUTH_KEY_ADDED', newAuth);
                    }, function () {
                        errors.sendErrorJSON(res, 'AUTH_KEY_NOT_ADDED');

                    })
                }, function (error) {
                    errors.sendErrorJSON(res, 'AUTH_KEY_NOT_ADDED');
                });
            },
            function () {
                errors.sendErrorJSON(res, 'INVALID_AUTH_KEY');
            });
    }
});

module.exports = router;