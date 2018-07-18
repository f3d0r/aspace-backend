const ERROR_CODES = require('./errorCodes');
const bodyStructs = require('@body-structure');

module.exports = {
    getErrorJSON: function (error, extraJSON) {
        return getErrorJSONTemp(error, extraJSON);
    },
    getErrorCode: function (error) {
        return ERROR_CODES[error].HTTP_CODE;
    },
    checkQueries: function (req, res, queryList, successCB, failCB = defaultQueryMissingCallback) {
        foundQueries = [];
        queryList.forEach(currentQuery => {
            if (typeof req.query[currentQuery] != 'undefined' && req.query[currentQuery] !== null) {
                foundQueries.push(currentQuery);
            }
        });
        if (queryList.length - foundQueries.length != 0) {
            let missingQueries = queryList.filter(x => !foundQueries.includes(x));
            failCB(res, foundQueries, missingQueries);
        } else {
            successCB();
        }
    },
    checkBody: function (req, res, bodyGiven, successCB, failCB) {
        bodyGiven 
        requiredJsonBody = bodyStructs[req.baseUrl][req.route.path];
        var equal = true;
        for (i in requiredJsonBody)
            if (!bodyGiven.hasOwnProperty(i))
                equal = false;
    }
}

function defaultQueryMissingCallback(res, foundQueries, missingQueries) {
    res.status(422).send(getErrorJSONTemp('MISSING_PARAMETER', missingQueries[0] + " query required"));
}

function getErrorJSONTemp(error, extraJSON) {
    if (typeof ERROR_CODES[error] == 'undefined') {
        return 'undefined';
    }
    var responseJSON = {
        error: {
            error_code: ERROR_CODES[error].ERROR_CODE,
            error_info: ERROR_CODES[error].INFO
        }
    };
    if (typeof extraJSON != 'undefined' && extraJSON != null && error == 'MISSING_PARAMETER') {
        responseJSON.error['missing_parameter'] = extraJSON;
    } else if (typeof extraJSON != 'undefined' && extraJSON != null) {
        responseJSON.error['info'] = extraJSON;
    }
    return responseJSON;
}