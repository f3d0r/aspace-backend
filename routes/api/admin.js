var router = require('express').Router();
var basicAuth = require('@auth_basic');
var bcrypt = require('@auth_bcrypt');
var sql = require('@sql');
var errors = require('@errors');
var uniqueString = require('unique-string');

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

router.post('/request_auth_key', function (req, res) {
    if (!errors.queryExists(req, 'username')) {
        errors.sendErrorJSON(res, 'MISSING_PARAMETER', 'username required');
    } else if (!errors.queryExists(req, 'password')) {
        errors.sendErrorJSON(res, 'MISSING_PARAMETER', 'password required');
    } else if (!errors.queryExists(req, 'requested_permission')) {
        errors.sendErrorJSON(res, 'MISSING_PARAMETER', 'requested_permission required');
    } else {
        sql.select.authKeyPermissionCheck('aspace_admins', req.query.username, req.query.requested_permission, function (rows) {
            bcrypt.authCheck(null, req.query.password, rows[0].password, function () {
                var newAuth = {};
                newAuth['request_user'] = req.query.username;
                newAuth['auth_key'] = uniqueString();
                newAuth['permission'] = req.query.requested_permission;
                sql.insert.addObject('database_authority', newAuth, function (results) {
                    errors.sendErrorJSON(res, 'AUTH_KEY_ADDED', newAuth);
                }, function (error) {
                    throw error;
                });
            }, function () {
                errors.sendErrorJSON(res, 'AUTH_KEY_NOT_ADDED');
            });
        }, function () {
            errors.sendErrorJSON(res, 'AUTH_KEY_NOT_ADDED');
        }, function (error) {
            throw error;
        });
    }
});

module.exports = router;