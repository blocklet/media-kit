#!/usr/bin/env bash

dep:
	@echo "Install dependencies required for this repo..."
	@pnpm setup
	@pnpm install

test:
	@echo "Running test suites..."

build:
	@echo "Building the software..."

bundle:
	@echo "Bundling the software..."
	@pnpm run bundle

github-init:
	@make dep

init:
	@make dep

include .makefiles/*.mk
