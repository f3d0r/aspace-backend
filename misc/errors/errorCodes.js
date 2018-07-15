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
    INVALID_PIN: {
        HTTP_CODE: 200,
        ERROR_CODE: 4,
        INFO: "invalid_pin"
    },
    DB_ERROR: {
        HTTP_CODE: 500,
        ERROR_CODE: 5,
        INFO: "db_error"
    },
    INVALID_PHONE: {
        HTTP_CODE: 200,
        ERROR_CODE: 12,
        INFO: "invalid_phone"
    },
    INVALID_AUTH_KEY: {
        HTTP_CODE: 403,
        ERROR_CODE: 13,
        INFO: "invalid_auth_key"
    },
    MISSING_AUTH_KEY: {
        HTTP_CODE: 401,
        ERROR_CODE: 14,
        INFO: "missing_auth_key"
    },
    INVALID_SPOT_ID: {
        HTTP_CODE: 404,
        ERROR_CODE: 15,
        INFO: "invalid_spot_id"
    },
    INVALID_BASIC_AUTH: {
        HTTP_CODE: 401,
        ERROR_CODE: 16,
        INFO: "invalid_basic_auth"
    },
    AUTH_KEY_ADDED: {
        HTTP_CODE: 200,
        ERROR_CODE: 17,
        INFO: "auth_key_added"
    },
    AUTH_KEY_NOT_ADDED: {
        HTTP_CODE: 403,
        ERROR_CODE: 18,
        INFO: "auth_key_not_added"
    },
    SPOT_STATUS_CHANGED: {
        HTTP_CODE: 200,
        ERROR_CODE: 19,
        INFO: "spot_status_changed"
    },
    MISSING_BODY: {
        HTTP_CODE: 422,
        ERROR_CODE: 20,
        INFO: "missing_body"
    },
    INVALID_STATUS_ENTERED: {
        HTTP_CODE: 422,
        ERROR_CODE: 21,
        INFO: "invalid_status_entered"
    },
    NEW_ACCESS_CODE: {
        HTTP_CODE: 200,
        ERROR_CODE: 22,
        INFO: "new_access_code"
    },
    PIN_EXPIRED: {
        HTTP_CODE: 403,
        ERROR_CODE: 23,
        INFO: "pin_expired"
    },
    INVALID_BLOCK_ID: {
        HTTP_CODE: 404,
        ERROR_CODE: 24,
        INFO: "invalid_block_id"
    },
    INVALID_BLOCK_ID_OR_SPOT_ID: {
        HTTP_CODE: 404,
        ERROR_CODE: 25,
        INFO: "invalid_block_id_or_spot_id"
    },
    INVALID_PERMISSION: {
        HTTP_CODE: 200,
        ERROR_CODE: 26,
        INFO: "invalid_permission"
    }
});