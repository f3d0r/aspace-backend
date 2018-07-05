module.exports = Object.freeze({
    MISSING_PARAMETER: {
        HTTP_CODE: 422,
        ERROR_CODE: -1,
        INFO: "missing_parameter"
    },
    NEW_PHONE: {
        HTTP_CODE: 200,
        ERROR_CODE: 1,
        INFO: "new_phone"
    },
    RETURN_PHONE: {
        HTTP_CODE: 200,
        ERROR_CODE: 2,
        INFO: "return_phone"
    },
    INVALID_PASSWORD: {
        HTTP_CODE: 200,
        ERROR_CODE: 3,
        INFO: "invalid_password"
    },
    INVALID_PIN: {
        HTTP_CODE: 200,
        ERROR_CODE: 4,
        INFO: "invalid_pin"
    },
    DB_ERROR: {
        HTTP_CODE: 200,
        ERROR_CODE: 5,
        INFO: "db_error"
    },
    NOT_FOUND: {
        HTTP_CODE: 200,
        ERROR_CODE: 6,
        INFO: "not_found"
    },
    COULD_NOT_CREATE_USER: {
        HTTP_CODE: 200,
        ERROR_CODE: 7,
        INFO: "could_not_create_user"
    },
    PASSWORD_RESET_EXPIRED: {
        HTTP_CODE: 200,
        ERROR_CODE: 8,
        INFO: "password_reset_expired"
    },
    PASSWORD_RESET_HASH_MISMATCH: {
        HTTP_CODE: 200,
        ERROR_CODE: 9,
        INFO: "password_reset_hash_mismatch"
    },
    PASSWORD_RESET_PHONE_MISMATCH: {
        HTTP_CODE: 200,
        ERROR_CODE: 10,
        INFO: "password_reset_phone_mismatch"
    },
    COULD_NOT_RESET_PASSWORD: {
        HTTP_CODE: 200,
        ERROR_CODE: 11,
        INFO: "could_not_reset_password"
    },
    INVALID_PHONE: {
        HTTP_CODE: 200,
        ERROR_CODE: 12,
        INFO: "invalid_phone"
    },
    INVALID_AUTH_KEY: {
        HTTP_CODE: 403,
        ERROR: 13,
        INFO: "invalid_auth_key"
    },
    MISSING_AUTH_KEY: {
        HTTP_CODE: 401,
        ERROR: 14,
        INFO: "missing_auth_key"
    },
    INVALID_SPOT_ID: {
        HTTP_CODE: 404,
        ERROR_CODE: 15,
        INFO: "invalid_spot_id"
    }
});