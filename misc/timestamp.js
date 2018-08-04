const moment = require('moment');

module.exports = {
    timePassed: function (otherUTCMoment) {
        return moment().isAfter(otherUTCMoment);
    },
    getExpiryTimestamp: function (amount, type) {
        return (moment().utc().add(amount, type)).format("YYYY-MM-DD HH:mm:ss");
    },
    getFormattedTime: function (momentTime) {
        return momentTime.format("YYYY-MM-DD HH:mm:ss");
    }
}