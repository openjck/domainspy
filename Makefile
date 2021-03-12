.PHONY: build-base build-lambda format lint test deploy

DENO_VERSION = 1.7.2

build-base:
	docker image build \
		--target base \
		--build-arg DENO_VERSION=$(DENO_VERSION) \
		--tag domainspy-base \
		.

build-lambda:
	docker image build \
		--target lambda \
		--build-arg DENO_VERSION=$(DENO_VERSION) \
		--tag domainspy-lambda \
		.

format: build-base
	docker container run --rm --volume "$(shell pwd)":/app domainspy-base deno fmt

lint: build-base
	docker container run --rm domainspy-base deno fmt --check
	docker container run --rm domainspy-base deno lint --unstable

test: build-lambda
	./scripts/test.sh

deploy: build-base
	docker container run --rm domainspy-base deno run --allow-read scripts/deploy.ts
