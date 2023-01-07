/*
 * This file is part of quickbooks-js
 * https://github.com/RappidDevelopment/quickbooks-js
 *
 * Based on qbws: https://github.com/johnballantyne/qbws
 *
 * (c) 2015 johnballantyne
 * (c) 2016 Rappid Development LLC
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/*
 * Web-Service.js
 *
 * This class builds the SOAP
 * web-service methods called by
 * Quickbooks Web Connector.
 */

//////////////////
//
// Private
//
//////////////////

var parseString = require('xml2js').parseString;

/**
 * A reference to the semvar library.
 * https://www.npmjs.com/package/semver
 *
 * @type {SemVer}
 */
var semver = require('semver');

/**
 * A constant for the minimum supported
 * version of the Quickbooks Web Connector.
 *
 * @type {string}
 */
var MIN_SUPPORTED_VERSION = '1.0.0';

/**
 * A constant for the recommended version
 * of Quickbooks Web Connector.
 *
 * @type {string}
 */
var RECOMMENDED_VERSION = '2.0.1';

/**
 * The SOAP web service functions
 * and their defintions.
 */
var webService;

/**
 * A delegate to handle fetching
 * and receiving qbXML requests and responses.
 *
 * @type {Object}
 */
var qbXMLHandler = new Object();

webService = {
    QBWebConnectorSvc: {
        QBWebConnectorSvcSoap: {}
    }
};

function verifyFunction(functionName) {
    if ((typeof qbXMLHandler[functionName] !== "function")) {
        let error = new Error('The qbXMLHandler is missing the function ' + functionName)
        console.log(error.toString());
        throw error;
    }
}

function validateTicket(args, done) {
    if ((typeof qbXMLHandler.validateTicket !== "function")) {
        let error = new Error('The qbXMLHandler is missing the function validateTicket');
        if ((typeof qbXMLHandler.setError !== "function")) {
            qbXMLHandler.setError(args.ticket.trim(), error.message)
            .then(done)
            .catch(done);
        } else {
            done(error);
        }
    } else {
        qbXMLHandler.validateTicket(args.ticket.trim())
        .then((success) => {
            if (success) done();
            else done(new Error('Invalid ticket'));
        })
        .catch(done);
    }
}

/**
 * Communicates this web service's version
 * number to the QBWC.
 *
 * @return the version of this web service
 */
webService.QBWebConnectorSvc.QBWebConnectorSvcSoap.serverVersion = function (args, done) {
    console.log('serverVersion')
    var retVal = '0.2.0';
    done({ serverVersionResult: {'string': retVal} });
};

/**
 * Allows the web service to evaluate the current
 * QBWebConnector version
 *
 * @return
 * - `NULL` or '' (empty string) - if you want QBWC to proceed.
 * - 'W:<any text>' - prompts a WARNING to the user.
 * - 'E:<any text>' - prompts an ERROR to the user.
 */
webService.QBWebConnectorSvc.QBWebConnectorSvcSoap.clientVersion = function(args, done) {
    console.log('clientVersion')
    var retVal = '';
    var qbwcVersion = args.strVersion.split('.')[0] + '.' +
        args.strVersion.split('.')[1] + '.' +
        args.strVersion.split('.')[2];

    // Check if qbwcVersion is less than minimum supported.
    if (semver.lt(qbwcVersion, MIN_SUPPORTED_VERSION)) {
        retVal = 'E:You need to upgrade your QBWebConnector';
    }
    // Check if qbwcVersion is less than recommended version.
    else if (semver.lt(qbwcVersion, RECOMMENDED_VERSION)) {
        retVal = 'W:It is recommended that you upgrade your QBWebConnector';
    }
    done({ clientVersionResult: {'string': retVal} });
};

/**
 * Allows for the web service to authenticate the user
 * QBWC is using and to specify the company file to be used
 * in the session.
 *
 * @return - array
 * - [0] index 0 is always a UUID for the session
 * - [1] NONE        - if there are no requests to process
 *       ''          - if QBWC is to use the currently open company file
 *       <file path> - the full path to the company file that should be used
 *       nvu         - the username and password were invalid
 */
webService.QBWebConnectorSvc.QBWebConnectorSvcSoap.authenticate = function(args, done) {
    console.log('authenticate')
    qbXMLHandler.authenticate(args.strUserName.trim(), args.strPassword.trim())
    .then(({ ticketId, companyFilePath }) =>{
        if (ticketId) {
            done({ authenticateResult: { 'string': [ticketId, companyFilePath || '']} });
        } else {
            done({ authenticateResult: { 'string': [null, 'NONE']} });
        }
    })
    .catch((error) =>{
        done({ authenticateResult: { 'string': [null, 'nvu']} });
    });        
};

