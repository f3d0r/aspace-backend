// IMPORTS
const express = require('express');
var app = express();
var auth = express();
var parking = express();
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

const API_PORT = '5000';

// CONNECTION AND CLIENT SET UP

const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

var connection = mysql.createConnection({
    host: '127.0.0.1',
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME,
    port: DATABASE_PORT,
    socketPath: SOCKET_PATH
});
connection.connect();

connection.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('connected as id ' + connection.threadId);
}); 

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

parking.get('/get_spots', function (req, res) {
    if (!queryExists(req, 'block_id') && !queryExists(req, 'spot_id')) {
        sendErrorJSON(res, 'MISSING_PARAMETER', 'block_id or spot_id required');
    } else if (req, queryExists('block_id')) {
        connection.query('SELECT * from parking where block_id = ' + req.query.block_id, function (error, results, fields) {
            if (error) {
                res.send(500).send(error);
            }
            res.status(200).send(JSON.stringify(results));
        });
    } else if (req, queryExists('spot_id')) {
        if (req, queryExists('spot_id')) {
            connection.query('SELECT * from parking where spot_id = ' + req.query.spot_id, function (error, results, fields) {
                if (error) {
                    res.send(500).send(error);
                }
                res.status(200).send(JSON.stringify(results));
            });
        }
    } else {
        connection.query('SELECT * from parking where block_id = ' + req.query.block_id + ' and spot_id = ' + req.query.spot_id, function (error, results, fields) {
            if (error) {
                res.send(500).send(error);
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
    connection.query('SELECT * from parking where block_id = ' + req.query.block_id, function (error, results, fields) {
        if (error) throw error;
        res.send(results.length == 0 ? "F" : "T");
    });
});

function insertSpot(points, current) {
    console.log(points[current]);
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
        lookupPhone(req.query.phone, function (successInfo) {
            console.log(successInfo.phone_number);
        }, function () {
            sendErrorJSON(res, 'INVALID_PHONE');
        });
    }
    

    // lookupPhones(
    //     client.lookups.phoneNumbers(req.query.phone_number)
    //     .fetch()
    //     .then(phone_number => {
    //         var sql = "SELECT * FROM ?? WHERE ?? = ?";
    //         var inserts = ['users', 'phone', phone_number.phoneNumber];
    //         sql = mysql.format(sql, inserts);
    //         connection.query(sql, function (error, rows) {
    //             if (rows.length == 0) {
    //                 var userId = uniqueString();
    //                 var code = Math.floor(100000 + Math.random() * 900000);
    //                 var sql = "INSERT INTO `verification_codes`(`userId`, `code`) VALUES ('" + userId + "', '" + code + "')"
    //                 console.log("SQL : " + sql);
    //                 connection.query(sql, function (error, rows) {
    //                     res.send("101");
    //                     sendText(phone_number.phoneNumber, code);
    //                 });
    //             } else {
    //                 res.send("102");
    //             }
    //         });
    //     })
    //     .done();
    // })
});

auth.get('/phone_lookup', function (req, res) {
    lookupPhone(req.query.phone, function (successInfo) {
        // SUCCESS CALLBACK
        console.log(successInfo.phone_number);
    }, function (errorCode) {
        // ERROR CALLBACK
        console.log("ERROR : " + errorCode);
    });
    res.status(200).send("OK");
});

auth.post("/check_pin", function (req, res) {
    var phoneNumber = req.query.phone_number;
    var code = req.query.pin;
    client.lookups.phoneNumbers(phoneNumber)
        .fetch()
        .then(phone_number => {
            var sql = "SELECT * FROM ?? WHERE ?? = ? AND ?? = ?";
            var inserts = ['verification_codes', 'phone', phone_number.phoneNumber, 'code', code];
            sql = mysql.format(sql, inserts);
            console.log("SQL : " + sql);
            connection.query(sql, function (error, rows) {
                if (rows.length == 1) {
                    res.send("{\"userId\" : \"" + rows[0].userId + "\"}");
                } else {
                    res.send("-1");
                }
            });
        })
        .done();

})

// MISC FUNCTIONS
function sendText(phoneNumber, pin) {
    client.messages
        .create({
            body: "Your aspace verification code is: " + pin + " - do not share this code with anyone.",
            from: 'twilio_origin_phone_number',
            to: phoneNumber
        })
        .done();
}

function sendErrorJSON(res, error, missing_parameter) {
    var responseJSON = {
        error: {
            error_code: ERROR_CODES[error].ERROR_CODE,
            error_info: ERROR_CODES[error].INFO
        }
    };
    if (missing_parameter != null && error == 'MISSING_PARAMETER') {
        responseJSON.error['missing_parameter'] = missing_parameter;
    }
    res.status(ERROR_CODES[error].HTTP_CODE).send(responseJSON);
}

function queryExists(req, queryName) {
    if (typeof req.query[queryName] == 'undefined' || req.query[queryName] === null) {
        return false;
    }
    return true;
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