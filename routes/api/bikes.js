var router = require('express').Router();
var geojson = require('geojson');
var errors = require('@errors');
const constants = require('@config');
var sql = require('@sql');
var geojson = require('geojson');

geojson.defaults = constants.geojson.settings;

router.get('/', function (req, res, next) {
    next(errors.getResponseJSON('BIKES_ENDPOINT_FUNCTION_SUCCESS', "Welcome to the bikeshare sub-API for aspace! :)"));
});

router.get('/ping', function (req, res, next) {
        next(errors.getResponseJSON('BIKES_ENDPOINT_FUNCTION_SUCCESS', "pong"));
});

router.post('/get_bikes_bbox/:outputType', function (req, res, next) {
    if (typeof req.body == 'undefined' || req.body === null) {
        next(errors.getResponseJSON('MISSING_BODY'));
    } else if (typeof req.body.sw == 'undefined' || req.body.sw === null) {
        next(errors.getResponseJSON('MISSING_BODY', "Missing body.sw"));
    } else if (typeof req.body.ne == 'undefined' || req.body.ne === null) {
        next(errors.getResponseJSON('MISSING_BODY', "Missing body.ne"));
    } else if (typeof req.body.sw.lat == 'undefined' || req.body.sw.lat === null) {
        next(errors.getResponseJSON('MISSING_BODY', "Missing body.sw.lat"));
    } else if (typeof req.body.sw.lng == 'undefined' || req.body.sw.lng === null) {
        next(errors.getResponseJSON('MISSING_BODY', "Missing body.sw.lng"));
    } else if (typeof req.body.ne.lat == 'undefined' || req.body.ne.lat === null) {
        next(errors.getResponseJSON('MISSING_BODY', "Missing body.ne.lat"));
    } else if (typeof req.body.ne.lng == 'undefined' || req.body.ne.lng === null) {
        next(errors.getResponseJSON('MISSING_BODY', "Missing body.ne.lng"));
    } else {
        sql.select.regularSelect('bike_locs', null, ['lat', 'lng', 'lat', 'lng'], ['>=', '>=', '<=', '<='], [req.body.sw.lat, req.body.sw.lng, req.body.ne.lat, req.body.ne.lng], null, function (results) {
                if (req.params.outputType == "json") {
                    next(errors.getResponseJSON('BIKES_ENDPOINT_FUNCTION_SUCCESS', results));
                } else if (req.params.outputType == "geojson") {
                    next(errors.getResponseJSON('BIKES_ENDPOINT_FUNCTION_SUCCESS', geojson.parse(results)));
                } else {
                    next(errors.getResponseJSON('INVALID_OR_MISSING_OUTPUT_TYPE'))
                }
            }, function () {
                next(errors.getResponseJSON('BIKES_ENDPOINT_FUNCTION_SUCCESS', []));
            },
            function (error) {
                next(error);
            });
    }
});

router.post('/get_bikes_radius/:outputType', function (req, res, next) {
    errors.checkQueries(req, res, ['radius_feet'], function () {
        if (JSON.stringify(req.body) == "{}" || typeof req.body == 'undefined' || req.body === null) {
            next(errors.getResponseJSON('MISSING_BODY', "lat/lng body required"));
        } else if (typeof req.body.lat == 'undefined' || req.body.lat === null) {
            next(errors.getResponseJSON('MISSING_BODY', "Missing body.lat"));
        } else if (typeof req.body.lng == 'undefined' || req.body.lng === null) {
            next(errors.getResponseJSON('MISSING_BODY', "Missing body.lng"));
        } else {
            var miles = req.query.radius_feet / 5280;
            sql.select.selectRadius('bike_locs', req.body.lat, req.body.lng, miles, function (results) {
                if (req.params.outputType == "json") {
                    next(errors.getResponseJSON('BIKES_ENDPOINT_FUNCTION_SUCCESS', results));
                } else if (req.params.outputType == "geojson") {
                    next(errors.getResponseJSON('BIKES_ENDPOINT_FUNCTION_SUCCESS', geojson.parse(results)));
                } else {
                    next(errors.getResponseJSON('INVALID_OR_MISSING_OUTPUT_TYPE'))
                }
            }, function () {
                next(errors.getResponseJSON('BIKES_ENDPOINT_FUNCTION_SUCCESS', []));
            }, function (error) {
                next(error);
            });
        }
    })
});

module.exports = router;