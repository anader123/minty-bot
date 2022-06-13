# Minty Bot 🤖 🍃

An automated minting Bot for Ethereum ERC-721s.

## Summary

`⚠️ Use at your own risk ⚠️`

Minty Bot seeks to make it easy to find and mint NFTs without needing to about anything about the mint. Using the Zora API, it scans the most recent mints and based on certain criteria it will decide to mint an NFT or not.

## Dependencies

-   [Zora API](https://api.zora.co/)
-   Etherscan API
-   Node.js
-   Ethers.js
-   ABI Decoder

## Utils

-   `zora`: Retrieves and formats NFT mint data from the Zora API.
-   `etherscan`: Retrieves Contract ABI and transaction input for a minting contract.
-   `crypto`: Ether.js functions to submit the transactions to the blockchain

## Environment Variables

-   `MAX_MINT_PRICE` - Max amount of ETH willing to pay for a mint
-   `MAX_GAS_PRICE` - Max gas price willing to pay for a mint
-   `MIN_SAMPLE_COUNT` - Minimum number/500 recent mints required to mint the NFT
-   `DELAY_SEC` - How often to run the check mint function in seconds
-   `ETHERSCAN_API_KEY` - Etherscan API Key
-   `BOT_ETH_ADDRESS` - The ETH Address of the Bot
-   `ETH_PRIVATE_KEY` - Private Key to the Bot
-   `ETH_RPC` - Endpoint to access an ETH node
-   `MIN_MINT_RAIO` - Minimum ratio of current minted amount to the max mint amount

## Installation

Clone down the repo:
`git clone https://github.com/anader123/minty-bot.git`

Install packages: `npm i`

Create a `.env` file: `touch .env`

Copy variables from `.env.sample` into `.env`

Add `BOT_ETH_ADDRESS` and `ETH_PRIVATE_KEY` to `.env`

Run `node index.js` in the root to start the bot

**Note**, the bot won't run for the first time until after `DELAY_SEC` amount of time has gone by.
