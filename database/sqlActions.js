var db = require('./db');
var mysql = require('mysql');

module.exports = {
    insert: {
        addObject: function (database, jsonObject, successCB, failCB) {
            db.getConnection(function (err, connection) {
                connection.query('INSERT INTO ' + connection.escapeId(database) + ' SET ?', jsonObject, function (error, results, fields) {
                    if (error) {
                        return failCB(error);
                    }
                    successCB(results);
                });
                connection.release();
            });
        },
        // TODO: Re-write method to not be recursive, use full JSON object inserts
        // insertSpot: function (points, current) { 
        //     db.getConnection(function (err, connection) {
        //         connection.query('INSERT INTO `parking` SET ?', points[current], function (error, results, fields) {
        //             if (error) throw error;
        //         });
        //         if (current < points.length - 1) {
        //             insertSpot(points, current + 1);
        //         }
        //     });
        // }
    },
    select: {
        databasePermissionCheck: function (database, auth_key, permission, successCB, failCB) {
            db.getConnection(function (err, connection) {
                var sql = "SELECT * FROM " + connection.escapeId(database) + " WHERE `auth_key` = ? AND `permission` LIKE ?";
                connection.query(sql, [auth_key, "%" + permission + "%"], function (error, rows) {
                    if (error) {
                        return failCB(error);
                    }
                    if (rows.length == 1) {
                        successCB();
                    } else {
                        failCB();
                    }
                });
                connection.release();
            });
        },
        authKeyPermissionCheck: function (database, username, permission, successCB, failCB) {
            db.getConnection(function (err, connection) {
                var sql = "SELECT * FROM " + connection.escapeId(database) + " WHERE `username` = ? AND `auth_key_permissions` LIKE ?";
                connection.query(sql, [username, "%" + permission + "%"], function (error, rows) {
                    if (error) {
                        return failCB(error);
                    }
                    if (rows.length == 1) {
                        successCB(rows);
                    } else {
                        failCB();
                    }
                });
                connection.release();
            });
        },
        regularSelect: function (database, keys, operators, values, numResults, successCB, noneFoundCB, failCB) {
            db.getConnection(function (err, connection) {
                var sql = "SELECT * FROM " + connection.escapeId(database) + " WHERE ";
                if (keys.length != operators.length || operators.length != values.length) {
                    return failCB('Key length must match value length.');
                }
                for (var index = 0; index < keys.length; index++) {
                    if (index < keys.length - 1) {
                        sql += "`" + keys[index] + "` " + operators[index] + " ? AND ";
                    } else {
                        sql += "`" + keys[index] + "` " + operators[index] + " ?";
                    }
                }
                connection.query(sql, values, function (error, rows) {
                    if (error) {
                        return failCB(error);
                    }
                    if (rows.length > 0) {
                        if (numResults == null) {
                            successCB(rows);
                        } else if (numResults == rows.length) {
                            successCB(rows);
                        } else {
                            noneFoundCB();
                        }
                    } else {
                        noneFoundCB();
                    }
                });
                connection.release();
            });
        },
        selectRadius: function (database, lat, lng, miles, successCB, noneFoundCB, failCB) {
            db.getConnection(function (err, connection) {
                var sql = "SELECT *, ( 3959 * acos( cos( radians(?) ) * cos( radians( `lat` ) ) * cos( radians( `lng` ) - radians(?) ) + sin( radians(?) ) * sin(radians(`lat`)) ) ) AS distance FROM " + connection.escapeId(database) + "  HAVING distance < ?"
                connection.query(sql, [lat, lng, lat, miles], function (error, rows) {
                    if (error) {
                        return failCB(error);
                    }
                    if (rows.length == 0) {
                        noneFoundCB();
                    } else {
                        successCB(rows)
                    }
                });
                connection.release();
            });
        }
    },
    remove: {
        regularDelete: function (database, keys, values, successCB, failCB) {
            db.getConnection(function (err, connection) {
                var sql = "DELETE FROM " + connection.escapeId(database) + " WHERE ";
                if (keys.length != values.length) {
                    return failCB('Key length must match value length.');
                }
                for (var index = 0; index < keys.length; index++) {
                    if (index < keys.length - 1) {
                        sql += "`" + keys[index] + "` = ? AND ";
                    } else {
                        sql += "`" + keys[index] + "` = ?";
                    }
                }
                connection.query(sql, values, function (error, rows) {
                    if (error) {
                        return failCB(error);
                    }
                    successCB(rows);
                });
                connection.release();
            });
        },
        deleteVerificationCode: function (phoneNumber, deviceId, successCB, failCB) {
            db.getConnection(function (err, connection) {
                var sql = "DELETE FROM `user_verify_codes` WHERE `phone_number` = ? AND `device_id` = ?";
                connection.query(sql, [phoneNumber, deviceId], function (error, rows) {
                    if (error) {
                        return failCB(error)
                    }
                });
                connection.release();
            });
        }
    },
    update: {
        updateSpotStatus(spot_id, occupied, successCB, noExistCB, failCB) {
            db.getConnection(function (err, connection) {
                var sql = "UPDATE `parking` SET `occupied` = ? WHERE `spot_id` = ?";
                connection.query(sql, [occupied, spot_id], function (error, results, fields) {
                    if (error) {
                        return failCB(error);
                    }
                    if (results.affectedRows == 1) {
                        successCB();
                    } else {
                        noExistCB();
                    }
                });
                connection.release();
            });
        }
    }
}