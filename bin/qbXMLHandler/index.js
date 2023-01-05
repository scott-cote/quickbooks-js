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
            ticketMap.set(ticketId, { ticketId, state: 'idle' });
            //return { ticketId, companyFilePath: 'C:\\Users\Public\\Documents\\Intuit\\QuickBooks\\Company Files\\Scott Cote.qbw' }
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
        let ticket = ticketMap.get(ticketId);
        return ticket ? ticket.error : undefined;
    },

    generateRequest: async function(ticketId) {
        let ticket = ticketMap.get(ticketId);
        switch (ticket.state) {
            case ('idle'):
            {
                ticket.iteratorReadCount = 0;
                ticket.state = 'reading';
                //console.log('sending start');
                return convert(
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
            }
            case ('writing'):
            {
                ticket.state = 'reading';
                //console.log('sending continue');
                return convert(
                    'QBXML',
                    {
                        QBXMLMsgsRq : {
                            _attr : { onError : 'stopOnError' },
                            CustomerQueryRq : {
                                _attr: { iteratorID: ticket.iteratorId, iterator: "Continue" },
                                MaxReturned: 2,
                            },
                        },
                    }
                );
            }
            default:
            {
                console.log('generateRequest unexpected state: Sending empty');
                return '';
            }
        }
    },

    processResponse: async function(ticketId, response) {
        //console.log('processResponse');
        let ticket = ticketMap.get(ticketId);
        switch (ticket.state) {
            case ('reading'):
            {
                //console.log('reading');
                let metadata = response.QBXML.QBXMLMsgsRs[0].CustomerQueryRs[0].$;
                let data = response.QBXML.QBXMLMsgsRs[0].CustomerQueryRs[0].CustomerRet;
                // NOTE: Add checks for metadata status.
                //console.log(JSON.stringify(metadata));
                //console.log(data);
                let remainingCount = parseInt(metadata.iteratorRemainingCount);
                if (remainingCount > 0) {
                    ticket.iteratorId = metadata.iteratorID;
                    ticket.iteratorReadCount += data.length;
                    ticket.state = 'writing';
                    let progress = Math.floor(100 * (ticket.iteratorReadCount / (ticket.iteratorReadCount + remainingCount)));
                    //console.log('progress: '+progress);
                    return progress;
                } else {
                    // can return 99 if there is another operation
                    return 100;
                }
            }
            default: 
            {
                console.log('processResponse unexpected state');
                return 100;
            }
        }
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

    closeTicket: async function(ticketId, message, hresult) {
        if (message) {
            console.log('QBWC reported error: ' + message);
        }
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