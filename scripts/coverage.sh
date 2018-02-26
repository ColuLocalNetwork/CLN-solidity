#!/usr/bin/env bash

port=8555

# Import common variables.
source $(dirname $0)/common.sh

# Executes cleanup function at script exit.
trap cleanup EXIT

echo "Starting testrpc-sc to generate coverage"
eval ./node_modules/.bin/testrpc-sc --port $port --gasLimit 0xfffffffffff --accounts 51 --defaultBalanceEther 10000000000 --unlock 0 --unlock 1 &

SOLIDITY_COVERAGE=true ./node_modules/.bin/solidity-coverage.cmd
