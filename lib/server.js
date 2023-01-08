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
const webService = require('./web-service');

//////////////////
//
// Public
//
//////////////////

module.exports = QuickbooksServer;

var WebService = require('./web-service2');

function QuickbooksServer() {
}

QuickbooksServer.prototype.listen = function(server, path, handler, done) {
    var webService = new WebService(handler);
    var wsdl = fs.readFileSync(__dirname + '/qbws.wsdl', 'utf8');
    soap.listen(server, path, webService, wsdl, done);
}
