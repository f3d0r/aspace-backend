var router = require('express').Router();
var basicAuth = require('@auth_basic');
var bcrypt = require('@auth_bcrypt');
var sql = require('@sql');
var errors = require('@errors');
var uniqueString = require('unique-string');
var path = require('path');
var express = require('express');

router.get('/', function (req, res, next) {
    basicAuth.authenticate(req, function () {
        res.status(200).send("Welcome to the admin sub-API for aspace! :)");
    }, function (error) {
        if (error == 'NO_AUTH') {
            res.set("WWW-Authenticate", "Basic realm=\"Authorization Required\"");
            res.status(401).send("Authorization Required");
        } else if (error == 'INVALID_BASIC_AUTH') {
            next('INVALID_BASIC_AUTH');
            next(error);
        }
    });
});

router.get('/ping', function (req, res, next) {
    basicAuth.authenticate(req, function () {
        res.status(200).send("pong");
    }, function (error) {
        if (error == 'NO_AUTH') {
            res.set("WWW-Authenticate", "Basic realm=\"Authorization Required\"");
            res.status(401).send("Authorization Required");
            const err = new Error('No Basic Auth');
            err.status = 401;
            next(err)
        } else if (error == 'INVALID_BASIC_AUTH') {
            next('INVALID_BASIC_AUTH');
            const err = new Error('Invalid Basic Auth');
            err.status = 401;
            next(err)
        }
    });
});

router.get('/get_auth_key', function (req, res, next) {
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
            next(error);
        });
    }, function (error) {
        if (error == 'NO_AUTH') {
            res.set("WWW-Authenticate", "Basic realm=\"Authorization Required\"");
            res.status(401).send("Authorization Required");
        } else if (error == 'INVALID_BASIC_AUTH') {
            next('INVALID_BASIC_AUTH');
        }
        next(error);
    });
});

router.post('/finalize_temp_auth_key', function (req, res, next) {
    errors.checkQueries(req, res, ['request_user', 'temp_auth_key', 'requested_permission'], function () {
        sql.select.tempAuthKeyCheck('temp_gen_auth_key', req.query.request_user, req.query.temp_auth_key, req.query.requested_permission,
            function (results) {
                var newAuth = {};
                newAuth['request_user'] = req.query.request_user;
                newAuth['auth_key'] = uniqueString();
                newAuth['permission'] = req.query.requested_permission;
                sql.insert.addObject('database_authority', newAuth, function (results) {
                    next('AUTH_KEY_ADDED', newAuth);
                }, function (error) {
                    next('INVALID_PERMISSION');
                    next(error);
                });
                sql.remove.regularDelete('temp_gen_auth_key', ['temp_key'], [req.query.temp_auth_key], function () {}, function (error) {
                    next(error);
                });
            },
            function (error) {
                next('INVALID_PERMISSION');
                next(error);
                sql.remove.regularDelete('temp_gen_auth_key', ['temp_key'], [req.query.temp_auth_key], function () {}, function (error) {
                    next(error);
                });
            });
    });
});

module.exports = router;