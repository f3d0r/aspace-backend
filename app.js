require('module-alias/register');

// IMPORTS
const express = require('express');
// const uniqueString = require('unique-string');
// const request = require("request");
// const mysql = require('mysql');
const bodyParser = require('body-parser');
const constants = require('@config')

// // MYSQL SET UP
// var connection = mysql.createConnection({
//     host: constants.mysql.DATABASE_IP,
//     user: constants.mysql.DATABASE_USER,
//     password: constants.mysql.DATABASE_PASSWORD,
//     database: constants.mysql.DATABASE_NAME,
//     port: constants.mysql.DATABASE_PRT,
//     // socketPath: SOCKET_PATH
// });

// connection.connect(function (err) {
//     if (err) {
//         console.error('MySQL connection error : ' + err.stack);
//         return;
//     }
//     console.log('MySQL successfully connected!');
// });

// EXPRESS SET UP
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(require('./routes'));

// MAIN ENDPOINTS
app.get('/', function (req, res) {
    res.status(200).send("Welcome to the aspace API! :)");
});

app.get('/ping', function (req, res) {
    res.status(200).send("pong");
});

// START SERVER
var server = app.listen(constants.express.API_PORT, function(){
  console.log('Listening on port ' + server.address().port);
});