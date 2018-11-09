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

router.post('/update_status', function (req, res, next) {
    errors.checkQueries(req, res, ['auth_key', 'spot_id', 'occupied', 'occupied'], function () {
        if (req.query.occupied != "F" && req.query.occupied != "T" && req.query.occupied != "N") {
            var response = errors.getResponseJSON('INVALID_STATUS_ENTERED', "occupied query must be equal to 'N', 'F', 'T'");
            res.status(response.code).send(response.res);
        } else {
            sql.select.databasePermissionCheck('database_authority', req.query.auth_key, 'update_status', function () {
                sql.update.updateSpotStatus(req.query.spot_id, req.query.occupied, function () {
                        var response = errors.getResponseJSON('SPOT_STATUS_CHANGED');
                        res.status(response.code).send(response.res);
                    },
                    function () {
                        var response = errors.getResponseJSON('INVALID_SPOT_ID');
                        res.status(response.code).send(response.res);
                    },
                    function (error) {
                        var response = errors.getResponseJSON('GENERAL_SERVER_ERROR', error);
                        next({
                            response,
                            error
                        });
                    });
            }, function () {
                var response = errors.getResponseJSON('INVALID_AUTH_KEY');
                res.status(response.code).send(response.res);
            });
        }
    });
});

router.get('/get_status/:outputType', function (req, res, next) {
    errors.checkQueries(req, res, ['block_id', 'spot_id'], function () {
        sql.select.regularSelect('parking', null, ['block_id', 'spot_id'], ['=', '='], [req.query.block_id, req.query.spot_id], null, function (results) {
            if (req.params.outputType == "json") {
                var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', results);
                res.status(response.code).send(response.res);
            } else if (req.params.outputType == "geojson") {
                var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', geojson.parse(results));
                res.status(response.code).send(response.res);
            } else {
                var response = next(errors.getResponseJSON('INVALID_OR_MISSING_OUTPUT_TYPE'));
                res.status(response.code).send(response.res);
            }
        }, function () {
            var response = errors.getResponseJSON('INVALID_BLOCK_ID_OR_SPOT_ID');
            res.status(response.code).send(response.res);
        }, function (error) {
            var response = errors.getResponseJSON('GENERAL_SERVER_ERROR', error);
            next({
                response,
                error
            });
        });
    }, function (res, foundQueries, missingQueries) {
        if (missingQueries.length == 2) {
            var response = errors.getResponseJSON('MISSING_PARAMETER', null, missingQueries[0] + " query required");
            res.status(response.code).send(response.res);
        } else {
            sql.select.regularSelect('parking', null, [foundQueries[0]], ['='], [req.query[foundQueries[0]]], null, function (results) {
                if (req.params.outputType == "json") {
                    var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', results);
                    res.status(response.code).send(response.res);
                } else if (req.params.outputType == "geojson") {
                    var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', geojson.parse(results));
                    res.status(response.code).send(response.res);
                } else {
                    var response = errors.getResponseJSON('INVALID_OR_MISSING_OUTPUT_TYPE');
                    res.status(response.code).send(response.res);
                }
            }, function () {
                var response = errors.getResponseJSON('INVALID_BLOCK_ID_OR_SPOT_ID');
                res.status(response.code).send(response.res);
            }, function (error) {
                var response = errors.getResponseJSON('GENERAL_SERVER_ERROR', error);
                next({
                    response,
                    error
                });
            });
        }
    });
});

router.post('/get_status_bbox/:outputType', function (req, res, next) {
    if (typeof req.body == 'undefined' || req.body === null) {
        var response = errors.getResponseJSON('MISSING_BODY');
        res.status(response.code).send(response.res);
    } else if (typeof req.body.sw == 'undefined' || req.body.sw === null) {
        var response = errors.getResponseJSON('MISSING_BODY', "Missing body.sw");
        res.status(response.code).send(response.res);
    } else if (typeof req.body.ne == 'undefined' || req.body.ne === null) {
        var response = errors.getResponseJSON('MISSING_BODY', "Missing body.ne");
        res.status(response.code).send(response.res);
    } else if (typeof req.body.sw.lat == 'undefined' || req.body.sw.lat === null) {
        var response = errors.getResponseJSON('MISSING_BODY', "Missing body.sw.lat");
        res.status(response.code).send(response.res);
    } else if (typeof req.body.sw.lng == 'undefined' || req.body.sw.lng === null) {
        var response = errors.getResponseJSON('MISSING_BODY', "Missing body.sw.lng");
        res.status(response.code).send(response.res);
    } else if (typeof req.body.ne.lat == 'undefined' || req.body.ne.lat === null) {
        var response = errors.getResponseJSON('MISSING_BODY', "Missing body.ne.lat");
        res.status(response.code).send(response.res);
    } else if (typeof req.body.ne.lng == 'undefined' || req.body.ne.lng === null) {
        var response = errors.getResponseJSON('MISSING_BODY', "Missing body.ne.lng");
        res.status(response.code).send(response.res);
    } else {
        sql.select.regularSelect('parking', null, ['lat', 'lng', 'lat', 'lng'], ['>=', '>=', '<=', '<='], [req.body.sw.lat, req.body.sw.lng, req.body.ne.lat, req.body.ne.lng], null, function (results) {
                if (req.params.outputType == "json") {
                    var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', results);
                    res.status(response.code).send(response.res);
                } else if (req.params.outputType == "geojson") {
                    var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', geojson.parse(results));
                    res.status(response.code).send(response.res);
                } else {
                    var response = errors.getResponseJSON('INVALID_OR_MISSING_OUTPUT_TYPE');
                }
            }, function () {
                var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', []);
                res.status(response.code).send(response.res);
            },
            function (error) {
                var response = errors.getResponseJSON('GENERAL_SERVER_ERROR', error);
                next({
                    response,
                    error
                });
            });
    }
});

