const fs = require('fs');
const request = require('request');
const ip = require('ip');
const xml2js = require('xml2js');
const aws = require('aws-sdk');


const configFile = 'domains.json';

exports.handler = (event, context) => {
    if (fs.existsSync(configFile)) {
        const server = getServer();
        const domainsToCheck = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        checkDomains(server, domainsToCheck, event, context);
    } else {
        exit(`Error: File ${configFile} does not exist.`);
        context.fail(event);
    }
};

/**
 * Print one or more error messages and exit.
 *
 * messageOrMessages can be either a string or an array of strings.
 */
function exit(messageOrMessages, event, context, code = 1) {
    if (Array.isArray(messageOrMessages)) {
        messageOrMessages.forEach(console.error);
    } else {
        console.error(messageOrMessages);
    }

    context.fail(event);
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

function checkDomains(server, domainsToCheck, event, context) {
    const domainsReturned = [];
    const availableDomains = [];

    request(`${server}/xml.response?ApiUser=${process.env.USERNAME}&ApiKey=${process.env.API_KEY}&UserName=${process.env.USERNAME}&Command=namecheap.domains.check&ClientIp=${ip.address()}&DomainList=${domainsToCheck.join(',')}`, (requestError, response, body) => {
        if (requestError) exit(requestError, event, context);

        xml2js.parseString(body, (xmlParseError, result) => {
            if (xmlParseError) exit(xmlParseError, event, context);

            const apiResponse = result.ApiResponse;

            if (apiResponse.$.Status.toLowerCase() === 'error') {
                const apiErrors = [];
                apiResponse.Errors.forEach(e1 => {
                    e1.Error.forEach(e2 => apiErrors.push(e2));
                });
                exit(apiErrors, event, context);
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

        let emailSubject, emailBody;
        if (!availableDomains.length > 0) {
            emailSubject = 'domainspy: No domains available';
            emailBody = 'No domains are currently available.';
        } else {
            emailSubject = 'domainspy: DOMAINS AVAILABLE!';
            emailBody = availableDomains.map(ad => {
                return `${ad} is available.`;
            }).join('\n');
        }

        const ses = new aws.SES({
            region: process.env.REGION,
        });
        ses.sendEmail({
            Destination: {
                ToAddresses: [process.env.EMAIL_TO],
            },
            Message: {
                Body: {
                    Text: {
                        Data: emailBody,
                    },
                },
                Subject: {
                    Data: emailSubject,
                },
            },
            Source: process.env.EMAIL_FROM,
        }, (err, data) => {
            if (err) {
                exit(err, event, context);
            } else {
                console.log(data);
                context.succeed(event);
            }
        });

        const missingDomainErrors = [];
        domainsToCheck.forEach(domainToCheck => {
            if (!domainsReturned.includes(domainToCheck)) {
                missingDomainErrors.push(`Error: Couldn't get status of ${domainToCheck}.`);
            }
        });

        if (missingDomainErrors.length > 0) {
            exit(missingDomainErrors, event, context);
        }
    });
}
