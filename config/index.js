var mysql = require('mysql');

module.exports = {
    express: {
        API_PORT: 3000
    },
    twilio: {
        TWILIO_ACCOUNT_SID: 'twilio_sid',
        TWILIO_AUTH_TOKEN: 'twilio_auth_token',
    },
    mysql_config: {
        ADMIN_TABLE: 'aspace_admins'
    },
    auth: {
        PIN_EXPIRY_MINUTES: 5
    },
    bcrypt: {
        SALT_ROUNDS: 10
    },
    sensors: {
        sensorDeltaFeet: 2
    },
    slack: {
        webhook: '***REMOVED***'
    }
}