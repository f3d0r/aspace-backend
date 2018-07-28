require('module-alias/register');

// PACKAGE IMPORTS
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const {
    IncomingWebhook
} = require('@slack/client');

// LOCAL IMPORTS
const constants = require('@config');
const errors = require('@errors');
const errorCodes = require("@error-codes");

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
app.get('/', function (req, res, next) {
    next(errors.getResponseJSON('MAIN_ENDPOINT_FUNCTION_SUCCESS', "Welcome to the aspace API! :)"));
});

app.get('/ping', function (req, res, next) {
    next(errors.getResponseJSON('MAIN_ENDPOINT_FUNCTION_SUCCESS', "pong"));
});

// ERROR HANDLERS
app.use(errorHandler);

function errorHandler(error, req, res, next) {
    if (error == 'INVALID_BASIC_AUTH') {
        res.set("WWW-Authenticate", "Basic realm=\"Authorization Required\"");
        res.status(401).send("Authorization Required");
        sendSlackError(error, req);
    } else if (errors.getErrorCode(error) >= 403) {
        sendSlackError(error, req);
        res.status(errors.getErrorCode(error)).send(error);
    } else {
        res.status(errors.getErrorCode(error)).send(error);
    }
}

function sendSlackError(error, req) {
    var message = "aspace Backend Error Notification\n" + "Error: " + JSON.stringify(error) + "\nreq: " + req.url;
    webhook.send(message, function (error, res) {
        if (error) {
            console.log('Error: ', error);
        }
    });
}

// Check that all error codes in errorCodes.js are unique
function runTests() {
    var responseCodes = [];
    for (var currentError in errorCodes) {
        if (responseCodes.includes(errorCodes[currentError].RESPONSE_CODE))
            return 1;
        responseCodes.push(errorCodes[currentError].RESPONSE_CODE);
    }
    return (typeof process.env.PORT != 'undefined' && process.env.PORT != null) ? 0 : 1;
}

// Start server
if (runTests() == 0) {
    var server = app.listen(process.env.PORT, function () {
        console.log('Listening on port ' + server.address().port);
    });
} else {
    console.log("Please check that process.ENV.PORT is set and that all error codes in errorCodes.js are unique.");
}