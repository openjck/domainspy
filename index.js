const ip = require("ip");
const request = require("request");
const sgMail = require("@sendgrid/mail");
const xml2js = require("xml2js");

const projectName = "domainspy";
let webtaskContext;
let webtaskCallback;

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
function splitArray(arr, size) {
    const arrayOfArrays = [];

    for (let i = 0; i < arr.length; i += size) {
        arrayOfArrays.push(arr.slice(i, i + size));
    }

    return arrayOfArrays;
}

function getAPIServer() {
    let apiServer;

    const productionAPIServer = "https://api.namecheap.com";
    const stagingAPIServer = "https://api.sandbox.namecheap.com";

    if (
        !webtaskContext.secrets.SANDBOX ||
        webtaskContext.secrets.SANDBOX !== "true"
    ) {
        apiServer = productionAPIServer;
    } else {
        apiServer = stagingAPIServer;
    }

    return apiServer;
}

function email(rawSubject, messageOrMessages) {
    let body;
    let rawSubjectToUse = rawSubject;

    const validMsgArray =
        Array.isArray(messageOrMessages) &&
        messageOrMessages.length > 0 &&
        messageOrMessages.every(e => typeof e === "string");

    if (validMsgArray) {
        body = messageOrMessages.join("\r\n");
    } else if (typeof messageOrMessages === "string") {
        body = messageOrMessages;
    } else {
        rawSubjectToUse = "Error";
        body = "Unknown error";
    }

    sgMail.setApiKey(webtaskContext.secrets.SENDGRID_API_KEY);

    sgMail.send({
        to: webtaskContext.secrets.EMAIL_RECIPIENT,
        from: webtaskContext.secrets.EMAIL_RECIPIENT,
        subject: `[${projectName}] ${rawSubjectToUse}`,
        text: body
    });
}

function processDomains(apiServer, domainsToCheck) {
    const domainsReturned = [];
    const availableDomains = [];
    const requestPromises = [];

    // The Namecheap API does not allow users to query more than this many
    // domains in one API call
    const maxDomains = 50;

    const domainGroups = splitArray(domainsToCheck, maxDomains);

    for (let i = 0; i < domainGroups.length; i += 1) {
        const domains = domainGroups[i];

        const namecheapAPIEndpoint = `${apiServer}/xml.response?ApiUser=${
            webtaskContext.secrets.NAMECHEAP_USERNAME
        }&ApiKey=${webtaskContext.secrets.NAMECHEAP_API_KEY}&UserName=${
            webtaskContext.secrets.NAMECHEAP_USERNAME
        }&Command=namecheap.domains.check&ClientIp=${ip.address()}&DomainList=${domains.join(
            ","
        )}`;

        requestPromises.push(
            new Promise((resolve, reject) => {
                request(namecheapAPIEndpoint, (error, response, body) => {
                    if (error) {
                        return reject(error);
                    }

                    xml2js.parseString(
                        body,
                        (xmlParseError, { ApiResponse }) => {
                            if (xmlParseError) {
                                return reject(xmlParseError);
                            }

                            if (
                                ApiResponse.$.Status.toLowerCase() === "error"
                            ) {
                                const apiErrors = [];
                                ApiResponse.Errors.forEach(e1 => {
                                    e1.Error.forEach(e2 => {
                                        apiErrors.push(e2._);
                                    });
                                });
                                return reject(apiErrors);
                            }

                            ApiResponse.CommandResponse.forEach(cr => {
                                cr.DomainCheckResult.forEach(dcr => {
                                    const resultDomain = dcr.$.Domain;

                                    domainsReturned.push(resultDomain);

                                    // Cast the Available attribute to a boolean. "true" becomes
                                    // true. Everything else becomes false.
                                    const available =
                                        dcr.$.Available === "true";

                                    if (available) {
                                        availableDomains.push(resultDomain);

                                        // eslint-disable-next-line no-console
                                        console.log(
                                            `${resultDomain} is available`
                                        );
                                    } else {
                                        // eslint-disable-next-line no-console
                                        console.log(
                                            `${resultDomain} is not available`
                                        );
                                    }

                                    return resolve();
                                }); // DomainCheckResult
                            }); // CommandResponse
                        }
                    ); // xml2js.parseString
                }); // request
            })
        ); // Promise
    } // for

    Promise.all(requestPromises)
        .then(() => {
            const missingDomains = domainsToCheck.filter(
                d => !domainsReturned.includes(d)
            );
            if (missingDomains.length > 0) {
                throw missingDomains.map(
                    md => `Could not get the status of ${md}`
                );
            }

            if (availableDomains.length === 0) {
                return webtaskCallback(
                    null,
                    "SUCCESS: No domains are available"
                );
            }

            let subject;
            if (availableDomains.length === 1) {
                subject = "A domain is available";
            } else {
                subject = "Some domains are available";
            }

            const messages = availableDomains.map(ad => `${ad} is available!`);

            email(subject, messages);

            return webtaskCallback(
                null,
                `SUCCESS: The following domains are available: ${availableDomains.join(
                    ", "
                )}`
            );
        })
        .catch(err => {
            try {
                let errorMessage;

                if (Array.isArray(err)) {
                    errorMessage = err.map(e => e.toString()).join("; ");
                } else {
                    errorMessage = err.toString();
                }

                email("Error", errorMessage);
                return webtaskCallback(`FAIL: ${errorMessage}`);
            } catch (innerErr) {
                email("Error", "Unknown error");
                return webtaskCallback("FAIL: Unknown error");
            }
        });
}

module.exports = (ctx, cb) => {
    webtaskContext = ctx;
    webtaskCallback = cb;

    const apiServer = getAPIServer();
    const domainsToCheck = webtaskContext.secrets.DOMAINS.split(",");

    processDomains(apiServer, domainsToCheck);
};
