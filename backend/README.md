# Urgent2Kay Web3 Backend

This is the TypeScript backend for the Urgent2Kay bill payment system with Web3 integration, connecting to PostgreSQL and Base blockchain.

## Architecture

- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (via Railway)
- **Blockchain**: Base Sepolia testnet
- **Authentication**: JWT

## Directory Structure

```
backend/
├── abis/                  # Contract ABIs
│   ├── BillPaymentSystem.json
│   └── U2KToken.json
├── config/                # Configuration files
│   └── web3Config.ts
├── controllers/           # API controllers
│   ├── billController.ts
│   ├── userController.ts
│   └── web3Controller.ts
├── middleware/            # Express middleware
│   └── authMiddleware.ts
├── models/                # Database models
│   ├── bill.ts
│   ├── index.ts
│   └── user.ts
├── routes/                # API routes
│   ├── billRoutes.ts
│   ├── userRoutes.ts
│   └── web3Routes.ts
├── services/              # Business logic
│   ├── billService.ts
│   ├── syncService.ts
│   └── web3Service.ts
├── types/                 # TypeScript type definitions
│   └── blockchain.ts
├── app.ts                 # Main application file
├── env.example            # Example environment variables
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```bash
# Node environment
NODE_ENV=development
PORT=5000

# Database connection (PostgreSQL - Railway)
DATABASE_URL=postgres://username:password@hostname:port/database

# Blockchain settings
RPC_URL=https://base-sepolia.g.alchemy.com/v2/your-api-key
U2KTOKEN_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
BILLPAYMENTSYSTEM_ADDRESS=0xabcdef1234567890abcdef1234567890abcdef12
PRIVATE_KEY=your_private_key_for_signing_transactions

# JWT Auth
JWT_SECRET=generate_a_secure_random_string_for_jwt_signing
JWT_EXPIRY=24h
```

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create and configure `.env` file (see above)

3. Create ABI directory and files:
   ```bash
   mkdir -p abis
   # Add your contract ABIs to abis/U2KToken.json and abis/BillPaymentSystem.json
   ```

4. Validate your setup:
   ```bash
   npm run validate-web3
   ```

5. Build the TypeScript code:
   ```bash
   npm run build
   ```

6. Start the server:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Database Migration

The application uses Sequelize ORM and will automatically create the necessary tables when running in development mode. For production, you should manage migrations manually or set `NODE_ENV=development` initially to create the tables.

## API Endpoints

### User Endpoints
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login and get JWT token
- `GET /api/users/profile` - Get user profile (requires auth)
- `POST /api/users/wallet/connect` - Connect wallet to user account
- `POST /api/users/wallet/disconnect` - Disconnect wallet from user account

### Bill Endpoints
- `POST /api/bills/create` - Create a new bill
- `POST /api/bills/:billId/pay` - Pay a bill
- `POST /api/bills/:billId/reject` - Reject a bill
- `GET /api/bills/:billId` - Get bill details
- `GET /api/bills/sponsor/list` - Get all bills where user is sponsor
- `GET /api/bills/beneficiary/list` - Get all bills where user is beneficiary
- `POST /api/bills/:billId/sync` - Synchronize bill state with blockchain

### Web3 Endpoints
- `GET /api/web3/contracts` - Get contract addresses (public)
- `GET /api/web3/wallet/nonce` - Get authentication nonce for wallet connection
- `GET /api/web3/wallet/balance` - Get token balance
- `GET /api/web3/sync` - Sync user's bills from blockchain
- `POST /api/web3/bills/:billId/push` - Push a bill to blockchain

Protected endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## Integration with Base Blockchain

This backend connects to the Base Sepolia testnet for all blockchain operations. The web3Service handles all interactions with the smart contracts, while the database maintains a synchronized copy of bill data for efficient querying.

The syncService provides two-way synchronization:
1. Push bills from database to blockchain
2. Pull bills from blockchain to database
3. Update bill statuses based on blockchain state 