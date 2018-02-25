#!/usr/bin/env bash

port=8545

# Import common variables.
source $(dirname $0)/common.sh

if ganache_cli_running $port; then
  echo "Using existing ganache-cli instance"
else
  echo "Starting our own ganache-cli instance"
  eval ./node_modules/.bin/ganache-cli --accounts 51 --defaultBalanceEther 10000000000 --unlock 0 --unlock 1 --debug --gasLimit 8000029
fi
