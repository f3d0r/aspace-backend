var router = require('express').Router();
var geojson = require('geojson');
var appRoot = require('app-root-path')
var path = require('path')
var fs = require('fs');
var turf = require('@turf/turf');
var errors = require('@errors');
const constants = require('@config');
var sql = require('@sql');

var regionBounds = [];
initRegions();

async function initRegions() {
    var results = await new Promise(function (resolveAll, rejectAll) {
        fs.readdir(path.join(appRoot.path, 'config/regions'), function (err, items) {
            var reqs = [];
            for (var i = 0; i < items.length; i++) {
                reqs.push(new Promise(function (resolve, reject) {
                    fs.readFile(path.join(appRoot.path, 'config/regions', items[i]), 'utf-8', function (err, data) {
                        if (err) {
                            reject(data);
                        } else {
                            resolve(JSON.parse(data));
                        }
                    });
                }));
            }
            Promise.all(reqs)
                .then(function (responses) {
                    resolveAll(responses);
                }).catch(function (err) {
                    rejectAll(err);
                })
        });
    });
    for (var index = 0; index < results.length; index++) {
        regionBounds.push(turf.polygon(results[index].features[0].geometry.coordinates));
    }
}

router.get('/', function (req, res, next) {
    var response = errors.getResponseJSON('ROUTING_NOT_AVAILABLE');
    res.status(response.code).send(response.res);
});

router.get('/ping', function (req, res, next) {
    next(errors.getResponseJSON('ENDPOINT_FUNCTION_SUCCESS', "pong"));
});

router.get('/get_by_loc', function (req, res, next) {
    errors.checkQueries(req, res, ['lat', 'lng'], function () {
        var found = false
        regionBounds.forEach(function(currentRegion) {
            if (turf.booleanPointInPolygon(turf.point([req.query.lng, req.query.lat]), currentRegion)) {
                found = true;
            }
        });
        // if (!found) {
        //     res.
        // }
    });
});

module.exports = router;