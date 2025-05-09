# Urgent2Kay - Bill Payment System with Web3 Integration

Urgent2Kay is a comprehensive bill payment system where users can request others to help them make payments for various goods and services. The platform supports both traditional payment methods and cryptocurrency transactions through Web3 integration.

## Project Structure

- **Contracts**: Smart contracts for the bill payment system and token
  - `U2KToken.sol`: ERC20 token for the payment ecosystem
  - `BillPaymentSystem.sol`: Core contract for managing bills and payments

- **Backend**: Node.js server with MongoDB database
  - RESTful APIs for bill and user management
  - Web3 integration with blockchain

- **Frontend**: (Coming soon)
  - Web application consuming the backend APIs
  - Web3 wallet integration for crypto payments

## Features

- Create bill payment requests as a beneficiary
- Approve or reject bill payments as a sponsor
- Pay bills using either:
  - Fiat currency (through traditional payment methods)
  - Native crypto (ETH)
  - U2K tokens (platform's utility token)
- Earn rewards in U2K tokens for sponsors who pay bills
- Wallet connection and management
- Synchronization between blockchain and database

## Getting Started

### Prerequisites

- Node.js >= 16
- MongoDB database
- Ethereum wallet (MetaMask or similar)
- Infura or similar RPC provider account

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/urgent2kay.git
   cd urgent2kay
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `backend/config/env.example` to `backend/.env`
   - Fill in your MongoDB connection string and JWT secret
   - Add your RPC URL, contract addresses, and private key (if needed)

4. Compile smart contracts:
   ```bash
   npm run compile
   ```

5. Start the backend server:
   ```bash
   npm run start:backend
   ```

## Smart Contract Deployment

1. Deploy to Sepolia testnet:
   ```bash
   npm run deploy:sepolia
   ```

2. Deploy to Base Sepolia testnet:
   ```bash
   npm run deploy:base-sepolia
   ```

3. Verify contracts:
   ```bash
   npm run verify
   ```

4. Copy artifacts to frontend:
   ```bash
   npm run copy-artifacts
   ```

## Web3 Integration

The backend provides a seamless integration layer between traditional web applications and the blockchain:

1. **Dual Storage**: Bills are stored in both the MongoDB database and the blockchain
2. **Synchronization**: The backend synchronizes data between both sources
3. **Wallet Connection**: Users can connect their wallets to their accounts
4. **Transaction Handling**: The backend abstracts away blockchain complexity

For developers wanting to integrate Urgent2Kay into their applications, the backend exposes a unified API that handles both traditional and Web3 operations.

## API Documentation

See [backend/README.md](backend/README.md) for detailed API documentation.

## License

This project is licensed under the ISC License.
