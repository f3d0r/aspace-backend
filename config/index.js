var aws = require('aws-sdk');

const spacesEndpoint = new aws.Endpoint('nyc3.digitaloceanspaces.com');
const accessKey = 'HN54L3H3ETPTIBL7SXER';
const secretKey = 'qALnLKpca5tg30EKZVZ7IN1im3PmbF9kCgluPu37T7Q';

module.exports = {
    express: {
        API_PORT: 3000
    },
    twilio: {
        TWILIO_ACCOUNT_SID: 'twilio_sid',
        TWILIO_AUTH_TOKEN: 'twilio_auth_token',
        ORIGIN_PHONE: 'twilio_origin_phone_number'
    },
    mysql_config: {
        ADMIN_TABLE: 'aspace_admins'
    },
    auth: {
        PIN_EXPIRY_MINUTES: 5,
        INTERNAL_AUTH_KEY: '***REMOVED***'
    },
    bcrypt: {
        SALT_ROUNDS: 10
    },
    sensors: {
        sensorDeltaFeet: 2
    },
    slack: {
        webhook: '***REMOVED***'
    },
    db: {
        DATABASE_USER: 'api',
        DATABASE_PASSWORD: 'db_password',
        DATABASE_NAME: 'aspace',
        DATABASE_IP: '206.189.175.212',
        DATABASE_PORT: 'db_port'
    },
    digitalocean: {
        BUCKET_NAME: 'aspace',
        S3: new aws.S3({
            endpoint: spacesEndpoint,
            accessKeyId: accessKey,
            secretAccessKey: secretKey
        })
    },
    fs_paths: {
        profile_pics: 'uploads/profile_pic_temp/'
    }
}