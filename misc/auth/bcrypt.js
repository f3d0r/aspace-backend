const bcryptImport = require('bcrypt');
var sql = require('@sql');

module.exports = {
    authCheck: function (database, username, password, successCB, failureCB) {
        if (typeof database != 'undefined' && database != null) {
            sql.select.regularSelect(database, ['username'], ['='], [username], 1, function (results) {
                bcryptImport.compare(password, results[0].password, function (err, match) {
                    if (match) {
                        successCB();
                    } else {
                        failureCB();
                    }
                });
            }, function () {
                failureCB();
            }, function (error) {
                failureCB(error);
            })
        } else {
            bcryptImport.compare(username, password, function (err, match) {
                if (match) {
                    successCB();
                } else {
                    console.log(username)
                    failureCB();
                }
            });
        }
    }
}