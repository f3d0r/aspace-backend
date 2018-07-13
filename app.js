require('module-alias/register');

// IMPORTS
const express = require('express');
const bodyParser = require('body-parser');
const constants = require('@config')
var cors = require('cors')

// EXPRESS SET UP
var app = express();

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(bodyParser.json());
app.use(cors())

app.use(require('./routes'));

// MAIN ENDPOINTS
app.get('/', function (req, res) {
    res.status(200).send("Welcome to the aspace API! :)");
});

app.get('/ping', function (req, res) {
    res.status(200).send("pong");
});

// START SERVER
var server = app.listen(constants.express.API_PORT, function () {
    console.log('Listening on port ' + server.address().port);
});