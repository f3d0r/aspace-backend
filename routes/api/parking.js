var router = require('express').Router();
var geojson = require('geojson');
var errors = require('@errors');
const constants = require('@config');
var sql = require('@sql');
var parkingCalc = require('@parking-calc');
var geojson = require('geojson');

geojson.defaults = constants.geojson.settings;

router.get('/', function (req, res, next) {
    var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', "This is the parking sub-API for aspace! :)");
    res.status(response.code).send(response.res);
});

router.get('/ping', function (req, res, next) {
    var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', "pong");
    res.status(response.code).send(response.res);
});

router.get('/get_spots/:outputType', function (req, res, next) {
    errors.checkQueries(req, res, ['id'], function () {
        sql.select.regularSelect('parkopedia_parking', null, ['id'], ['='], [req.query.id], null, function (results) {
            if (req.params.outputType == "json") {
                response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', results);
                res.status(response.code).send(response.res);
            } else if (req.params.outputType == "geojson") {
                response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', geojson.parse(results));
                res.status(response.code).send(response.res);
            } else {
                response = next(errors.getResponseJSON('INVALID_OR_MISSING_OUTPUT_TYPE'));
                res.status(response.code).send(response.res);
            }
        }, function () {
            response = errors.getResponseJSON('INVALID_BLOCK_ID_OR_SPOT_ID');
            res.status(response.code).send(response.res);
        }, function (error) {
            response = errors.getResponseJSON('GENERAL_SERVER_ERROR', error);
            next({
                response,
                error
            });
        });
    });
});

router.post('/get_spots_bbox/:outputType', function (req, res, next) {
    if (typeof req.body == 'undefined' || req.body === null) {
        response = errors.getResponseJSON('MISSING_BODY');
        res.status(response.code).send(response.res);
    } else if (typeof req.body.sw == 'undefined' || req.body.sw === null) {
        response = errors.getResponseJSON('MISSING_BODY', "Missing body.sw");
        res.status(response.code).send(response.res);
    } else if (typeof req.body.ne == 'undefined' || req.body.ne === null) {
        response = errors.getResponseJSON('MISSING_BODY', "Missing body.ne");
        res.status(response.code).send(response.res);
    } else if (typeof req.body.sw.lat == 'undefined' || req.body.sw.lat === null) {
        response = errors.getResponseJSON('MISSING_BODY', "Missing body.sw.lat");
        res.status(response.code).send(response.res);
    } else if (typeof req.body.sw.lng == 'undefined' || req.body.sw.lng === null) {
        response = errors.getResponseJSON('MISSING_BODY', "Missing body.sw.lng");
        res.status(response.code).send(response.res);
    } else if (typeof req.body.ne.lat == 'undefined' || req.body.ne.lat === null) {
        response = errors.getResponseJSON('MISSING_BODY', "Missing body.ne.lat");
        res.status(response.code).send(response.res);
    } else if (typeof req.body.ne.lng == 'undefined' || req.body.ne.lng === null) {
        response = errors.getResponseJSON('MISSING_BODY', "Missing body.ne.lng");
        res.status(response.code).send(response.res);
    } else {
        sql.select.regularSelect('parkopedia_parking', null, ['lat', 'lng', 'lat', 'lng'], ['>=', '>=', '<=', '<='], [req.body.sw.lat, req.body.sw.lng, req.body.ne.lat, req.body.ne.lng], null, function (results) {
                if (req.params.outputType == "json") {
                    response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', results);
                    res.status(response.code).send(response.res);
                } else if (req.params.outputType == "geojson") {
                    response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', geojson.parse(results));
                    res.status(response.code).send(response.res);
                } else {
                    response = errors.getResponseJSON('INVALID_OR_MISSING_OUTPUT_TYPE');
                }
            }, function () {
                response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', []);
                res.status(response.code).send(response.res);
            },
            function (error) {
                response = errors.getResponseJSON('GENERAL_SERVER_ERROR', error);
                next({
                    response,
                    error
                });
            });
    }
});

router.post('/get_spots_radius/:outputType', function (req, res, next) {
    errors.checkQueries(req, res, ['radius_feet'], function () {
        if (JSON.stringify(req.body) == "{}" || typeof req.body == 'undefined' || req.body === null) {
            response = errors.getResponseJSON('MISSING_BODY', "lat/lng body required");
            res.status(response.code).send(response.res);
        } else if (typeof req.body.lat == 'undefined' || req.body.lat === null) {
            response = errors.getResponseJSON('MISSING_BODY', "Missing body.lat");
            res.status(response.code).send(response.res);
        } else if (typeof req.body.lng == 'undefined' || req.body.lng === null) {
            response = errors.getResponseJSON('MISSING_BODY', "Missing body.lng");
            res.status(response.code).send(response.res);
        } else {
            var miles = req.query.radius_feet / 5280;
            sql.select.selectRadius('parkopedia_parking', req.body.lat, req.body.lng, miles, function (results) {
                if (req.params.outputType == "json") {
                    response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', results);
                    res.status(response.code).send(response.res);
                } else if (req.params.outputType == "geojson") {
                    response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', geojson.parse(results));
                    res.status(response.code).send(response.res);
                } else {
                    response = errors.getResponseJSON('INVALID_OR_MISSING_OUTPUT_TYPE');
                    res.status(response.code).send(response.res);
                }
            }, function () {
                response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', []);
                res.status(response.code).send(response.res);
            }, function (error) {
                response = errors.getResponseJSON('GENERAL_SERVER_ERROR', error);
                next({
                    response,
                    error
                });
            });
        }
    });
});

router.post('/get_min_size_parking/:outputType', function (req, res, next) {
    errors.checkQueries(req, res, ['radius_feet', 'spot_size_feet'], function () {
        if (req.query.spot_size_feet <= 0) {
            response = errors.getResponseJSON('INVALID_PARAMETER', "spot_size_feet query should be > 0.");
            res.status(response.code).send(response.res);
        } else if (JSON.stringify(req.body) == "{}" || typeof req.body == 'undefined' || req.body === null) {
            response = errors.getResponseJSON('MISSING_BODY', "lat/lng body required");
            res.status(response.code).send(response.res);
        } else if (typeof req.body.lat == 'undefined' || req.body.lat === null) {
            response = errors.getResponseJSON('MISSING_BODY', "Missing body.lat");
            res.status(response.code).send(response.res);
        } else if (typeof req.body.lng == 'undefined' || req.body.lng === null) {
            response = errors.getResponseJSON('MISSING_BODY', "Missing body.lng");
            res.status(response.code).send(response.res);
        } else {
            var miles = req.query.radius_feet / 5280;
            sql.select.selectRadius('parkopedia_parking', req.body.lat, req.body.lng, miles, function (results) {
                if (req.params.outputType == "json") {
                    response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', parkingCalc.searchApplicableParking(results, req.query.spot_size_feet));
                    res.status(response.code).send(response.res);
                } else if (req.params.outputType == "geojson") {
                    response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', geojson.parse(parkingCalc.searchApplicableParking(results, req.query.spot_size_feet)));
                    res.status(response.code).send(response.res);
                } else {
                    response = errors.getResponseJSON('INVALID_OR_MISSING_OUTPUT_TYPE');
                    res.status(response.code).send(response.res);
                }
            }, function () {
                response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', []);
                res.status(response.code).send(response.res);
            }, function (error) {
                response = errors.getResponseJSON('GENERAL_SERVER_ERROR', error);
                next({
                    response,
                    error
                });
            });
        }
    });
});

module.exports = router;