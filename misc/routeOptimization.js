//var errors = require('@errors');
//const constants = require('@config');
var sql = require('@sql');
var request = require("request");
//var rp = require("request-promise");
const math = require('mathjs');
var googleMapsClient = require('@google/maps').createClient({
    Promise: Promise,
    key: 'AIzaSyAw5S7tPXaLOQ499BzWAXqEGpJ50t7G3c0'
});

//define functions that should be accessible from outside this file inside "module.exports"
module.exports = {
    //getRouteWaypoints: function (someParams, successCB, failCB) {}

    // 1. Get parking spots by radius 
    OptimalSpot: function (origin, destination, car_radius, bike_radius, spot_size, params, param_weights, number_options, code) {
        /* Algorithm:
	1. Obtain all spots within certain radius of user destination
	2. Filter out all occupied spots
	3. For each parking spot, compute driving time from origin to spot and
	add to walking / biking time from spot to user destination
	4. Store this total time, the parking cost, and all other parameters
    in a |params| x |spots| array
    5. Multiply this parameter array by weights
	6. Compute and find minimum of cost function
	7. Return each minimum (i.e. best spot w.r.t. conditions) */

        var car_options = {
            method: 'POST',
            url: 'https://api.trya.space/v1/parking/get_min_size_parking/json',
            qs: {
                radius_feet: car_radius.toString(),
                spot_size_feet: spot_size.toString()
            },
            headers: {
                'content-type': 'application/json'
            },
            body: {
                lng: destination[0],
                lat: destination[1]
            },
            json: true
        };

        var parking_spot_data = []

        request(car_options, function (error, response, body) {
            if (error) throw new Error(error);
            parking_spot_data = body["res_content"]
            // print('Number of spots found in radius:')
            // print(parking_spot_data.length)

            // 2. Filter out occupied spots
            for (var i = 0; i < parking_spot_data.length; i++) {
                if (parking_spot_data[i]["occupied"] == 'T') {
                    delete parking_spot_data[i]
                }
            }
            /* print('Number of UNOCCUPIED spots found in radius:')
            print(parking_spot_data.length) */

            // 3. Acquire driving times
            var driving_reqs = []
            const orig_s = origin[1].toString() + ', ' + origin[0].toString()
            for (var i = 0; i < parking_spot_data.length; i++) {
                driving_reqs.push(
                    googleMapsClient.directions({
                        // lat lngs of each 
                        origin: orig_s,
                        destination: parking_spot_data[i]["lat"].toString() + ', ' + parking_spot_data[i]["lng"].toString(),
                        mode: "driving",
                    }).asPromise()
                    .then(response => {
                        //print(response)
                        return response.json.routes[0].legs[0].duration.value
                    })
                    .catch(function (error) {
                        console.log("DRIVE REQS ERROR:")
                        print(error.message);
                    })
                );
            }
            //print(driving_reqs);
            Promise.all(driving_reqs).then(function (results) {
                var times = [].concat.apply([], results);

                if (code === 1) {
                    // Biking optimization
                    // Acquire available bikes:
                    var bike_data = []
                    for (i in parking_spot_data) {
                        sql.select.selectRadius('bike_locs', parking_spot_data[i]["lat"], parking_spot_data[i]["lng"], bike_radius / 5280, function (results) {
                            //results are defined here as var "results"
                            bike_data.push(results)
                        }, function () {
                            //no results were found 
                        }, function (error) {
                            //an error occurred (defined as var "error")
                        });
                    };

                    /* print("Parking spot parameters: ")
                    print(X) */

                    // Final drive & park optimization
                    var fX = math.multiply(math.matrix(param_weights), X);
                    print("car fX: " + fX)
                    const best_car_indices = top_n(fX["_data"], number_options)
                    var best_spots = []
                    for (i in best_car_indices) {
                        best_spots.push(parking_spot_data[best_car_indices[i]])
                    }
                    if (code === 0) {
                        /* print('Best drive & park spots:')
                        print(best_spots) */
                        return best_spots
                    }

                    if (code === 1) {
                        // Biking optimization
                        // Acquire available bikes:
                        var bike_data = []
                        for (i in parking_spot_data) {
                            bike_options["body"]["lng"] = parking_spot_data[i]["lng"];
                            bike_options["body"]["lat"] = parking_spot_data[i]["lat"];
                            sql.select.selectRadius('bike_locs', parking_spot_data[i]["lat"], parking_spot_data[i]["lng"], bike_radius / 5280, function (results) {
                                //results are defined here as var "results"
                                bike_data.push(results)
                            }, function () {
                                //no results were found 
                            }, function (error) {
                                //an error occurred (defined as var "error")
                            });
                        };

                        var bike_coords = []
                        var bike_reqs = []
                        for (i in results) {
                            bike_coords.push([])
                            // add coordinate
                            bike_coords[i].push(
                                parking_spot_data[i]["lat"].toString() + ',' + parking_spot_data[i]["lng"].toString()
                            )
                        }
                        print(results.length)
                        for (var i = 0; i < results.length; i++) {
                            for (var j = 0; j < bike_coords[i].length; j++) {
                                bike_reqs.push(
                                    googleMapsClient.directions({
                                        origin: bike_coords[i][j],
                                        destination: destination[1].toString() + ', ' + destination[0].toString(),
                                        mode: "bicycling"
                                    })
                                    .asPromise()
                                    .then(function (response) {
                                        //print(response)
                                        return response.json.routes[0].legs[0].duration.value
                                    })
                                    .catch(function (err) {
                                        if (err === 'timeout') {
                                            print('timeout error')
                                        } else if (err.json) {
                                            print("error.json :")
                                            print(err.json)
                                            print("Response status: " + err.status) // Current error
                                        } else {
                                            print('network error')
                                        }
                                    })
                                );
                            }
                        }
                        // print(bike_reqs)

                        Promise.all(bike_reqs).then(function (results) {
                            // cat these biking times to X and re-optimize!
                            X.push(sub_least(results))
                            // print(X)
                            param_weights.push(1e-1)
                            fX = math.multiply(math.matrix(param_weights), X);
                            const best_bike_indices = top_n(fX["_data"], number_options)
                            /* print('bike fX: ' + fX)
                            print('best bike spots: ' + best_bike_indices) */
                            best_spots = []
                            for (i in best_car_indices) {
                                best_spots.push(parking_spot_data[best_bike_indices[i]])
                            }
                            return best_spots
                        });
                    }
                    if (code === 2) {
                        // Walking time optimization
                        var walk_time_reqs = []
                        for (var i = 0; i < parking_spot_data.length; i++) {
                            walk_time_reqs.push(
                                googleMapsClient.directions({
                                    origin: parking_spot_data[i]["lat"].toString() + ',' + parking_spot_data[i]["lng"].toString(),
                                    destination: destination[1].toString() + ', ' + destination[0].toString(),
                                    mode: "walking"
                                })
                                .asPromise()
                                .then(function (response) {
                                    // print(response)
                                    return response.json.routes[0].legs[0].duration.value
                                })
                                .catch(function (err) {
                                    if (err === 'timeout') {
                                        print('timeout error')
                                    } else if (err.json) {
                                        print("error.json :")
                                        print(err.json)
                                        print("Response status: " + err.status) // Current error
                                    } else {
                                        print('network error')
                                    }
                                })
                            );
                        }

                        Promise.all(walk_time_reqs).then(function (results) {
                            var X_walk = Object.assign([], X);
                            var walk_weights = Object.assign([], param_weights)
                            results = sub_least(results)
                            results = results["_data"]
                            X_walk.push(results)
                            walk_weights.push(1e-2)
                            /* print('walk X: '+X_walk)
                            print(X_walk)
                            print('walk_weights: ' + walk_weights)
                            print(walk_weights) */
                            fX = math.multiply(math.matrix(walk_weights), X_walk);
                            const best_walk_indices = top_n(fX["_data"], number_options);
                            /* print('walk fX: ' + fX["_data"])
                            print(fX)
                            print('best walking spots: ' + best_walk_indices) */
                            best_spots = []
                            for (i in best_car_indices) {
                                best_spots.push(parking_spot_data[best_walk_indices[i]])
                            }
                            return best_spots
                        });
                    }
                }
            });
        });
    }
}

