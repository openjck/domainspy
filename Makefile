.PHONY: build-dev build-prod run trigger format lint shell-dev shell-prod

DENO_VERSION = 1.7.2

build-dev:
	docker image build \
		--file Dockerfile.dev \
		--build-arg DENO_VERSION=$(DENO_VERSION) \
		--tag domainspy-dev \
		.

build-prod:
	docker image build \
		--file Dockerfile.prod \
		--build-arg DENO_VERSION=$(DENO_VERSION) \
		--tag domainspy-prod \
		.

format: build-dev
	docker container run --rm --volume "$(shell pwd)":/app domainspy-dev deno fmt

lint: build-dev
	docker container run --rm domainspy-dev deno fmt --check
	docker container run --rm domainspy-dev deno lint --unstable

run: build-prod
	docker container run --rm --publish 9000:8080 domainspy-prod

trigger:
	http 'http://localhost:9000/2015-03-31/functions/function/invocations' payload='{}'
