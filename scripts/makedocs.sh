
#!/usr/bin/env bash

rm -r docs/reference
mkdir docs/reference
find contracts -name '*.sol' ! -name 'Migrations.sol' -type f -exec bash -c './node_modules/.bin/solmd {} --dest docs/reference/`basename {} .sol`.md' \;
