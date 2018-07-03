module.exports = Object.freeze({
    MISSING_PARAMETER: {
        HTTP_CODE: 422,
        ERROR_CODE: -1,
        INFO: "missing_parameter"
    },
    PHONE_DOESNT_EXIST: {
        HTTP_CODE: 400,
        ERROR_CODE: 0,
        INFO: "phone_doesnt_exist"
    },
    INVALID_PASSWORD: {
        ERROR_CODE: 1,
        INFO: "invalid_password"
    },
    INVALID_PIN: {
        ERROR_CODE: 2,
        INFO: "invalid_pin"
    },
    DB_ERROR: {
        ERROR_CODE: 3,
        INFO: "db_error"
    },
    NOT_FOUND: {
        ERROR_CODE: 4,
        INFO: "not_found"
    },
    PHONE_ALREADY_EXISTS: {
        ERROR_CODE: 5,
        INFO: "phone_already_exists"
    },
    COULD_NOT_CREATE_USER: {
        ERROR_CODE: 6,
        INFO: "could_not_create_user"
    },
    PASSWORD_RESET_EXPIRED: {
        ERROR_CODE: 7,
        INFO: "password_reset_expired"
    },
    PASSWORD_RESET_HASH_MISMATCH: {
        ERROR_CODE: 8,
        INFO: "password_reset_hash_mismatch"
    },
    PASSWORD_RESET_PHONE_MISMATCH: {
        ERROR_CODE: 9,
        INFO: "password_reset_phone_mismatch"
    },
    COULD_NOT_RESET_PASSWORD: {
        ERROR_CODE: 10,
        INFO: "could_not_reset_password"
    },
    INVALID_PHONE: {
        ERROR_CODE: 400,
        INFO: "invalid_phone"
    }
});