const express = require('express')
const app = express()
const uniqueString = require('unique-string');
const mysql = require('mysql')

const accountSid = 'twilio_sid';
const authToken = 'twilio_auth_token';

const client = require('twilio')(accountSid, authToken);

var connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'api',
    password: 'db_password',
    database: 'aspace',
    port: 'db_port',
    socketPath: '/var/run/mysqld/mysqld.sock'
});
connection.connect();

app.use(express.json());

connection.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('connected as id ' + connection.threadId);
});

var serverPort = 5000;

app.get('/ping', function (req, res) {
    res.send('pong');
})

app.get('/', function (req, res) {
    connection.query('SELECT * from parking', function (error, results, fields) {
        if (error) throw error;
        res.send(JSON.stringify(results));
    });
});

app.post('/add_points', function (req, res) {
    var body = req.body;
    insertSpot(body, e0);
    res.send("OK");
});

app.post('/check_block_id_exists', function (req, res) {
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

app.post("/check_phone", function (req, res) {
    client.lookups.phoneNumbers(req.query.phone_number)
        .fetch()
        .then(phone_number => {
            var sql = "SELECT * FROM ?? WHERE ?? = ?";
            var inserts = ['users', 'phone', phone_number.phoneNumber];
            sql = mysql.format(sql, inserts);
            connection.query(sql, function (error, rows) {
                if (rows.length == 0) {
                    var userId = uniqueString();
                    var code = Math.floor(100000 + Math.random() * 900000);
                    var sql = "INSERT INTO `verification_codes`(`userId`, `code`) VALUES ('" + userId + "', '" + code + "')"
                    console.log("SQL : " + sql);
                    connection.query(sql, function (error, rows) {
                        res.send("101");
                        sendText(phone_number.phoneNumber, code);
                    });
                } else {
                    res.send("102");
                }
            });
        })
        .done();
})

app.post("/check_pin", function (req, res) {
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

app.listen(serverPort, function () {
    console.log("Server has started on port " + serverPort + "!");
})

function sendText(phoneNumber, pin) {
    client.messages
        .create({
            body: "Your aspace verification code is: " + pin + " - do not share this code with anyone.",
            from: 'twilio_origin_phone_number',
            to: phoneNumber
        })
        .done();
}
