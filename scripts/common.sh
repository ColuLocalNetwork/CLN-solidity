# A helper script that contains predefined accounts, their balance and helper funcs.
# Usage in scripts:
# source $(dirname $0)/common.sh


# Helper funcs.

# Test if ganache-cli is running on port $1.
# Result is in $?
ganache_cli_running() {
  echo "ganache_cli_running?"
  nc -z localhost $1
}

# Kills ganache-cli process with its PID in $ganache_cli_pid.
cleanup() {
  echo "cleaning up"
  # Kill the ganache-cli instance that we started (if we started one).
  if [ -n "$ganache_cli_pid" ]; then
    kill -9 $ganache_cli_pid
  fi
}
