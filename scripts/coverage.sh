#!/usr/bin/env bash

port=8555

# Import common variables.
source $(dirname $0)/common.sh

# Executes cleanup function at script exit.
trap cleanup EXIT

echo "Starting testrpc-sc to generate coverage"
eval ./node_modules/.bin/testrpc-sc --port $port --gasLimit 0xfffffffffff "$accounts" -u 0 -u 1 &

SOLIDITY_COVERAGE=true ./node_modules/.bin/solidity-coverage.cmd