var router = require('express').Router();
var basicAuth = require('@auth_basic');
var sql = require('@sql');
var errors = require('@errors');
var uniqueString = require('unique-string');

router.get('/', function (req, res, next) {
    basicAuth.authenticate(req, function () {
        next(errors.getResponseJSON('ADMIN_ENDPOINT_FUNCTION_SUCCESS', "Welcome to the admin sub-API for aspace! :)"));
    }, function (error) {
        next('INVALID_BASIC_AUTH');
    });
});

router.get('/ping', function (req, res, next) {
    basicAuth.authenticate(req, function () {
        next(errors.getResponseJSON('ADMIN_ENDPOINT_FUNCTION_SUCCESS', "Welcome to the admin sub-API for aspace! :)"));
    }, function (error) {
        next('INVALID_BASIC_AUTH');
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
            next(error);
        });
    }, function (error) {
        next('INVALID_BASIC_AUTH');
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
                    next(errors.getResponseJSON('AUTH_KEY_ADDED', newAuth));
                }, function (error) {
                    next(errors.getResponseJSON('INVALID_PERMISSION'));
                });
                sql.remove.regularDelete('temp_gen_auth_key', ['temp_key'], [req.query.temp_auth_key], function () {}, function (error) {
                    next(error);
                });
            },
            function (error) {
                next(errors.getResponseJSON('INVALID_PERMISSION'));
                sql.remove.regularDelete('temp_gen_auth_key', ['temp_key'], [req.query.temp_auth_key], function () {}, function (error) {
                    next(error);
                });
            });
    });
});

module.exports = router;