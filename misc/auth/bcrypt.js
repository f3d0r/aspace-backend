var bcryptImport = require('bcryptjs');
var sql = require('@sql');

module.exports = {
    authCheck: function (database, username, password, successCB, failureCB) {
        if (typeof database != 'undefined' && database != null) {
            sql.select.regularSelect(database, null, ['username'], ['='], [username], 1, function (results) {
                bcryptImport.compare(password, results[0].password, function (err, match) {
                    if (match) {
                        successCB(username, results[0].auth_key_permissions);
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
            bcryptImport.compare(password, hashedPassword, function (err, match) {
                if (match) {
                    successCB();
                } else {
                    failureCB();
                }
            });
        }
    }
}