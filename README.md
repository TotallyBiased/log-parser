# Combined logs format file parser

## Prerequisites

* `node` v13.8.0
* `yarn`  v1.9.4
* Windows users
  * `nvm`
* Unix users
  * `nodenv`

## Quick Start

1. Link the environment variables
   * Unix shell 
        > ln -s .env.sample .env
   * Windows users copyPasta the file 
2. Set the Node version
    * Windows
        > nvm use 13.8.0
    * Linux/macOS/Unix
        > nodenv install -s
3. Run yarn install
    > yarn
4. Run
    * Run for development with nodemon
        > yarn watch
    * Run for single use production
        > yarn start

## Changing the inputs

Use the environment variables `.env` file to update the log file
path, the file encoding type and top X values.

## Output

1. The number of unique IP addresses.
2. The top X most visited URLs.
3. The top X most active IP addresses.
