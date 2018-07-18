var constants = require('@config');
const twilioClient = require('twilio')(constants.twilio.TWILIO_ACCOUNT_SID, constants.twilio.TWILIO_AUTH_TOKEN);
var request = require('request');

module.exports = {
    sendVerifyText: function (phoneNumber, pin) {
        twilioClient.messages
            .create({
                body: "aspace code: " + pin + ". Happy Parking! :)",
                from: 'twilio_origin_phone_number',
                to: phoneNumber
            })
            .done();
    },
    lookupPhone: function (phoneNumber, successCallBack, failCallBack) {
        var authorization = Buffer.from(constants.twilio.TWILIO_ACCOUNT_SID + ":" + constants.twilio.TWILIO_AUTH_TOKEN).toString('base64');
        var options = {
            method: 'GET',
            url: 'https://lookups.twilio.com/v1/PhoneNumbers/' + phoneNumber,
            headers: {
                'Postman-Token': 'd4625267-2785-4374-bed7-9918ebd73080',
                'Cache-Control': 'no-cache',
                Authorization: 'Basic ' + authorization
            }
        };

        request(options, function (error, response, body) {
            if (error) {
                failCallBack(error);
            }
            body = JSON.parse(body);
            if (body.status == 404) {
                failCallBack(body.status);
            } else {
                successCallBack(body.phone_number);
            }
        });
    }
}