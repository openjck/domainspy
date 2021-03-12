#!/usr/bin/env bash

# Run the dev server without generating a nohup.out file
nohup docker container run --rm --publish 9000:8080 domainspy-lambda > /dev/null 2>&1 &
DEV_SERVER_PID=$!

# Trigger the function in the dev server. Use HTTPie if it's available, as it
# has more readable output.
sleep 3
if hash http; then
  http 'http://localhost:9000/2015-03-31/functions/function/invocations' payload='{}'
else
  curl \
    --request POST \
    --data '{ "payload": {} }' \
    'http://localhost:9000/2015-03-31/functions/function/invocations'
fi

# Kill the dev server
kill $DEV_SERVER_PID
