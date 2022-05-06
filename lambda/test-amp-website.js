const amphtmlValidator = require('amphtml-validator');
const got = require('got');
const validUrl = require('valid-url');


/**
 * Validates an AMP Website by getting the source code and passing it to the local NodeJS Validator API
 * @param  {String} url A string containing a valid URL of a web
 * @return {JSON} response A JSON forming the response to be delivered by the handler
 */
async function validateAMPWebsite(url){
    let res;
    let source;
    try {
        res = await got(url, {
        timeout: {
            request: 11000
        },
        retry:0});
        source = res.body;
    } catch (err) {
        let response = {
            statusCode: undefined,
            body: undefined
        }
        switch (err.code) { 
            case "ENOTFOUND":
                response.statusCode = 410;
                response.body = JSON.stringify({url:url, testResult: "Could not reach targeturl"});
                return response;
            case "ETIMEDOUT":
                response.statusCode = 504;
                response.body = JSON.stringify({url:url, testResult: "Website timed out"})
                return response 
        }
                
    }


    try {
        const validator = await amphtmlValidator.getInstance();
        let result = validator.validateString(source);

        let response = {
            statusCode: 200,
            body: JSON.stringify({url:url, testResult: {status: result.status, errors:result.errors}})
        };
        return response;
    } catch (err) {
        let response = {
            statusCode: 400,
            body: JSON.stringify({url:url, testResult: "Something happened with the validator"})
        };
        return response;
    }
   

  }

exports.testAMPWebsite = async (event) => {
    let targeturl = event.queryStringParameters.targeturl;

    let response = {
        statusCode: null,
        body: null
    };

    if (event.requestContext.http.method !== 'GET') {
        throw new Error(`This function only accepts GET method, you tried: ${event.requestContext.http.method}`);
    }

    if(targeturl){
        if(validUrl.isWebUri(targeturl)){
            response =  validateAMPWebsite(targeturl);
            return  response
        }
        else {
            response.statusCode = 400;
            response.body = JSON.stringify({url:targeturl, testResult: "Parameter targeturl is not a valid URL"});
            return response
        }

    } else {
        response.statusCode = 400;
        response.body = JSON.stringify({url:"", testResult: "No targeturl parameter was found"});
        return response;
    }
}
