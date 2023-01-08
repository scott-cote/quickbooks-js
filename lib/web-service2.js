var parseString = require('xml2js').parseString;
var semver = require('semver');

var MIN_SUPPORTED_VERSION = '1.0.0';
var RECOMMENDED_VERSION = '2.0.1';

function WebService(handler) {    

    function verifyFunction(functionName) {
        if ((typeof handler[functionName] !== "function")) {
            let error = new Error('The handler is missing the function ' + functionName)
            console.log(error.toString());
            throw error;
        }
    }

    function validateTicket(args, done) {
        handler.validateTicket(args.ticket.trim())
        .then((success) => {
            if (success) done();
            else done(new Error('Invalid ticket'));
        })
        .catch(done);
    }
    
    verifyFunction('authenticate');
    verifyFunction('validateTicket');
    verifyFunction('setError');
    verifyFunction('getError');
    verifyFunction('closeTicket');
    verifyFunction('generateRequest');

    this.QBWebConnectorSvc = {};

    this.QBWebConnectorSvc.QBWebConnectorSvcSoap = {};

    this.QBWebConnectorSvc.QBWebConnectorSvcSoap.serverVersion = function (args, done) {
        done({ serverVersionResult: { 'string': '0.2.0' } });
    };

    this.QBWebConnectorSvc.QBWebConnectorSvcSoap.clientVersion = function(args, done) {
        let version = args.strVersion.split('.').slice(0, 3).join('.');
        if (semver.lt(version, MIN_SUPPORTED_VERSION)) {
            done({ clientVersionResult: {'string': 'E:You need to upgrade your QBWebConnector' } });
        } else if (semver.lt(version, RECOMMENDED_VERSION)) {
            done({ clientVersionResult: {'string': 'W:It is recommended that you upgrade your QBWebConnector' } });
        } else {
            done({ clientVersionResult: {'string': '' } });
        }
    };

    this.QBWebConnectorSvc.QBWebConnectorSvcSoap.authenticate = function(args, done) {
        //console.log('authenticate')
        handler.authenticate(args.strUserName.trim(), args.strPassword.trim())
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

    this.QBWebConnectorSvc.QBWebConnectorSvcSoap.sendRequestXML = function(args, done) {
        //console.log('sendRequestXML')
        validateTicket(args, (error) => {
            if (error) { 
                done(error, {});
            } else {
                handler.generateRequest(args.ticket.trim())
                .then((request) => {
                    done({ sendRequestXMLResult: { 'string': request } });   
                })
                .catch((error) => {
                    done(error, {});
                });
            }         
        });
    };
    
    this.QBWebConnectorSvc.QBWebConnectorSvcSoap.receiveResponseXML = function(args, done) {
        //console.log('receiveResponseXML')
        validateTicket(args, (error) => {
            if (error) { 
                done(error, {});
            } else {
                parseString(args.response, (error, response) => {
                    if (error) {
                        done(error, {});
                    } else {
                        handler.processResponse(args.ticket.trim(), response)
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
    };
    
    this.QBWebConnectorSvc.QBWebConnectorSvcSoap.connectionError = function(args, done) {
        //console.log('connectionError')
        validateTicket(args, (error) => {
            if (error) {
                done(error, {});
            } else {
                handler.closeTicket(args.ticket.trim(), args.message.trim(), args.hresult.trim())
                .then(() => {
                    done({ connectionErrorResult: { 'string': 'DONE' } });
                })
                .catch((error) => {
                    done(error, {});
                });
            }
        });
    };
    
    this.QBWebConnectorSvc.QBWebConnectorSvcSoap.getLastError = function(args, done) {
        //console.log('getLastError')
        validateTicket(args, (error) => {
            if (error) {
                done(error, {});
            } else {
                handler.getError(args.ticket.trim())
                .then((errorString) => {
                    done({ getLastErrorResult: { 'string': errorString } });
                })
                .catch((error) => {
                    done(error, {});
                });
            }
        });
    };
    
    this.QBWebConnectorSvc.QBWebConnectorSvcSoap.closeConnection = function(args, done) {
        //console.log('closeConnection')
        validateTicket(args, (error) => {
            if (error) {
                done(error, {});
            } else {
                handler.closeTicket(args.ticket.trim())
                .then(() => {
                    done({ closeConnectionResult: { 'string': 'OK' } });
                })
                .catch((error) => {
                    done(error, {});
                })
            }
        });
    };
}

module.exports = WebService;


