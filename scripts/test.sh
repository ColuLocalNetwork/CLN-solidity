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
  eval ganache-cli "$accounts" -u 0 -u 1 -l 8000029 > /dev/null &
  ganache_cli_pid=$!
fi

# Now run truffle test.
truffle test "$@"
