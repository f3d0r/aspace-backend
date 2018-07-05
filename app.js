// IMPORTS
const express = require('express');
const uniqueString = require('unique-string');
const request = require("request");
const mysql = require('mysql');
var ERROR_CODES = require('./errorCodes');

// CONSTANTS
const TWILIO_ACCOUNT_SID = 'twilio_sid';
const TWILIO_AUTH_TOKEN = 'twilio_auth_token';

const DATABASE_USER = 'api';
const DATABASE_PASSWORD = 'db_password';
const DATABASE_NAME = 'aspace';
const DATABASE_PORT = 'db_port';
const SOCKET_PATH = '/var/run/mysqld/mysqld.sock';

const API_PORT = 3000;

// CONNECTION AND CLIENT SET UP

const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

var connection = mysql.createConnection({
    host: '159.65.70.74',
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME,
    port: DATABASE_PORT,
    // socketPath: SOCKET_PATH
});

connection.connect(function (err) {
    if (err) {
        console.error('MySQL connection error : ' + err.stack);
        return;
    }
    console.log('MySQL successfully connected!');
});

var app = express();
var auth = express();
var parking = express();
app.use(express.json());
app.use('/auth', auth);
app.use('/parking', parking);

// MAIN APP ENDPOINTS

app.get('/', function (req, res) {
    res.status(200).send("Welcome to the aspace API! :)");
});

app.get('/ping', function (req, res) {
    res.status(200).send("pong");
});

// PARKING ENDPOINTS
parking.get('/', function (req, res) {
    res.status(200).send("This is the parking sub-API for aspace! :)");
});

parking.post('/update_status', function (req, res) {
    if (!queryExists(req, 'auth_key')) {
        sendErrorJSON(res, 'MISSING_AUTH_KEY');
    } else if (!queryExists(req, 'spot_id')) {
        sendErrorJSON(res, 'MISSING_PARAMETER', 'spot_id required');
    } else if (!queryExists(req, 'occupied')) {
        sendErrorJSON(res, 'MISSING_PARAMETER', 'occupied required');
    } else {
        var sql = "SELECT * FROM `database_authority` WHERE `auth_key` = " + escapeQuery(req.query.auth_key) + " AND `permission` = 'update_spots'";
        connection.query(sql, function (error, rows) {
            if (rows.length == 1) {
                var sql = "UPDATE `parking` set `occupied` = " + escapeQuery(req.query.occupied) + " WHERE `spot_id` = " + escapeQuery(req.query.spot_id);
                connection.query(sql, function (error, results, fields) {
                    if (results.affectedRows == 0) {
                        sendErrorJSON(res, 'INVALID_SPOT_ID');
                    } else {
                        res.status(200).send("spot_id successfully updated!");
                    }
                });
            } else {
                sendErrorJSON(res, 'INVALID_AUTH_KEY');
            }
        });
    }
});

parking.get('/get_status', function (req, res) {
    if (!queryExists(req, 'block_id') && !queryExists(req, 'spot_id')) {
        sendErrorJSON(res, 'MISSING_PARAMETER', 'block_id or spot_id required');
    } else if (!queryExists(req, 'block_id')) {
        connection.query('SELECT * from parking where spot_id = ' + escapeQuery(req.query.spot_id), function (error, results, fields) {
            if (error) {
                res.status(500).send(error);
            }
            res.status(200).send(JSON.stringify(results));
        });
    } else if (!queryExists(req, 'spot_id')) {
        connection.query('SELECT * from parking where block_id = ' + escapeQuery(req.query.block_id), function (error, results, fields) {
            if (error) {
                res.status(500).send(error);
            }
            res.status(200).send(JSON.stringify(results));
        });
    } else {
        connection.query('SELECT * from parking where block_id = ' + escapeQuery(req.query.block_id) + ' and spot_id = ' + escapeQuery(req.query.spot_id), function (error, results, fields) {
            if (error) {
                res.status(500).send(error);
            }
            res.status(200).send(JSON.stringify(results));
        });
    }
});

parking.post('/add_points', function (req, res) {
    var body = req.body;
    insertSpot(body, e0);
    res.send("OK");
});

parking.post('/check_block_id_exists', function (req, res) {
    connection.query('SELECT * from parking where block_id = ' + escapeQuery(req.query.block_id), function (error, results, fields) {
        if (error) throw error;
        res.send(results.length == 0 ? "F" : "T");
    });
});

