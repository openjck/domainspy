domainspy monitors domains that you care about and emails you if any of them
become available.

domainspy is not a hosted application. You must run it yourself by configuring
[Namecheap](https://www.namecheap.com/), [Webtask](https://webtask.io/), and
[SendGrid](https://sendgrid.com/docs/) according to the instructions below.

domainspy does not automatically purchase domains when they become available
because [the Namecheap API prohibits drop catching](https://www.namecheap.com/support/knowledgebase/article.aspx/9739/63/api--faq#b).

### Set up

#### Namecheap

1. Sign up for a free [Namecheap](https://www.namecheap.com/) account if you do
   not have one already
2. Follow the instructions in the [Namecheap API documentation](https://www.namecheap.com/support/api/intro.aspx)
   to enable the Namecheap API
    * Your account must meet [these criteria](https://www.namecheap.com/support/knowledgebase/article.aspx/9739/63/api--faq#c)
      to be eligible. The easiest way to qualify is by adding $50 to your
      account balance.
    * If Namecheap doesn't respond to your request for API access within a
      couple of days, contact support. They can speed things up.
    * You don't need to request sandbox API access unless you plan to modify or
      test this script
    * Make note of your username and API key
3. Whitelist the [Webtask IP addresses](https://webtask.io/docs/egress) in the
   API settings

#### SendGrid

1. Sign up for a free [SendGrid](https://sendgrid.com/docs/) account if you do
   not have one already
2. [Create a SendGrid API key](https://sendgrid.com/docs/ui/account-and-settings/api-keys/#creating-an-api-key)
   for domainspy and make note of its value

#### Webtask

1. Sign up for a free [Webtask](https://webtask.io/) account if you do not have
   one already
2. Install the [Webtask CLI](https://webtask.io/docs/wt-cli)

#### Installation

1. Clone this repository
2. Copy *.secrets.dist* to *.secrets* and provide values for all keys
    * `DOMAINS` is a comma-separated list of domains that you want to monitor
    * `EMAIL_RECIPIENT` is the email address that should receive alerts
    * All other values should have been noted in the steps above
3. Run this command while in the working directory: `wt create --name domainspy --secrets-file .secrets index.js`

### Usage

After setup is complete, domainspy will check your domains once per day and
email you if any become available. To check more often, run `wt edit domainspy`
and set a more frequent schedule in the task's settings. Be sure not to exceed
Namecheap's [API limits](https://www.namecheap.com/support/knowledgebase/article.aspx/9739/63/api--faq#z).

The emails that domainspy sends may be considered spam. If this happens, create
a filter in your email client which specifies that these messages should never
be sent to spam.

#### Adding domains

To add a domain, run `wt edit domainspy`. Access the secrets from the settings
menu and add your new domain to the comma-separated `DOMAINS` list.

### Test

Run `npm test`
