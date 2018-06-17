const express = require('express')
const app = express()

var port = 5000;

app.get('/ping', function (req, res) {
    res.send('pong');
})

app.listen(port, function () {
    console.log("Server has started on port " + port + "!");
})