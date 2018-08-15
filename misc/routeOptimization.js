const spawn = require("child_process").spawn;
const parkingCalc = require('@parking-calc');
const sql = require('@sql');
const constants = require('@config');
const mbxMatrix = require('@mapbox/mapbox-sdk/services/matrix');
const matrixClient = mbxMatrix({ accessToken: constants.mapbox.API_KEY });

module.exports = {
    getRouteWaypoints: function (originLng, originLat, destinationLng, destinationLat, carSize, successCB, failCB) {
        const optimizationProcess = spawn('python3', ["./optimization/multi_distance_test.py", originLng, originLat, destinationLng, destinationLat, carSize]);
        optimizationProcess.stdout.on('data', function (data) {
            jsonData = JSON.parse(data.toString().replace(/'/g, "\""));
            successCB(jsonData);
        });
        optimizationProcess.stderr.on('data', (data) => {
            failCB(data.toString());
        });
    }
    // put functions that we need to access from other files here
}

// function acquireX(originLng, originLat, destination, radiusFeet, spotSizeFeet, params) {
//     // 1. Get parking spots by radius
//     // Users lat, lng, origin must go in payload:
//     var miles = radiusFeet / 5280;
//     sql.select.selectRadius('parking', originLat, originLng, miles, function (results) {
//         data = JSON.parse(parkingCalc.searchApplicableParking(results, spotSizeFeet));
//         if (data.length == 0) {
//             filterAndDrivingTimes(data);
//         }
//     }, function () {}, function (error) {
//         throw error;
//     });
// }

// SAMPLE MAPBOX MATRIX CALL (FROM API DOCS)
// matrixClient
//   .getMatrix({
//     points: [
//       {
//         coordinates: [2.2, 1.1]
//       },
//       {
//         coordinates: [2.2, 1.1],
//         approach: 'curb'
//       },
//       {
//         coordinates: [3.2, 1.1]
//       },
//       {
//         coordinates: [4.2, 1.1]
//       }
//     ],
//     profile: 'walking'
//   })
//   .send()
//   .then(response => {
//       const matrix = response.body;
//   });