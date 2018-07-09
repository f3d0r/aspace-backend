// IMPORTS
const express = require('express');
const uniqueString = require('unique-string');
const request = require("request");
const mysql = require('mysql');
const moment = require('moment');
var ERROR_CODES = require('./errorCodes');

// CONSTANTS
const DATABASE_USER = 'api';
const DATABASE_PASSWORD = 'db_password';
const DATABASE_NAME = 'aspace';
const DATABASE_PORT = 'db_port';
const SOCKET_PATH = '/var/run/mysqld/mysqld.sock';

const ADMIN_TABLE = 'aspace_admins';
const API_PORT = 3000;

const PIN_EXPIRY_MINUTES = 1;

// BCRYPT SETUP
const bcrypt = require('bcrypt');
const saltRounds = 10;

// CONNECTION AND TWILIO SET UP
const TWILIO_ACCOUNT_SID = 'twilio_sid';
const TWILIO_AUTH_TOKEN = 'twilio_auth_token';
const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// MYSQL SET UP
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

// EXPRESS SET UP

var app = express();
var auth = express();
var parking = express();
var admin = express();
app.use(express.json());
app.use('/auth', auth);
app.use('/parking', parking);
app.use('/admin', admin);

// MAIN APP ENDPOINTS

app.get('/', function (req, res) {
    res.status(200).send("Welcome to the aspace API! :)");
});

app.get('/ping', function (req, res) {
    res.status(200).send("pong");
});

// ADMIN APP ENDPOINTS

admin.get('/', function (req, res) {
    basicAuth(req, res, function () {
        res.status(200).send("Welcome to the admin sub-API for aspace! :)");
    });
});

admin.get('/ping', function (req, res) {
    res.status(200).send("pong");
});

admin.get('/add_auth_key', function (req, res) {
    basicAuth(req, res, function () {
        var authKey = uniqueString();
        var sql = "INSERT INTO `database_authority` (`auth_key`, `permission`) VALUES (" + escapeQuery(authKey) + ", " + escapeQuery("update_spots") + ")";
        connection.query(sql, function (error, results, fields) {
            if (results.affectedRows == 1)
                sendErrorJSON(res, 'AUTH_KEY_ADDED', "Your new auth key is : " + authKey);
            else
                sendErrorJSON(res, 'AUTH_KEY_NOT_ADDED');
        });
    });
});

// PARKING ENDPOINTS
parking.get('/', function (req, res) {
    res.status(200).send("This is the parking sub-API for aspace! :)");
});

parking.get('/ping', function (req, res) {
    res.status(200).send("pong");
});

parking.post('/update_status', function (req, res) {
    if (!queryExists(req, 'auth_key')) {
        sendErrorJSON(res, 'MISSING_AUTH_KEY');
    } else if (!queryExists(req, 'spot_id')) {
        sendErrorJSON(res, 'MISSING_PARAMETER', 'spot_id required');
    } else if (!queryExists(req, 'occupied')) {
        sendErrorJSON(res, 'MISSING_PARAMETER', 'occupied required');
    } else if (req.query.occupied != "F" && req.query.occupied != "T" && req.query.occupied != "N") {
        sendErrorJSON(res, 'INVALID_STATUS_ENTERED', "occupied query must be equal to 'N', 'F', 'T'");
    } else {
        databasePermissionCheck("database_authority", req.query.auth_key, "update_spots", function () {
                var sql = "UPDATE `parking` set `occupied` = " + escapeQuery(req.query.occupied) + " WHERE `spot_id` = " + escapeQuery(req.query.spot_id);
                connection.query(sql, function (error, results, fields) {
                    if (results.affectedRows == 1) {
                        sendErrorJSON(res, 'SPOT_STATUS_CHANGED');
                    } else {
                        sendErrorJSON(res, 'INVALID_SPOT_ID');
                    }
                });
            },
            function () {
                sendErrorJSON(res, 'INVALID_AUTH_KEY');
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
            if (results.length == 0) {
                sendErrorJSON(res, 'INVALID_SPOT_ID');
            } else {
                res.status(200).send(JSON.stringify(results));
            }
        });
    } else if (!queryExists(req, 'spot_id')) {
        connection.query('SELECT * from parking where block_id = ' + escapeQuery(req.query.block_id), function (error, results, fields) {
            if (error) {
                res.status(500).send(error);
            }
            if (results.length == 0) {
                sendErrorJSON(res, 'INVALID_BLOCK_ID');
            } else {
                res.status(200).send(JSON.stringify(results));
            }
        });
    } else {
        connection.query('SELECT * from parking where block_id = ' + escapeQuery(req.query.block_id) + ' and spot_id = ' + escapeQuery(req.query.spot_id), function (error, results, fields) {
            if (error) {
                res.status(500).send(error);
            }
            if (results.length == 0) {
                sendErrorJSON(res, 'INVALID_BLOCK_ID_OR_SPOT_ID');
            } else {
                res.status(200).send(JSON.stringify(results));
            }
        });
    }
});

