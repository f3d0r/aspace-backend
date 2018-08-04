const ERROR_CODES = require('./errorCodes');
const bodyStructs = require('@body-structure');

module.exports = {
    getResponseJSON: function (error, extraJSON) {
        return getErrorJSONTemp(error, extraJSON);
    },
    getErrorCode: function (error) {
        try {
            return ERROR_CODES[error.res_info.code_info].HTTP_CODE;
        } catch (error) {
            return 500;
        }
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
    }
}

function defaultQueryMissingCallback(res, foundQueries, missingQueries) {
    res.status(422).send(getErrorJSONTemp('MISSING_PARAMETER', null, missingQueries[0] + " query required"));
}

function getErrorJSONTemp(error, resContent, missingParameter) {
    var responseJSON = {
        res_info: {
            code: ERROR_CODES[error].RESPONSE_CODE,
            code_info: error
        }
    };
    if (error == 'MISSING_PARAMETER') {
        responseJSON.res_info['missing_parameter'] = missingParameter;
    } else if (typeof resContent != 'undefined' && resContent != null) {
        responseJSON.res_content = resContent;
    }
    return responseJSON;
}