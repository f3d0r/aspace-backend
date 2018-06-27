var ApiMessages = function() { };
//definition of reasons that can cause a Controller request to fail.
ApiMessages.prototype.PHONE_NOT_FOUND = 0;
ApiMessages.prototype.INVALID_PWD = 1;
ApiMessages.prototype.INVALID_PIN = 2;
ApiMessages.prototype.DB_ERROR = 3;
ApiMessages.prototype.NOT_FOUND = 4;
ApiMessages.prototype.PHONE_ALREADY_EXISTS = 5;
ApiMessages.prototype.COULD_NOT_CREATE_USER = 6;
ApiMessages.prototype.PASSWORD_RESET_EXPIRED = 7;
ApiMessages.prototype.PASSWORD_RESET_HASH_MISMATCH = 8;
ApiMessages.prototype.PASSWORD_RESET_PHONE_MISMATCH = 9;
ApiMessages.prototype.COULD_NOT_RESET_PASSWORD = 10;