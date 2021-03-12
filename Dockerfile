ARG DENO_VERSION

FROM hayd/alpine-deno:${DENO_VERSION} AS base

# Set a custom working directory which we can later mount as a volume. The name
# isn't important.
WORKDIR /app

# Copy all source files into the image
COPY . .

FROM hayd/deno-lambda:${DENO_VERSION} AS lambda

# Copy all files from the earlier stage into this stage
COPY --from=0 /app/main.ts ./

# Copy and pre-compile the main script. Also recursively download, compile, and
# cache remote dependencies.
RUN deno cache main.ts

CMD ["main.handler"]