function sub_least(arr) {
    var min_vec = math.multiply(math.min(arr), math.ones(1, arr.length))
    return math.subtract(math.matrix(arr), min_vec["_data"][0])
}

function center(arr) {
    var meanvec = math.multiply(math.mean(arr), math.ones(1, arr.length))
    return math.subtract(math.matrix(arr), meanvec["_data"][0])
}

function top_n(list, n) {
    // Assume list is list, not necessarily math.matrix type
    var indices = []
    for (var i = 0; i < n; i++) {
        indices.push(list.findIndex(i => i === math.min(list)))
        delete list[indices[i]]
        list = list.filter(Number)
        for (j in indices) {
            if (i > j & indices[i] >= indices[j]) {
                indices[i]++
            }
        }
    }
    return indices
}

/**
 * Helper function to output a value in the console. Value will be formatted.
 * @param {*} value
 */
function print(value) {
    if (typeof (value) === 'string') {
        console.log(value)
    } else { // assume value is a mathematical structure
        const precision = 14
        console.log(math.format(value, precision))
    }
}

// --BBOX SEARCH FOR BIKES--
// sql.select.regularSelect('bike_locs', null, ['lat', 'lng', 'lat', 'lng'], ['>=', '>=', '<=', '<='], [someSWLat, someSWLng, someNELat, someNELng], null, function (results) {
//         //results are defined here as var "results"
//     }, function () {
//         //no results were found 
//     },
//     function (error) {
//         //an error occurred (defined as var "error")
//     });

/* // --RADIUS SEARCH FOR BIKES--
var miles = req.query.radius_feet / 5280;
sql.select.selectRadius('bike_locs', someCenterLat, someCenterLng, miles, function (results) {
   //results are defined here as var "results"
}, function () {
    //no results were found 
}, function (error) {
    //an error occurred (defined as var "error")
}); */