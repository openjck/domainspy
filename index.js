const ip = require('ip');
const request = require('request-promise-native');
const sgMail = require('@sendgrid/mail');
const xml2js = require('xml2js');


module.exports = async (context, callback) => {
    const projectName = 'domainspy';

    function fail(messageOrMessages, code = 1) {
        if (Array.isArray(messageOrMessages)) {
            messageOrMessages.forEach(m => console.error('Error:', m));
        } else {
            console.error(messageOrMessages);
        }

        email('Error', messageOrMessages);

        callback('Error: Task failed');

        // eslint-disable-next-line no-process-exit
        process.exit(code);
    }

    function email(subject, messageOrMessages) {
        let body = '';

        if (Array.isArray(messageOrMessages)) {
            body = messageOrMessages.join('<br />');
        } else {
            body = messageOrMessages;
        }

        const taggedSubject = `[${projectName}] ${subject}`;

        if (typeof body !== 'string' || body.length === 0) {
            body = 'Unknown error';
        }

        sgMail.send({
            to: context.secrets.EMAIL_RECIPIENT,
            from: context.secrets.EMAIL_RECIPIENT,
            subject: taggedSubject,
            html: body,
        });
    }

    sgMail.setApiKey(context.secrets.SENDGRID_API_KEY);

    const server = getServer(context);
    const domainsToCheck = context.secrets.DOMAINS.split(',');

    const domainsReturned = [];
    const availableDomains = [];

    // Namecheap won't allow you to query more than this many domains in a
    // single API call.
    const maxDomains = 50;
    const domainArrays = splitArray(domainsToCheck, maxDomains);

    for (const domainArray of domainArrays) {
        const namecheapResult = await request(`${server}/xml.response?ApiUser=${context.secrets.NAMECHEAP_USERNAME}&ApiKey=${context.secrets.NAMECHEAP_API_KEY}&UserName=${context.secrets.NAMECHEAP_USERNAME}&Command=namecheap.domains.check&ClientIp=${ip.address()}&DomainList=${domainArray.join(',')}`);

        xml2js.parseString(namecheapResult, (xmlParseError, { ApiResponse }) => {
            if (xmlParseError) {
                fail(xmlParseError);
            }

            if (ApiResponse.$.Status.toLowerCase() === 'error') {
                const apiErrors = [];
                ApiResponse.Errors.forEach(e1 => {
                    e1.Error.forEach(e2 => apiErrors.push(e2._.toString()));
                });
                fail(apiErrors);
            }

            ApiResponse.CommandResponse.forEach(cr => {
                cr.DomainCheckResult.forEach(dcr => {
                    const resultDomain = dcr.$.Domain;

                    // Cast the Available attribute to a boolean. "true" becomes
                    // true. Everything else becomes false.
                    const available = dcr.$.Available === 'true';

                    domainsReturned.push(resultDomain);

                    if (available) {
                        availableDomains.push(resultDomain);
                        console.log(`${resultDomain} is available`);
                    } else {
                        console.log(`${resultDomain} is not available`);
                    }
                });
            });
        });
    } // for loop

    const missingDomainErrors = [];
    domainsToCheck.forEach(domainToCheck => {
        if (!domainsReturned.includes(domainToCheck)) {
            missingDomainErrors.push(`Error: Couldn't get status of ${domainToCheck}.`);
        }
    });

    if (missingDomainErrors.length > 0) {
        fail(missingDomainErrors);
    }

    if (availableDomains.length > 0) {
        const messages = [];

        availableDomains.forEach(ad => {
            messages.push(`${ad} is available`);
        });

        let subject;
        if (availableDomains.length === 1) {
            subject = 'A domain is available';
        } else {
            subject = 'Some domains are available';
        }

        email(subject, messages);
    }

    callback(null, 'Task completed successfully');
};

function getServer(context) {
    let server;

    if (!context.secrets.SANDBOX || context.secrets.SANDBOX !== 'true') {
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
    const arrayOfArrays = [];

    for (let i = 0; i < array.length; i += size) {
        arrayOfArrays.push(array.slice(i, i + size));
    }

    return arrayOfArrays;
}
