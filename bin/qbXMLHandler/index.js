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

var uuid = require('node-uuid');
var data2xml = require('data2xml');
var convert = data2xml({
        xmlHeader: '<?xml version="1.0" encoding="utf-8"?>\n<?qbxml version="16.0"?>\n'
    });

var ticketMap = new Map();

// Public
module.exports = {

    authenticate: async function(username, password) {
        if (username === 'username' && password === 'password') {
            let ticketId = uuid.v1();
            ticketMap.set(ticketId, { ticketId });
            return { ticketId, companyFilePath: '' }
        } else {
           throw new Error('Invalid username or password.');
        }
    },

    validateTicket: async function(ticketId) {
        return ticketMap.has(ticketId);
    },

    setError: async function(ticketId, error) {
        let ticket = ticketMap.get(ticketId);
        if (ticket) ticket.error = error.toString();
    },

    getError: async function(ticketId) {
        return ticketMap.get(ticketId)
    },

    /**
     * Builds an array of qbXML commands
     * to be run by QBWC.
     *
     * @param callback(err, requestArray)
     */
    fetchRequest: function(callback) {
        console.log('fetchRequest');
        var xml;
        if (!iteratorId) {
            xml = convert(
                'QBXML',
                {
                    QBXMLMsgsRq : {
                        _attr : { onError : 'stopOnError' },
                        CustomerQueryRq : {
                            _attr: { iterator: "Start" },
                            MaxReturned: 2,
                        },
                    },
                }
            );
        } else {
            xml = null;
            /*
            xml = convert(
                'QBXML',
                {
                    QBXMLMsgsRq : {
                        _attr : { onError : 'stopOnError' },
                        CustomerQueryRq : {
                            _attr: { iterator: "Continue" },
                            MaxReturned: 2,
                        },
                    },
                }
            );
            */
        }
        callback(null, xml);
    },

    /**
     * Called when a qbXML response
     * is returned from QBWC.
     *
     * @param response - qbXML response
     */
    handleResponse: function(response) {
        console.log(response);
        iteratorId = 'fake';
        return 50;
    },

    closeTicket: async function(ticketId) {
        ticketMap.delete(ticketId);
    }
};

function buildRequests(callback) {
    var requests = new Array();
    var xml = convert(
        'QBXML',
        {
            QBXMLMsgsRq : {
                _attr : { onError : 'stopOnError' },
                CustomerQueryRq : {
                    _attr: { iterator: "Start" },
                    MaxReturned: 2,
                },
            },
        }
    );
    requests.push(xml);

    return callback(null, requests);
}