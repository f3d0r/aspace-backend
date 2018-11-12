var router = require('express').Router();
var basicAuth = require('@auth-basic');
var sql = require('@sql');
var errors = require('@errors');
var uniqueString = require('unique-string');

router.get('/', function (req, res, next) {
    basicAuth.authenticate(req, function () {
        var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', "Welcome to the admin sub-API for aspace! :)");
        res.status(response.code).send(response.res);
    }, function (error) {
        var response = errors.getResponseJSON('INVALID_BASIC_AUTH', error);
        next({
            response,
            error
        });
    });
});

router.get('/ping', function (req, res, next) {
    basicAuth.authenticate(req, function () {
        var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', "pong");
        res.status(response.code).send(response.res);
    }, function (error) {
        var response = errors.getResponseJSON('INVALID_BASIC_AUTH', error);
        next({
            response,
            error
        });
    });
});

router.get('/get_auth_key', function (req, res, next) {
    basicAuth.authenticate(req, function (username, permissions) {
        var newTempAuthKeyInsert = {};
        newTempAuthKeyInsert.request_user = username;
        var tempKey = uniqueString();
        newTempAuthKeyInsert.temp_key = tempKey;
        newTempAuthKeyInsert.permissions = permissions;
        var metaData = {
            username: username,
            temp_auth_key: tempKey
        };
        sql.insert.addObject('temp_gen_auth_key', newTempAuthKeyInsert, function () {
            res.render('get_auth_key.ejs', metaData);
        }, function (error) {
            var response = errors.getResponseJSON('GENERAL_SERVER_ERROR', error);
            next({
                response,
                error
            });
        });
    }, function (error) {
        var response = errors.getResponseJSON('INVALID_BASIC_AUTH', error);
        next({
            response,
            error
        });
    });
});

router.post('/finalize_temp_auth_key', function (req, res, next) {
    errors.checkQueries(req, res, ['request_user', 'temp_auth_key', 'requested_permission'], function () {
        sql.select.tempAuthKeyCheck('temp_gen_auth_key', req.query.request_user, req.query.temp_auth_key, req.query.requested_permission,
            function (results) {
                var newAuth = {};
                newAuth.request_user = req.query.request_user;
                newAuth.auth_key = uniqueString();
                newAuth.permission = req.query.requested_permission;
                sql.insert.addObject('database_authority', newAuth, function (results) {
                    var response = errors.getResponseJSON('AUTH_KEY_ADDED', newAuth);
                    res.status(response.code).send(response.res);
                }, function (error) {
                    var response = errors.getResponseJSON('INVALID_PERMISSION');
                    next({
                        response,
                        error
                    });
                });
                sql.remove.regularDelete('temp_gen_auth_key', ['temp_key'], [req.query.temp_auth_key], function () {}, function (error) {
                    var response = errors.getResponseJSON('GENERAL_SERVER_ERROR', error);
                    next({
                        response,
                        error
                    });
                });
            },
            function (error) {
                var response = errors.getResponseJSON('INVALID_PERMISSION');
                res.status(response.code).send(response.res);
                sql.remove.regularDelete('temp_gen_auth_key', ['temp_key'], [req.query.temp_auth_key], function () {}, function (error) {});
            });
    });
});

module.exports = router;