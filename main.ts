// We need to run Deno with the following flags:
//
// --unstable (for Route 53)
// --allow-net
// --allow-env
// --allow-read

import { Route53Domains } from "https://deno.land/x/aws_sdk@v3.8.0.0/client-route-53-domains/Route53Domains.ts";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "https://deno.land/x/lambda/mod.ts";

// deno-lint-ignore require-await
export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  const domains = [
    "example.com",
    "example.net",
    "example.org",
  ];

  // This API call is only available in us-east-1
  const route53domains = new Route53Domains({ region: "us-east-1" });

  domains.forEach((domain) => {
    route53domains.checkDomainAvailability(
      { DomainName: domain },
      function (err, data) {
        if (err) return console.error(err);

        // Possible responses:
        // https://docs.aws.amazon.com/Route53/latest/APIReference/API_domains_CheckDomainAvailability.html#API_domains_CheckDomainAvailability_ResponseElements
        if (data) {
          console.log(`${domain}: ${data.Availability}`);
        }
      },
    );
  });

  return {
    statusCode: 200,
    headers: { "content-type": "text/html; charset=utf8" },
    body: "success",
  };
}
