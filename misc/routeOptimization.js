const spawn = require("child_process").spawn;

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
}