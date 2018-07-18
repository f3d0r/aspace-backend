require('module-alias/register');

// IMPORTS
const express = require('express');
const bodyParser = require('body-parser');
const constants = require('@config');
const errors = require('@errors');
const cors = require('cors');
const {
    IncomingWebhook
} = require('@slack/client');

const webhook = new IncomingWebhook(constants.slack.webhook);

// EXPRESS SET UP
var app = express();

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(bodyParser.json());
app.use(cors());

app.use(require('./routes'));

// MAIN ENDPOINTS
app.get('/', function (req, res) {
    res.status(200).send("Welcome to the aspace API! :)");
});

app.get('/ping', function (req, res) {
    res.status(200).send("pong");
});

// ERROR HANDLERS
app.use(errorHandler);

function errorHandler(err, req, res, next) {
    if (errors.getErrorJSON(err) == 'undefined') {
        res.status(err.statusCode).json({
            "bodyReceived": err.body,
            "error": err.type
        });
        sendSlackError(err, req);
    } else {
        res.status(errors.getErrorCode(err)).send(errors.getErrorJSON(err));
    }

}

function sendSlackError(error, req) {
    var message = "aspace Backend Error Notification\n" + "Error: " + error + "\nreq: " + req.url;
    webhook.send(message, function (err, res) {
        if (err) {
            console.log('Error:', err);
        }
    });
}

// START SERVER
var server = app.listen(constants.express.API_PORT, function () {
    console.log('Listening on port ' + server.address().port);
});