/**
 * Sends any qbXML commands to be executes to the
 * QBWC client. This method is called continuously until it
 * receives an empty string.
 */
webService.QBWebConnectorSvc.QBWebConnectorSvcSoap.sendRequestXML = function(args, done) {
    //console.log('sendRequestXML')
    validateTicket(args, (error) => {
        if (error) { 
            done(error, {});
        } else {
            qbXMLHandler.generateRequest(args.ticket.trim())
            .then((request) => {
                done({ sendRequestXMLResult: { 'string': request } });   
            })
            .catch((error) => {
                done(error, {});
            });
        }         
    });
};

/**
 * Called after QBWC has run a qbXML command
 * and has returned a response.
 *
 * @return {Number} the percentage of requests complete.
 * - Greater than 0 - more requests to send
 * - 100 - Done; no more requests to process
 * - Less than 0 - An error occurred
 */
webService.QBWebConnectorSvc.QBWebConnectorSvcSoap.receiveResponseXML = function(args, done) {

    //console.log('receiveResponseXML')
    validateTicket(args, (error) => {
        if (error) { 
            done(error, {});
        } else {
            parseString(args.response, (error, response) => {
                if (error) {
                    done(error, {});
                } else {
                    qbXMLHandler.processResponse(args.ticket.trim(), response)
                    .then((progress) => {
                        done({ receiveResponseXMLResult: { 'int': progress } });
                    })
                    .catch((error) =>{
                        done(error, {});
                    });
                }                   
            });
        }
    });

    /*
    var response = args.response;
    var hresult = args.hresult;
    var message = args.message;
    var retVal = 0;
    var percentage = 0;

    if (hresult) {
        // if there was an error
        // the web service should return a
        // negative value.
        console.log("QB CONNECTION ERROR: " + args.message + ' (' + args.hresult + ')');
        lastError = message;
        retVal = -101;

        if ((typeof qbXMLHandler.didReceiveError === "function")) {
            qbXMLHandler.didReceiveError(hresult);
        }
    } else {
        if ((typeof qbXMLHandler.handleResponse === "function")) {
            retVal = qbXMLHandler.handleResponse(response);
        }
        */
        /*
        percentage = (!requestQueue.length) ? 100 : counter * 100 / requestQueue.length;
        if (percentage >= 100) {
            // There are no more requests.
            // Reset the counter.
            counter = 0;
        }
        //QBWC throws an error if the return value contains a decimal
        retVal = percentage.toFixed();
        */
    //}
};

/**
 * Called when there is an error connecting to QB.
 *
 * @return 'DONE' to abort or '' or '<company file>' to retry.
 */
webService.QBWebConnectorSvc.QBWebConnectorSvcSoap.connectionError = function(args, done) {
    //console.log('connectionError')
    validateTicket(args, (error) => {
        if (error) {
            done(error, {});
        } else {
            qbXMLHandler.closeTicket(args.ticket.trim(), args.message.trim(), args.hresult.trim())
            .then(() => {
                done({ connectionErrorResult: { 'string': 'DONE' } });
            })
            .catch((error) => {
                done(error, {});
            });
        }
    });
};

/**
 * Called when there is an error connecting to QB.
 * Currently just saves off any errors and returns the latest one.
 */
webService.QBWebConnectorSvc.QBWebConnectorSvcSoap.getLastError = function(args, done) {
    //console.log('getLastError')
    validateTicket(args, (error) => {
        if (error) {
            done(error, {});
        } else {
            qbXMLHandler.getError(args.ticket.trim())
            .then((errorString) => {
                done({ getLastErrorResult: { 'string': errorString } });
            })
            .catch((error) => {
                done(error, {});
            });
        }
    });
};

/**
 * Tells QBWC is finished with the session.
 *
 * @return 'OK'
 */
webService.QBWebConnectorSvc.QBWebConnectorSvcSoap.closeConnection = function(args, done) {
    //console.log('closeConnection')
    validateTicket(args, (error) => {
        if (error) {
            done(error, {});
        } else {
            qbXMLHandler.closeTicket(args.ticket.trim())
            .then(() => {
                done({ closeConnectionResult: { 'string': 'OK' } });
            })
            .catch((error) => {
                done(error, {});
            })
        }
    });
};

//////////////////
//
// Public
//
//////////////////

module.exports = {
    service: webService,

    setQBXMLHandler: function(xmlHandler) {
        qbXMLHandler = xmlHandler;
        verifyFunction('authenticate');
        verifyFunction('validateTicket');
        verifyFunction('setError');
        verifyFunction('getError');
        verifyFunction('closeTicket');
        verifyFunction('generateRequest');
    }
};


