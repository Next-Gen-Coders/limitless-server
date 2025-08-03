# 1inch Cross-Chain Swap Integration Setup

## Overview

This implementation adds 1inch Fusion cross-chain swap functionality to the Limitless AI platform, allowing users to execute token swaps directly through AI chat interactions.

## Environment Variables

### Required Variables

Add this to your `.env` file:

```env
# Required for 1inch API access
ONEINCH_API_KEY="your_1inch_api_key_from_portal"
```

### Optional Variables (Server-Side Execution)

⚠️ **For user-side only transactions (recommended), you can skip these variables entirely.**

```env
# Only add these if you want the server to execute transactions on behalf of users
# This requires managing server wallet security and gas fees
PRIVATE_KEY="your_server_wallet_private_key"
RPC_URL="https://eth-mainnet.g.alchemy.com/v2/your-alchemy-key"
```

### Execution Modes

1. **User-Side Only (Default)**: Only requires `ONEINCH_API_KEY`

   - ✅ More secure (no server private keys)
   - ✅ Users maintain full control of their funds
   - ✅ No gas management required on server
   - ✅ Users sign transactions with their own wallets

2. **Server-Side Execution**: Requires `ONEINCH_API_KEY`, `PRIVATE_KEY`, and `RPC_URL`
   - ⚠️ Server manages private keys and gas fees
   - ⚠️ Additional security considerations
   - ⚠️ Server needs funded wallet for transactions

## Getting 1inch API Key

1. Visit [1inch Developer Portal](https://portal.1inch.dev/)
2. Create an account and generate an API key
3. Add the API key to your environment variables

## Features Implemented

### Backend

- **Fusion Service**: Core 1inch SDK integration for quotes and swap execution
- **Swap Tool**: AI tool for getting quotes and preparing swaps
- **Controllers**: API endpoints for quote, execute, status, and user swaps
- **Routes**: RESTful endpoints at `/swap/*`
- **Database**: Swap transaction tracking with status monitoring

### Frontend

- **Swap Service**: API client for swap operations
- **React Hooks**: Query and mutation hooks for swap functionality
- **Swap Confirmation**: Interactive UI for reviewing and confirming swaps
- **Swap Status**: Real-time status tracking with automatic updates
- **Chat Integration**: Seamless swap detection and execution in chat

### AI Integration

- **Natural Language**: AI detects swap requests from user messages
- **Quote Generation**: Automatic quote generation with clear presentation
- **Confirmation Flow**: User-friendly confirmation prompts
- **Status Monitoring**: Real-time swap execution tracking

## Supported Chains

- Ethereum (Chain ID: 1)
- Polygon (Chain ID: 137)
- Arbitrum (Chain ID: 42161)
- Optimism (Chain ID: 10)
- BSC (Chain ID: 56)
- Avalanche (Chain ID: 43114)
- Fantom (Chain ID: 250)
- Gnosis (Chain ID: 100)

## Usage Examples

Users can request swaps using natural language:

- "Swap 1 ETH for USDC on Polygon"
- "Get a quote to exchange 1000 USDT for WETH on Arbitrum"
- "I want to swap 0.5 WBTC to DAI on Ethereum"

## API Endpoints

### GET /swap/quote

Get swap quote for token pair

```json
{
  "amount": "1000000000000000000",
  "srcChainId": 1,
  "dstChainId": 137,
  "srcTokenAddress": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "dstTokenAddress": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
}
```

### POST /swap/execute

Execute swap transaction

```json
{
  "amount": "1000000000000000000",
  "srcChainId": 1,
  "dstChainId": 137,
  "srcTokenAddress": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "dstTokenAddress": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  "chatId": "optional-chat-id",
  "messageId": "optional-message-id"
}
```

### GET /swap/status/:swapId

Get swap transaction status

### GET /swap/user/swaps

Get user's swap history

## Database Schema

The `swap_transactions` table tracks:

- User and chat association
- Source/destination chain and token details
- Transaction amounts and addresses
- 1inch order hashes and secrets
- Status tracking (pending/processing/completed/failed)
- Error details and metadata

## Testing

1. **Start the server**: `npm run dev`
2. **Start the frontend**: `npm run dev` (in limitless folder)
3. **Test chat interaction**:
   - Login with wallet
   - Ask: "Swap 0.001 ETH for USDC on Polygon"
   - Confirm swap in the UI
   - Monitor status updates

## Security Considerations

- Private keys should be stored securely (consider AWS KMS or similar)
- Implement rate limiting for swap requests
- Validate all input parameters
- Set reasonable transaction limits
- Monitor for suspicious activity

## Troubleshooting

### Common Issues

1. **"Swap functionality may be limited"** warning

   - Missing PRIVATE_KEY or RPC_URL environment variables
   - Add these for full functionality or ignore for quote-only mode

2. **Quote failures**

   - Check 1inch API key is valid
   - Verify token addresses are correct
   - Ensure sufficient liquidity for the pair

3. **Transaction failures**
   - Check wallet has sufficient balance
   - Verify gas fees are available on source chain
   - Ensure network connectivity

## Implementation Notes

- The system supports both quote-only and full execution modes
- Swap confirmation UI appears automatically when AI detects swap intent
- Real-time status updates every 5 seconds during processing
- Failed swaps include detailed error information
- All transactions are tracked in the database for audit purposes
