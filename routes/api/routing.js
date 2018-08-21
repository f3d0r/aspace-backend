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

router.post('/get_drive_walk_waypoints', function (req, res, next) {
    errors.checkQueries(req, res, ['origin_lat', 'origin_lng', 'dest_lat', 'dest_lng'], function () {
        getSegmentInfo([{
                    "pretty_name": "Drive to Parking",
                    "name": "drive_park",
                    "origin": {
                        'lng': parseFloat(req.query.origin_lng),
                        'lat': parseFloat(req.query.origin_lat)
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
                        'lng': parseFloat(req.query.dest_lng),
                        'lat': parseFloat(req.query.dest_lat)
                    }
                }
            ],
            function (fullSegmentResponse) {
                fullSegmentResponse['origin'] = {
                    'lng': parseFloat(req.query.origin_lng),
                    'lat': parseFloat(req.query.origin_lat)
                };
                fullSegmentResponse['dest'] = {
                    'lng': parseFloat(req.query.dest_lng),
                    'lat': parseFloat(req.query.dest_lat)
                }
                next(errors.getResponseJSON('ROUTING_ENDPOINT_FUNCTION_SUCCESS', fullSegmentResponse));
            });
    });
});

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