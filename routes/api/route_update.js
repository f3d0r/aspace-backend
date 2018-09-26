var router = require('express').Router();
var geojson = require('geojson');
var errors = require('@errors');
const constants = require('@config');
var sql = require('@sql');
// var parkingCalc = require('@parking-calc');
var geojson = require('geojson');

geojson.defaults = constants.geojson.settings;

router.get('/', function (req, res, next) {
    next(errors.getResponseJSON('ROUTE_UPDATE_ENDPOINT_FUNCTION_SUCCESS', "This is the parking sub-API for aspace! :)"));
});

router.get('/ping', function (req, res, next) {
    next(errors.getResponseJSON('ROUTE_UPDATE_ENDPOINT_FUNCTION_SUCCESS', "pong"));
});

router.get('/route_status/:user_id', function (req, res, next) {
    errors.checkQueries(req, res, ['coordinate'], function () {
        // do stuff here
        sql.insert.locationUpdate([req.query.coordinate, req.param.user_id], function (results) {
            next(errors.getResponseJSON('ROUTE_UPDATE_ENDPOINT_FUNCTION_SUCCESS', "SUCCESS!"));
        }, function (error) {
            next(error);
        });
    });
});

module.exports = router;