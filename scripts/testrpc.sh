#!/usr/bin/env bash

port=8545

# Import common variables.
. scripts/common.sh

if ganache-cli_running $port; then
  echo "Using existing ganache-cli instance"
else
  echo "Starting our own ganache-cli instance" 
  eval ganache-cli "$accounts" -u 0 -u 1 --debug  
fi