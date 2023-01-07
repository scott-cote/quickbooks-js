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
 * Server.js
 *
 * This class will star the SOAP service
 * and start listening for requests from
 * a Quickbooks Web Connector
 */

//////////////////
//
// Private
//
//////////////////


/**
 * Node.js' File System API
 *
 * https://nodejs.org/dist/latest-v6.x/docs/api/fs.html
 */
var fs = require('fs');

/**
 * A SOAP client and server
 * for Node.js
 *
 * https://github.com/vpulim/node-soap
 */
var soap = require('soap');

/**
 * A constant for the WSDL filename.
 * @type {string}
 */
var WSDL_FILENAME = '/qbws.wsdl';

/**
 * Fetches the WSDL file for the
 * SOAP service.
 *
 * @returns {string} contents of WSDL file
 */
function buildWsdl() {
    var wsdl = fs.readFileSync(__dirname + WSDL_FILENAME, 'utf8');

    return wsdl;
}

//////////////////
//
// Public
//
//////////////////

module.exports = Server;

function Server() {
    this.wsdl = buildWsdl();
    this.webService = require('./web-service');
}

Server.prototype.run = function(server) {
    var soapServer;
    //server.listen(port)
    soapServer = soap.listen(server, '/wsdl', this.webService.service, this.wsdl);
    console.log('Quickbooks SOAP Server listening');
};

Server.prototype.setQBXMLHandler = function(qbXMLHandler) {
    this.webService.setQBXMLHandler(qbXMLHandler);
};