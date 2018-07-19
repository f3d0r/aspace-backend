var router = require('express').Router();
var errors = require('@errors');
var sql = require('@sql');
var routeOptimization = require('@route-optimization');

router.get('/', function (req, res) {
    res.status(200).send("This is the routing sub-API for aspace! :)");
});

router.get('/ping', function (req, res) {
    res.status(200).send("pong");
});

router.post('/get_route_waypoints', function (req, res, next) {
    if (typeof req.body == 'undefined' || req.body === null) {
        res.status(422).json(errors.getErrorJSON('MISSING_BODY'));
    } else if (typeof req.body.origin == 'undefined' || req.body.origin === null) {
        res.status(422).json(errors.getErrorJSON('MISSING_BODY', "Missing body.origin"));
    } else if (typeof req.body.dest == 'undefined' || req.body.dest === null) {
        res.status(422).json(errors.getErrorJSON('MISSING_BODY', "Missing body.dest"));
    } else if (typeof req.body.origin.lat == 'undefined' || req.body.origin.lat === null) {
        res.status(422).json(errors.getErrorJSON('MISSING_BODY', "Missing body.origin.lat"));
    } else if (typeof req.body.origin.lng == 'undefined' || req.body.origin.lng === null) {
        res.status(422).json(errors.getErrorJSON('MISSING_BODY', "Missing body.origin.lng"));
    } else if (typeof req.body.dest.lat == 'undefined' || req.body.dest.lat === null) {
        res.status(422).json(errors.getErrorJSON('MISSING_BODY', "Missing body.dest.lat"));
    } else if (typeof req.body.dest.lng == 'undefined' || req.body.dest.lng === null) {
        res.status(422).json(errors.getErrorJSON('MISSING_BODY', "Missing body.dest.lng"));
    } else if (typeof req.body.car_size == 'undefined' || req.body.car_size === null) {
        res.status(422).json(errors.getErrorJSON('MISSING_BODY', "Missing body.car_size"));
    } else {
        routeOptimization.getRouteWaypoints(req.body.origin.lng, req.body.origin.lat, req.body.dest.lng, req.body.dest.lat, req.body.car_size, function (response) {
            res.status(200).send(response);
        }, function (error) {
            next('ROUTE_CALCULATION_ERROR');
        })
    }
});

module.exports = router;