router.post('/get_status_radius/:outputType', function (req, res, next) {
    errors.checkQueries(req, res, ['radius_feet'], function () {
        if (JSON.stringify(req.body) == "{}" || typeof req.body == 'undefined' || req.body === null) {
            var response = errors.getResponseJSON('MISSING_BODY', "lat/lng body required");
            res.status(response.code).send(response.res);
        } else if (typeof req.body.lat == 'undefined' || req.body.lat === null) {
            var response = errors.getResponseJSON('MISSING_BODY', "Missing body.lat");
            res.status(response.code).send(response.res);
        } else if (typeof req.body.lng == 'undefined' || req.body.lng === null) {
            var response = errors.getResponseJSON('MISSING_BODY', "Missing body.lng");
            res.status(response.code).send(response.res);
        } else {
            var miles = req.query.radius_feet / 5280;
            sql.select.selectRadius('parking', req.body.lat, req.body.lng, miles, function (results) {
                if (req.params.outputType == "json") {
                    var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', results);
                    res.status(response.code).send(response.res);
                } else if (req.params.outputType == "geojson") {
                    var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', geojson.parse(results));
                    res.status(response.code).send(response.res);
                } else {
                    var response = errors.getResponseJSON('INVALID_OR_MISSING_OUTPUT_TYPE');
                    res.status(response.code).send(response.res);
                }
            }, function () {
                var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', []);
                res.status(response.code).send(response.res);
            }, function (error) {
                var response = errors.getResponseJSON('GENERAL_SERVER_ERROR', error);
                next({
                    response,
                    error
                });
            });
        }
    })
});

router.get('/block_id_exists', function (req, res, next) {
    errors.checkQueries(req, res, ['block_id'], function () {
        var jsonReturn = {};
        sql.select.regularSelect('parking', null, ['block_id'], ['='], [req.query.block_id], 1, function () {
            jsonReturn['block_id_exists'] = "T";
            var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', jsonReturn);
            res.status(response.code).send(response.res);
        }, function () {
            jsonReturn['block_id_exists'] = "F";
            var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', jsonReturn);
            res.status(response.code).send(response.res);
        }, function (error) {
            var response = errors.getResponseJSON('GENERAL_SERVER_ERROR', error);
            next({
                response,
                error
            });
        })
    });
});

router.post('/get_min_size_parking/:outputType', function (req, res, next) {
    errors.checkQueries(req, res, ['radius_feet', 'spot_size_feet'], function () {
        if (req.query.spot_size_feet <= 0) {
            var response = errors.getResponseJSON('INVALID_PARAMETER', "spot_size_feet query should be > 0.");
            res.status(response.code).send(response.res);
        } else if (JSON.stringify(req.body) == "{}" || typeof req.body == 'undefined' || req.body === null) {
            var response = errors.getResponseJSON('MISSING_BODY', "lat/lng body required");
            res.status(response.code).send(response.res);
        } else if (typeof req.body.lat == 'undefined' || req.body.lat === null) {
            var response = errors.getResponseJSON('MISSING_BODY', "Missing body.lat");
            res.status(response.code).send(response.res);
        } else if (typeof req.body.lng == 'undefined' || req.body.lng === null) {
            var response = errors.getResponseJSON('MISSING_BODY', "Missing body.lng");
            res.status(response.code).send(response.res);
        } else {
            var miles = req.query.radius_feet / 5280;
            sql.select.selectRadius('parking', req.body.lat, req.body.lng, miles, function (results) {
                if (req.params.outputType == "json") {
                    var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', parkingCalc.searchApplicableParking(results, req.query.spot_size_feet));
                    res.status(response.code).send(response.res);
                } else if (req.params.outputType == "geojson") {
                    var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', geojson.parse(parkingCalc.searchApplicableParking(results, req.query.spot_size_feet)));
                    res.status(response.code).send(response.res);
                } else {
                    var response = errors.getResponseJSON('INVALID_OR_MISSING_OUTPUT_TYPE');
                    res.status(response.code).send(response.res);
                }
            }, function () {
                var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', []);
                res.status(response.code).send(response.res);
            }, function (error) {
                var response = errors.getResponseJSON('GENERAL_SERVER_ERROR', error);
                next({
                    response,
                    error
                });
            });
        }
    });
});

router.post('/upload_spots', function (req, res, next) {
    errors.checkQueries(req, res, ['auth_key'], function () {
        if (JSON.stringify(req.body) == "{}" || typeof req.body == 'undefined' || req.body === null) {
            res.status(422).json("MISSING_BODY", "body with parking spots to upload required");
        } else {
            sql.select.databasePermissionCheck('database_authority', req.query.auth_key, 'upload_spots', function () {
                sql.insert.addSpots(req.body, function (results) {
                    var response = errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', "SUCCESS!");
                    res.status(response.code).send(response.res);
                }, function (error) {
                    var response = errors.getResponseJSON('GENERAL_SERVER_ERROR', error);
                    next({
                        response,
                        error
                    });
                });
            }, function () {
                var response = (errors.getResponseJSON('INVALID_AUTH_KEY'));
                res.status(response.code).send(response.res);
            });
        }
    });
});

module.exports = router;