parking.post('/add_points', function (req, res) {
    if (!queryExists(req, 'auth_key')) {
        sendErrorJSON(res, 'MISSING_AUTH_KEY');
    } else if (JSON.stringify(req.body) == "{}") {
        sendErrorJSON(res, "MISSING_BODY");
    } else {
        databasePermissionCheck("database_authority", req.query.auth_key, "add_spots", function () {
                var body = req.body;
                insertSpot(body, 0);
                res.send("OK");
            },
            function () {
                sendErrorJSON(res, 'INVALID_AUTH_KEY');
            });
    }
});

parking.get('/check_block_id_exists', function (req, res) {
    connection.query('SELECT * from parking where block_id = ' + escapeQuery(req.query.block_id), function (error, results, fields) {
        if (error) throw error;
        res.status(200).send(results.length == 0 ? "F" : "T");
    });
});

// AUTH ENDPOINTS
auth.get('/', function (req, res) {
    res.status(200).send("This is the user authentication sub-API for aspace! :)");
});

auth.get('/ping', function (req, res) {
    res.status(200).send("pong");
});

auth.post("/phone_login", function (req, res) {
    if (!queryExists(req, 'phone_number')) {
        sendErrorJSON(res, 'MISSING_PARAMETER', 'phone_number required');
    } else if (!queryExists(req, 'device_id')) {
        sendErrorJSON(res, 'MISSING_PARAMETER', 'device_id required');
    } else {
        lookupPhone(req.query.phone_number, function (formattedPhoneNumber) {
            var sql = "SELECT `user_id` FROM `users` WHERE `phone_number` = " + escapeQuery(formattedPhoneNumber);
            connection.query(sql, function (error, rows) {
                verifyUser = {};
                verifyUser['phone_number'] = formattedPhoneNumber;
                var pin = Math.floor(100000 + Math.random() * 900000);
                verifyUser['verify_pin'] = pin;
                verifyUser['device_id'] = req.query.device_id;
                verifyUser['expiry_date'] = getExpiryTimestamp(PIN_EXPIRY_MINUTES, 'm');
                if (rows.length == 1) {
                    verifyUser['user_id'] = rows[0].user_id;
                    connection.query('INSERT INTO `user_verify_codes` SET ?', verifyUser, function (error, results, fields) {
                        if (error) throw error;
                        sendVerificationText(formattedPhoneNumber, pin);
                        sendErrorJSON(res, 'RETURN_PHONE');
                    });
                } else {
                    verifyUser['user_id'] = uniqueString();
                    connection.query('INSERT INTO `user_verify_codes` SET ?', verifyUser, function (error, results, fields) {
                        if (error) throw error;
                        sendVerificationText(formattedPhoneNumber, pin);
                        sendErrorJSON(res, 'NEW_PHONE');
                    });
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
    } else if (!queryExists(req, 'device_id')) {
        sendErrorJSON(res, 'MISSING_PARAMETER', 'device_id required');
    } else if (!queryExists(req, 'verify_pin')) {
        sendErrorJSON(res, 'MISSING_PARAMETER', 'verify_pin required');
    } else {
        lookupPhone(req.query.phone_number, function (formattedPhoneNumber) {
            var sql = "SELECT * FROM `user_verify_codes` WHERE `phone_number` = " + escapeQuery(formattedPhoneNumber) + " AND `device_id` = " + escapeQuery(req.query.device_id) + " AND `verify_pin` = " + escapeQuery(req.query.verify_pin);
            connection.query(sql, function (error, rows) {
                if (rows.length == 1) {
                    if (timeStampPassed(moment.utc(rows[0].expiry_date))) {
                        deleteVerificationCode(formattedPhoneNumber, req.query.device_id);
                        sendErrorJSON(res, 'PIN_EXPIRED');
                    } else {
                        var newAccessCode = uniqueString();
                        accessCode = {};
                        expiry_date = getExpiryTimestamp(2, 'months');
                        accessCode['user_id'] = rows[0].user_id;
                        accessCode['access_code'] = newAccessCode;
                        accessCode['device_id'] = req.query.device_id;
                        accessCode['expiry_date'] = expiry_date;
                        accessCode['grant_date'] = getFormattedTime(moment().utc());
                        connection.query('INSERT INTO `user_access_codes` SET ?', accessCode, function (error, results, fields) {
                            if (error) throw error;
                            jsonReturn = {};
                            jsonReturn['access_code'] = newAccessCode
                            jsonReturn['expiry'] = expiry_date;
                            sendErrorJSON(res, 'NEW_ACCESS_CODE', jsonReturn);
                            deleteVerificationCode(formattedPhoneNumber, req.query.device_id);
                            newUserJSON = {};
                            newUserJSON['user_id'] = rows[0].user_id;
                            newUserJSON['phone_number'] = formattedPhoneNumber;
                            addUser(newUserJSON);
                        });
                    }
                } else {
                    sendErrorJSON(res, 'INVALID_PIN')
                }
            });
        }, function () {
            sendErrorJSON(res, 'INVALID_PHONE');
        });
    }
})

// MISC FUNCTIONS
function insertSpot(points, current) {
    connection.query('INSERT INTO parking SET ?', points[current], function (error, results, fields) {
        if (error) throw error;
    });
    if (current < points.length - 1) {
        insertSpot(points, current + 1);
    }
}

function sendVerificationText(phoneNumber, pin) {
    twilio.messages
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
            successCallBack(body.phone_number);
        }
    });
}

function authCheck(database, username, password, successCB, failureCB) {
    connection.query("SELECT * FROM `" + database + "` WHERE `username` = " + escapeQuery(username), function (error, rows) {
        bcrypt.compare(password, rows[0].password, function (err, res) {
            if (res) {
                successCB();
            } else {
                failureCB();
            }
        });
    });
}

function databasePermissionCheck(database, auth_key, permission, successCB, failureCB) {
    var sql = "SELECT * FROM `" + database + "` WHERE `auth_key` = " + escapeQuery(auth_key) + " AND `permission` LIKE " + escapeQuery("%" + permission + "%");
    connection.query(sql, function (error, rows) {
        if (rows.length == 1) {
            successCB();
        } else {
            failureCB();
        }
    });
}

function basicAuth(req, res, successCB) {
    var auth = req.get("authorization");
    if (!auth) {
        res.set("WWW-Authenticate", "Basic realm=\"Authorization Required\"");
        res.status(401).send("Authorization Required");
    } else {
        var credentials = new Buffer(auth.split(" ").pop(), "base64").toString("ascii").split(":");
        if (credentials[0] == "" || credentials[1] == "") {
            sendErrorJSON(res, 'INVALID_BASIC_AUTH');
        } else {
            authCheck(ADMIN_TABLE, credentials[0], credentials[1],
                function () {
                    successCB();
                },
                function () {
                    sendErrorJSON(res, 'INVALID_BASIC_AUTH');
                }
            );
        }
    }
}

function deleteVerificationCode(phoneNumber, deviceId) {
    var sql = "DELETE FROM `user_verify_codes` WHERE `phone_number` = " + escapeQuery(phoneNumber) + " AND `device_id` = " + escapeQuery(deviceId);
    connection.query(sql, function (error, rows) {
        if (error) throw error;
    });
}

function addUser(newUserJSON) {
    connection.query('INSERT INTO `users` SET ?', newUserJSON, function (error, results, fields) {
        if (error) throw error;
    });
}


function timeStampPassed(otherUTCMoment) {
    return moment().isAfter(otherUTCMoment);
}

function getExpiryTimestamp(amount, type) {
    return getFormattedTime(moment().utc().add(amount, type));
}

function getFormattedTime(momentTime) {
    return momentTime.format("YYYY-MM-DD HH:mm:ss");
}

// SERVER SET UP
app.listen(API_PORT, function () {
    console.log("Server has started on port " + API_PORT + "!");
})

module.exports = app;