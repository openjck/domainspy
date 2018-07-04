require('dotenv').config();

const fs = require('fs');
const request = require('request');
const ip = require('ip');
const xml2js = require('xml2js');


const configFile = 'domains.json';

if (fs.existsSync(configFile)) {
    const server = getServer();
    const domainsToCheck = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    checkDomains(server, domainsToCheck);
} else {
    exit(`Error: File ${configFile} does not exist.`);
}

/**
 * Print one or more error messages and exit.
 *
 * messageOrMessages can be either a string or an array of strings.
 */
function exit(messageOrMessages, code = 1) {
    if (Array.isArray(messageOrMessages)) {
        messageOrMessages.forEach(m => console.error(m));
    } else {
        console.error(messageOrMessages);
    }

    process.exit(code);
}

function getServer() {
    let server;

    if (!process.env.SANDBOX || process.env.SANDBOX !== 'true') {
        server = 'https://api.namecheap.com';
    } else {
        server = 'https://api.sandbox.namecheap.com';
    }

    return server;
}

/**
 * Split an array into smaller chunks.
 *
 * For example:
 *
 *     const arr = [1, 2, 3, 4, 5, 6, 7, 8];
 *     splitArray(arr, 2) => [[1, 2], [3, 4], [5, 6], [7, 8]]
 *
 * Based on:
 * http://www.frontcoded.com/splitting-javascript-array-into-chunks.html
 */
function splitArray(array, size) {
    const arrayGroup = [];

    for (let i = 0; i < array.length; i += size) {
        arrayGroup.push(array.slice(i, i + size));
    }

    return arrayGroup;
}

function checkDomains(server, domainsToCheck) {
    const domainsReturned = [];
    const availableDomains = [];
    const promises = [];

    // Namecheap won't allow you to query more than this many domains in a
    // single API call.
    const maxDomains = 50;

    const domainArrays = splitArray(domainsToCheck, maxDomains);

    domainArrays.forEach(da => {
        promises.push(new Promise((resolve, reject) => {
            request(`${server}/xml.response?ApiUser=${process.env.NAMECHEAP_USERNAME}&ApiKey=${process.env.NAMECHEAP_API_KEY}&UserName=${process.env.NAMECHEAP_USERNAME}&Command=namecheap.domains.check&ClientIp=${ip.address()}&DomainList=${da.join(',')}`, (requestError, response, body) => {
                if (requestError) {
                    reject();
                    exit(requestError);
                }

                xml2js.parseString(body, (xmlParseError, result) => {
                    if (xmlParseError) exit(xmlParseError);

                    const apiResponse = result.ApiResponse;

                    if (apiResponse.$.Status.toLowerCase() === 'error') {
                        const apiErrors = [];
                        apiResponse.Errors.forEach(e1 => {
                            e1.Error.forEach(e2 => apiErrors.push(e2._));
                        });
                        exit(apiErrors);
                    }

                    apiResponse.CommandResponse.forEach(cr => {
                        cr.DomainCheckResult.forEach(dcr => {
                            const resultDomain = dcr.$.Domain;

                            // Cast the Available attribute to a boolean. "true" becomes
                            // true. Everything else becomes false.
                            const available = dcr.$.Available === 'true';

                            domainsReturned.push(resultDomain);

                            if (available) {
                                availableDomains.push(resultDomain);
                            }
                        });
                    });
                });

                resolve();
            });
        }));
    });

    Promise.all(promises).then(() => {
        if (!availableDomains.length > 0) {
            console.log('No domains are currently available.');
        } else {
            availableDomains.forEach(ad => {
                console.log(`${ad} is available.`);
            });
        }

        const missingDomainErrors = [];
        domainsToCheck.forEach(domainToCheck => {
            if (!domainsReturned.includes(domainToCheck)) {
                missingDomainErrors.push(`Error: Couldn't get status of ${domainToCheck}.`);
            }
        });

        if (missingDomainErrors.length > 0) {
            exit(missingDomainErrors);
        }
    });
}
