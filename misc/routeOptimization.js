var errors = require('@errors');
const constants = require('@config');
var sql = require('@sql');

//define functions that should be accessible from outside this file inside "module.exports"
module.exports = {
    getRouteWaypoints: function (someParams, successCB, failCB) {}
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

// --RADIUS SEARCH FOR BIKES--
// var miles = req.query.radius_feet / 5280;
// sql.select.selectRadius('bike_locs', someCenterLat, someCenterLng, miles, function (results) {
//     //results are defined here as var "results"
// }, function () {
//     //no results were found 
// }, function (error) {
//     //an error occurred (defined as var "error")
// });