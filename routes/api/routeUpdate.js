var router = require('express').Router();
var geojson = require('geojson');
var errors = require('@errors');
const constants = require('@config');
var sql = require('@sql');
// var parkingCalc = require('@parking-calc');
var geojson = require('geojson');

geojson.defaults = constants.geojson.settings;

router.get('/', function (req, res, next) {
    var response = (errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', "This is the parking sub-API for aspace! :)"));
    res.status(response.code).send(response.res);
});

router.get('/ping', function (req, res, next) {
    var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', "pong");
    res.status(response.code).send(response.res);
});

router.get('/route_status/:session_id', function (req, res, next) {
    errors.checkQueries(req, res, ['curr_lng', 'curr_lat'], function () {
        sql.update.locationUpdate(req.query.curr_lng, req.query.curr_lat, req.params.session_id, function (results) {
            var response = errors.getResponseJSON('ROUTE_STATUS_UPDATE_SUCCESS');
            res.status(response.code).send(response.res);
        }, function (error) {
            var response = errors.getResponseJSON('GENERAL_SERVER_ERROR', error);
            next({
                response,
                error
            });
        });
    });
});

module.exports = router;