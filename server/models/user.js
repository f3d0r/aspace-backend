var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    phone: String,
    firstName: String,
    lastName: String,
    passwordHash: String,
    passwordSalt: String,
    pin: String
});

module.export = mongoose.model('User', UserSchema);

