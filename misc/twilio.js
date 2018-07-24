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
    sendVerifyCall: function (phoneNumber, pin) {
        const twimlURL = 'http://api.trya.space/v1/auth/verification_twiml?verification_pin=' + pin + '&auth_key=' + constants.auth.INTERNAL_AUTH_KEY;
        twilioClient.calls
            .create({
                url: twimlURL,
                from: 'twilio_origin_phone_number',
                to: phoneNumber
            }).catch(function (err) {
                console.error(err.message);
            })
            .done();
    },
    lookupPhone: function (phoneNumber, successCallBack, failCallBack) {
        var authorization = Buffer.from(constants.twilio.TWILIO_ACCOUNT_SID + ":" + constants.twilio.TWILIO_AUTH_TOKEN).toString('base64');
        var options = {
            method: 'GET',
            url: 'https://lookups.twilio.com/v1/PhoneNumbers/' + phoneNumber,
            headers: {
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