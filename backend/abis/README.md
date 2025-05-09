# Smart Contract ABIs

This directory contains the ABI (Application Binary Interface) files for the smart contracts used in the Urgent2Kay platform.

## Files

- `U2KToken.json` - ABI for the U2K token contract
- `BillPaymentSystem.json` - ABI for the bill payment system contract

## What are ABIs?

ABIs (Application Binary Interfaces) define how to interact with smart contracts on the blockchain. They describe the methods that can be called, their parameters, and return values.

## How ABIs are Used

The web3Config.js uses these ABI files to instantiate contract instances in the following order of precedence:

1. First attempts to load ABIs from compiled contracts (in the artifacts directory)
2. Falls back to these ABI files if compiled contracts aren't available

## Updating ABIs

When contracts are modified, these ABIs should be updated to reflect the changes. You can update them by:

1. Compiling the contracts and copying the ABIs from the artifacts
2. Manually updating the ABI definitions in these files

## Benefits of Separate ABI Files

- Decouples the backend from the contract compilation process
- Makes it easier to deploy to different environments
- Provides a clear reference for contract interfaces
- Simplifies integration for other team members who don't need to compile contracts 