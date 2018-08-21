var router = require('express').Router();
var errors = require('@errors');
const constants = require('@config');
var sql = require('@sql');
var routeOptimization = require('@route-optimization');
var turf = require('@turf/turf');
const mbxDirections = require('@mapbox/mapbox-sdk/services/directions');
const directionsClient = mbxDirections({
    accessToken: constants.mapbox.API_KEY
});

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
    errors.checkQueries(req, res, ['origin_lat', 'origin_lng', 'dest_lat', 'dest_lng'], function () {
        getSegmentInfo([{
                    "pretty_name": "Drive to Parking",
                    "name": "drive_park",
                    "origin": {
                        'lng': parseInt(req.query.origin_lng),
                        'lat': parseInt(req.query.origin_lat)
                    },
                    "dest": {
                        'lng': -122.3118,
                        'lat': 47.6182
                    },
                },
                {
                    "pretty_name": "Walk to Bike",
                    "name": "walk_bike",
                    "origin": {
                        'lng': -122.3118,
                        'lat': 47.6182
                    },
                    "dest": {
                        'lng': -122.3133,
                        'lat': 47.6168
                    }
                },
                {
                    "pretty_name": "Bike to Destination",
                    "name": "bike_dest",
                    "origin": {
                        'lng': -122.3133,
                        'lat': 47.6168
                    },
                    "dest": {
                        'lng': parseInt(req.query.dest_lng),
                        'lat': parseInt(req.query.dest_lat)
                    }
                }
            ],
            function (fullSegmentResponse) {
                fullSegmentResponse['origin'] = {
                    'lng': parseInt(req.query.origin_lng),
                    'lat': parseInt(req.query.origin_lat)
                };
                fullSegmentResponse['dest'] = {
                    'lng': parseInt(req.query.dest_lng),
                    'lat': parseInt(req.query.dest_lat)
                }
                // segmentsAgreggate = [];
                // response['park_bike'].forEach(function (routeOption) {
                //     routeOption.segments.forEach(function (currentSegment) {
                //         segmentsAgreggate = segmentsAgreggate.concat(currentSegment);
                //     });
                // });
                // response['bbox'] = getBboxFromSegments(segmentsAgreggate);
                next(errors.getResponseJSON('ROUTING_ENDPOINT_FUNCTION_SUCCESS', fullSegmentResponse));
            });
    });
});

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

function getSegmentInfo(segments, cb) {
    segmentsReturn = [];
    requests = [];

    segments.forEach(function (currentSegment) {
        var segment = {};
        segment['pretty_name'] = currentSegment.pretty_name;
        segment['name'] = currentSegment.name;
        segment['origin'] = currentSegment.origin;
        segment['dest'] = currentSegment.dest;
        segmentsReturn.push(segment);
        requests.push(getDirectionsRequest(getProfile(segment['name']), segment['origin'], segment['dest']));
    });
    Promise.all(requests)
        .then(data => {
            for (var index = 0; index < data.length; index++) {
                segmentsReturn[index]['directions'] = data[index].body;
            }
            cb(segmentsReturn);
        }).catch(function (error) {
            console.log("ERROR");
            console.log(error);
        });
}

function getDirectionsRequest(profile, origin, dest) {
    return directionsClient
        .getDirections({
            profile: profile,
            waypoints: [{
                    coordinates: [origin.lng, origin.lat]
                },
                {
                    coordinates: [dest.lng, dest.lat],
                }
            ],
            annotations: ["duration", "distance", "speed", "congestion"],
            bannerInstructions: true,
            geometries: "polyline6",
            overview: "full",
            roundaboutExits: true,
            steps: true,
            voiceInstructions: true
        }).send();
}

function getProfile(segmentName) {
    if (segmentName == "drive_park") {
        return "driving-traffic";
    } else if (segmentName == "walk_bike") {
        return "walking";
    } else if (segmentName == "bike_dest") {
        return "cycling";
    } else if (segmentName == "walk_dest") {
        return "walking";
    } else {
        return "driving-traffic";
    }
}

module.exports = router;