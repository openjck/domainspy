domainspy is an [AWS Lambda](https://aws.amazon.com/lambda/) function that
monitors domains and notifies you when they're available.

Provide a list of domains that you care about, install the function on Lambda,
invoke it (or schedule it to be invoked automatically), and domainspy will tell
when if any of the domains are available.

domainspy uses the [namecheap.domains.check method](https://www.namecheap.com/support/api/methods/domains/check.aspx)
of the [Namecheap API](https://www.namecheap.com/support/api/intro.aspx).

Fair warning: I created this project for my own use and won't spend a lot of
time responding to feature requests. But feel free to fork away.

## Usage

### Set up

1. Sign up for a free [Namecheap API](https://www.namecheap.com/support/api/intro.aspx) account
    * If Namecheap doesn't respond to your request for API access within a
      couple of days, contact support. They can usually speed things up.
    * You don't need to request sandbox API access unless you plan to modify or
      test this script.
2. Create a file named *domains.json* at the root of this directory. The file
   should be an array of strings, where each string is a domain that you want to
   monitor. For example:

   ```json
   [
       "example.com",
       "google.com",
       "github.com"
   ]
   ```

### Deploy to AWS Lambda

1. [Create an AWS Lambda function](https://docs.aws.amazon.com/lambda/latest/dg/getting-started.html)
   for domainspy
    * Be sure to set the following environment variables
        * `USERNAME` (your Namecheap API username)
        * `API_KEY` (your Namecheap API password)
        * `EMAIL_FROM` (the email address that you want to send mail from)
        * `EMAIL_TO` (the email address that you want to send results to)
        * `REGION` (your AWS region)
2. Run `./build.lambda`
3. Import *build/lambda.zip* as your Lambda project source
4. [Enable outgoing email](http://www.wisdomofjim.com/blog/sending-an-email-from-aws-lambda-function-in-nodejs-with-aws-simple-email-service)
   from the email address you chose as the value of `EMAIL_FROM`

### Run

#### Manually

1. Install the [AWS CLI](https://aws.amazon.com/cli/)
2. Run `aws lambda invoke --invocation-type Event --function-name domainspy /dev/null`

#### Automatically

[Schedule the function](https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/RunLambdaSchedule.html)
to run automatically

### Test

Run `npm test`
