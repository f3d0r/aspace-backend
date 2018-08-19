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

    segmentsAgreggate = [];
    response['park_bike'].forEach(function (routeOption) {
        routeOption.segments.forEach(function (currentSegment) {
            segmentsAgreggate = segmentsAgreggate.concat(currentSegment);
        });
    });

    response['park_walk'].forEach(function (routeOption) {
        routeOption.segments.forEach(function (currentSegment) {
            segmentsAgreggate = segmentsAgreggate.concat(currentSegment);
        });
    });

    response['park_direct'].forEach(function (routeOption) {
        routeOption.segments.forEach(function (currentSegment) {
            segmentsAgreggate = segmentsAgreggate.concat(currentSegment);
        });
    });

    response['bbox'] = getBboxFromSegments(segmentsAgreggate);
    next(errors.getResponseJSON('ROUTING_ENDPOINT_FUNCTION_SUCCESS', response));
});

function getParkBikeRouteInfo(origin, park, bike, destination) {
    var routeSegments = [];
    routeSegments.push(getSegmentInfo("Drive to Parking", 'drive_park', origin, park));
    routeSegments.push(getSegmentInfo("Walk to Bike", 'park_bike', park, bike));
    routeSegments.push(getSegmentInfo("Bike to Destination", 'bike_walk', bike, destination));

    return {
        'segments': routeSegments,
        bbox: getBboxFromSegments(routeSegments)
    }
}

function getParkWalkRouteInfo(origin, park, destination) {
    var routeSegments = [];
    routeSegments.push(getSegmentInfo("Drive to Parking", 'drive_park', origin, park));
    routeSegments.push(getSegmentInfo("Walk to Destination", 'park_walk', park, destination));

    return {
        'segments': routeSegments,
        bbox: getBboxFromSegments(routeSegments)
    }
}

function getBboxFromSegments(routeSegments) {
    var latLngs = [];
    routeSegments.forEach(function (currentSegment) {
        latLngs.push([currentSegment.start.lng, currentSegment.start.lat]);
        latLngs.push([currentSegment.end.lng, currentSegment.end.lat]);
    });
    bboxCoordinates = turf.bbox(turf.lineString(latLngs));
    return {
        'se': {
            'lng': bboxCoordinates[0],
            'lat': bboxCoordinates[1],
        },
        'nw': {
            'lng': bboxCoordinates[2],
            'lat': bboxCoordinates[3]
        }
    }
}

function getSegmentInfo(prettyName, name, start, end) {
    var segment = {};
    segment['pretty_name'] = prettyName;
    segment['name'] = name;
    segment['start'] = start;
    segment['end'] = end;
    return segment;
}

module.exports = router;