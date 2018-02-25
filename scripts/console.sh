#!/usr/bin/env bash

port=8545

# Import common variables.
source $(dirname $0)/common.sh

# Executes cleanup function at script exit.
trap cleanup EXIT

if ganache_cli_running $port; then
  echo "Using existing ganache-cli instance"
else
  echo "Starting our own ganache-cli instance"
  eval ganache-cli --accounts 50 --defaultBalanceEther 10000000000 --unlock 0 --unlock 1 > /dev/null &
  ganache_cli_pid=$!
fi

truffle console