function insertSpot(points, current) {
    var query = connection.query('INSERT INTO parking SET ?', points[current], function (error, results, fields) {
        if (error) throw error;
    });
    if (current < points.length - 1) {
        insertSpot(points, current + 1);
    } else {}
}

// AUTH ENDPOINTS
auth.get('/', function (req, res) {
    res.status(200).send("This is the user authentication sub-API for aspace! :)");
});

auth.post("/phone_login", function (req, res) {
    if (!queryExists(req, 'phone_number')) {
        sendErrorJSON(res, 'MISSING_PARAMETER', 'phone_number required');
    } else {
        lookupPhone(req.query.phone_number, function (response) {
            var sql = "SELECT * FROM users WHERE phone_number = " + escapeQuery(response.phone_number, true);
            connection.query(sql, function (error, rows) {
                if (rows.length == 0) {
                    var userId = uniqueString();
                    var code = Math.floor(100000 + Math.random() * 900000);
                    var sql = "INSERT INTO `verification_codes` (`user_id`, `phone_number`, `verify_code`) VALUES ('" + escapeQuery(userId, false) + "', '" + escapeQuery(response.phone_number, false) + "', '" + escapeQuery(code, false) + "')";
                    connection.query(sql, function (error, rows) {
                        sendErrorJSON(res, 'NEW_PHONE');
                        sendVerificationText(response.phone_number, code);
                    });
                } else {
                    sendErrorJSON(res, 'RETURN_PHONE');
                }
            });
        }, function () {
            sendErrorJSON(res, 'INVALID_PHONE');
        });
    }
});

auth.post("/check_pin", function (req, res) {
    if (!queryExists(req, 'phone_number')) {
        sendErrorJSON(res, 'MISSING_PARAMETER', 'phone_number required');
    } else if (!queryExists(req, 'verify_pin')) {
        sendErrorJSON(res, 'MISSING_PARAMETER', 'verify_pin required');
    } else {
        lookupPhone(req.query.phone_number, function (response) {
            var sql = "SELECT * FROM `verification_codes` WHERE `phone` = " + escapeQuery(response.phone_number) + " AND `code` = " + escapeQuery(req.query.verify_pin);
            connection.query(sql, function (error, rows) {
                if (rows.length == 1) {
                    res.send("{\"userId\" : \"" + rows[0].userId + "\"}");
                } else {
                    sendErrorJSON(res, 'INVALID_PIN');
                }
            });
        }, function () {
            sendErrorJSON(res, 'INVALID_PHONE');
        });
    }
})

// MISC FUNCTIONS
function sendVerificationText(phoneNumber, pin) {
    client.messages
        .create({
            body: "aspace code: " + pin + ". Happy Parking! :)",
            from: 'twilio_origin_phone_number',
            to: phoneNumber
        })
        .done();
}

function sendErrorJSON(res, error, extraJSON) {
    var responseJSON = {
        error: {
            error_code: ERROR_CODES[error].ERROR_CODE,
            error_info: ERROR_CODES[error].INFO
        }
    };
    if (typeof extraJSON != 'undefined' && extraJSON != null && error == 'MISSING_PARAMETER') {
        responseJSON.error['missing_parameter'] = extraJSON;
    } else if (typeof extraJSON != 'undefined' && extraJSON != null) {
        responseJSON.error['info'] = extraJSON;
    }
    res.status(ERROR_CODES[error].HTTP_CODE).send(responseJSON);
}

function queryExists(req, queryName) {
    if (typeof req.query[queryName] == 'undefined' || req.query[queryName] === null) {
        return false;
    }
    return true;
}

function escapeQuery(query) {
    return connection.escapeId(query).split('`').join('\'');
}

function lookupPhone(phoneNumber, successCallBack, failCallBack) {
    var authorization = Buffer.from(TWILIO_ACCOUNT_SID + ":" + TWILIO_AUTH_TOKEN).toString('base64');
    var options = {
        method: 'GET',
        url: 'https://lookups.twilio.com/v1/PhoneNumbers/' + phoneNumber,
        headers: {
            'Postman-Token': 'd4625267-2785-4374-bed7-9918ebd73080',
            'Cache-Control': 'no-cache',
            Authorization: 'Basic ' + authorization
        }
    };

    request(options, function (error, response, body) {
        if (error) {
            console.log("ERROR! : " + error);
        }
        body = JSON.parse(body);
        if (body.status == 404) {
            failCallBack(body.status);
        } else {
            successCallBack(body);
        }
    });
}

// SERVER SET UP
app.listen(API_PORT, function () {
    console.log("Server has started on port " + API_PORT + "!");
})

module.exports = app;