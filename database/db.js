var mysql = require('mysql');

const DATABASE_USER = 'api';
const DATABASE_PASSWORD = 'db_password';
const DATABASE_NAME = 'aspace';
const DATABASE_IP = '159.65.70.74';
const DATABASE_PORT = 'db_port';
// const SOCKET_PATH = '/var/run/mysqld/mysqld.sock';

var pool = mysql.createPool({
    host: DATABASE_IP,
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
    database: DATABASE_NAME,
    port: DATABASE_PORT
});

exports.getConnection = function (callback) {
    pool.getConnection(function (err, connection) {
        callback(err, connection);
    });
};