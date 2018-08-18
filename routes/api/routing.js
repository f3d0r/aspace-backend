var router = require('express').Router();
var errors = require('@errors');
var sql = require('@sql');
var routeOptimization = require('@route-optimization');
var turf = require('@turf/turf');

router.get('/', function (req, res, next) {
    next(errors.getResponseJSON('ROUTING_ENDPOINT_FUNCTION_SUCCESS', "This is the routing sub-API for aspace! :)"));
});

router.get('/ping', function (req, res, next) {
    next(errors.getResponseJSON('ROUTING_ENDPOINT_FUNCTION_SUCCESS', "pong"));
});

router.post('/get_route_waypoints', function (req, res, next) {
    if (typeof req.body == 'undefined' || req.body === null)
        next(errors.getResponseJSON('MISSING_BODY'));
    else if (typeof req.body.origin == 'undefined' || req.body.origin === null)
        next(errors.getResponseJSON('MISSING_BODY', "Missing body.origin"));
    else if (typeof req.body.dest == 'undefined' || req.body.dest === null)
        next(errors.getResponseJSON('MISSING_BODY', "Missing body.dest"));
    else if (typeof req.body.origin.lat == 'undefined' || req.body.origin.lat === null)
        next(errors.getResponseJSON('MISSING_BODY', "Missing body.origin.lat"));
    else if (typeof req.body.origin.lng == 'undefined' || req.body.origin.lng === null)
        next(errors.getResponseJSON('MISSING_BODY', "Missing body.origin.lng"));
    else if (typeof req.body.dest.lat == 'undefined' || req.body.dest.lat === null)
        next(errors.getResponseJSON('MISSING_BODY', "Missing body.dest.lat"));
    else if (typeof req.body.dest.lng == 'undefined' || req.body.dest.lng === null)
        next(errors.getResponseJSON('MISSING_BODY', "Missing body.dest.lng"));
    else if (typeof req.body.car_size == 'undefined' || req.body.car_size === null)
        next(errors.getResponseJSON('MISSING_BODY', "Missing body.car_size"));
    else
        routeOptimization.getRouteWaypoints(req.body.origin.lng, req.body.origin.lat, req.body.dest.lng, req.body.dest.lat, req.body.car_size, function (response) {
            next(errors.getResponseJSON('ROUTING_ENDPOINT_FUNCTION_SUCCESS', response));
        }, function (error) {
            next(errors.getResponseJSON('ROUTE_CALCULATION_ERROR'));
        });
});

router.post('/get_route_waypoints_test', function (req, res, next) {
    var response = {};
    response['origin'] = {
        'lng': -122.3584,
        'lat': 47.7930,
    };

    response['destination'] = {
        'lng': -122.3336,
        'lat': 47.6057
    };
    response['park_bike'] = [];
    response['park_bike'].push(getParkBikeRouteInfo(response['origin'], {
        'lng': -122.3118,
        'lat': 47.6182,
    }, {
        'lng': -122.3133,
        'lat': 47.6168,
    }, response['destination']));

    response['park_walk'] = [];
    response['park_walk'].push(getParkWalkRouteInfo(response['origin'], {
        'lng': -122.3344,
        'lat': 47.6091
    }, response['destination']));

    response['park_direct'] = [];
    response['park_direct'].push(getParkWalkRouteInfo(response['origin'], {
        'lng': -122.3336,
        'lat': 47.6057,
    }, response['destination']));

    bboxCoordinates = turf.bbox(turf.lineString(getLatLngAgreggatesFromRoute(response)));
    response['bbox'] = {
        'se': {
            'lng': bboxCoordinates[0],
            'lat': bboxCoordinates[1],
        },
        'nw': {
            'lng': bboxCoordinates[2],
            'lat': bboxCoordinates[3]
        }
    };
    next(errors.getResponseJSON('ROUTING_ENDPOINT_FUNCTION_SUCCESS', response));
});

function getParkBikeRouteInfo(origin, park, bike, destination) {
    var routeSegments = {};
    routeSegments['drive_park'] = getSegmentInfo(origin, park);
    routeSegments['park_bike'] = getSegmentInfo(park, bike);
    routeSegments['bike_walk'] = getSegmentInfo(bike, destination);
    return routeSegments;
}

function getParkWalkRouteInfo(origin, park, destination) {
    var routeSegments = {};
    routeSegments['drive_park'] = getSegmentInfo(origin, park);
    routeSegments['park_walk'] = getSegmentInfo(park, destination);
    return routeSegments;
}

function getSegmentInfo(start, end) {
    var segment = {};
    segment['start'] = start;
    segment['end'] = end;
    return segment;
}

function getLatLngAgreggatesFromRoute(response) {
    latLngAgreggate = [];

    latLngAgreggate.push([response.origin.lng, response.origin.lat]);
    latLngAgreggate.push([response.destination.lng, response.destination.lat]);
    
    latLngAgreggate.push([response.park_bike[0].drive_park.start.lng, response.park_bike[0].drive_park.start.lat]);
    latLngAgreggate.push([response.park_bike[0].drive_park.end.lng, response.park_bike[0].drive_park.end.lat]);
    latLngAgreggate.push([response.park_bike[0].park_bike.start.lng, response.park_bike[0].park_bike.start.lat]);
    latLngAgreggate.push([response.park_bike[0].park_bike.end.lng, response.park_bike[0].park_bike.end.lat]);
    latLngAgreggate.push([response.park_bike[0].bike_walk.start.lng, response.park_bike[0].bike_walk.start.lat]);
    latLngAgreggate.push([response.park_bike[0].bike_walk.end.lng, response.park_bike[0].bike_walk.end.lat]);

    latLngAgreggate.push([response.park_walk[0].drive_park.start.lng, response.park_walk[0].drive_park.start.lat]);
    latLngAgreggate.push([response.park_walk[0].drive_park.end.lng, response.park_walk[0].drive_park.end.lat]);
    latLngAgreggate.push([response.park_walk[0].park_walk.start.lng, response.park_walk[0].park_walk.start.lat]);
    latLngAgreggate.push([response.park_walk[0].park_walk.end.lng, response.park_walk[0].park_walk.end.lat]);

    latLngAgreggate.push([response.park_direct[0].drive_park.start.lng, response.park_direct[0].drive_park.start.lat]);
    latLngAgreggate.push([response.park_direct[0].drive_park.end.lng, response.park_direct[0].drive_park.end.lat]);
    latLngAgreggate.push([response.park_direct[0].park_walk.start.lng, response.park_direct[0].park_walk.start.lat]);
    latLngAgreggate.push([response.park_direct[0].park_walk.end.lng, response.park_direct[0].park_walk.end.lat]);

    return latLngAgreggate;
}

module.exports = router;