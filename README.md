# sol_wallet
Advanced Solana Bootcamp - 1st Assignment

Solana Wallet management program, can be used only on cli.

Usage

1. (optional) use solana-test-validator in another window to work in localhost  
2. clone the repo
3. npm install
4. npx tsc
5. npm index.js

You have 5 options:
1. Listing wallets
2. Creating a wallet (with name)
3. Checking balance of a wallet (by name)
4. Airdrop to a wallet (by name)
5. Transfer between wallets

All options have been tested and working both devnet and localhost!


# Imports and Constants

Imports from @solana/web3.js: These are classes and functions provided by the Solana Web3.js library to interact with the Solana blockchain. This includes connecting to the blockchain, creating keypairs (wallets), and creating and sending transactions.
Imports from fs and path modules: These are Node.js modules used for file system operations. The fs module is used to read from and write to the filesystem, while the path module is used to handle file paths.
Constants for file path and network endpoints: These constants store the file path for the wallets database (FILE_PATH) and URLs for connecting to local and devnet Solana nodes.
WalletData Interface
Defines the structure of a wallet object stored in the local database. It includes the wallet's name, balance, public key, and secret key.

# Utility Functions

writeToDB: Saves the array of wallets to the local JSON file.

updateWallet: Updates a specific wallet in the local database and then writes the updated array to the file.

getWallets: Reads the wallets from the local JSON file and returns them as an array of WalletData.

# Core Functions

createWallet: Generates a new Solana keypair (wallet), checks for name uniqueness, and saves the new wallet to the local database.

getWalletBalance: Fetches the balance of a specified wallet from the Solana blockchain using the provided network endpoint (devnet or local).

airdrop: Requests an airdrop of SOL to a specified wallet. It listens for account changes to confirm the airdrop completion.

transfer: Transfers SOL from one wallet to another. It constructs a transfer transaction, signs it with the sender's private key, and submits it to the blockchain.

# Detailed Code Functionality

The code provides a simple way to interact with the Solana blockchain without a sophisticated backend. It uses a local JSON file as a makeshift database for demonstration purposes, allowing users to perform basic wallet operations.
It demonstrates how to generate new wallets, check balances, perform airdrops, and transfer tokens, covering fundamental operations for Solana blockchain interaction.
The async functions for balance checking, airdropping, and transferring utilize the Solana Web3.js library's asynchronous operations to interact with the blockchain, handle account changes, and confirm transactions.
Network endpoints are configurable, allowing operations on both the local Solana network (for development and testing) and the Solana Devnet (for more realistic testing in a live environment).
Error handling includes catching exceptions, particularly for rate-limiting responses from the blockchain (HTTP 429 errors), and logging informative messages to help users understand what went wrong during operations.

# Note

This script uses a simplistic approach for storing wallet information, including private keys, in plain text within a local JSON file. In a real-world application, storing sensitive information securely is crucial, and this method should be replaced with more secure storage and encryption mechanisms.
The script assumes a basic understanding of Solana's architecture, including the concept of lamports (the smallest unit of SOL), keypairs, and the Solana Web3.js API.
