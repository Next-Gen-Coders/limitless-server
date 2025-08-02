# API Documentation

## Authentication

This API uses **Privy** for user authentication and wallet management. All protected endpoints require a valid Privy authentication token.

### Authentication Flow

1. **Frontend Integration**: Users authenticate through Privy on your frontend (wallet connection or email signin)
2. **Token Generation**: Privy generates an authentication token
3. **API Requests**: Include the token in the `Authorization` header for protected endpoints

### Headers Required for Protected Routes

```http
Authorization: Bearer <privy_token>
Content-Type: application/json
```

### Authentication Middleware Types

- **`authenticatePrivy`**: Verifies Privy token and sets `req.user` with user data
- **`authenticateAndSync`**: Verifies token + automatically syncs user data to database

### User Object Structure

After authentication, `req.user` contains:

```typescript
{
  id: string;           // User UUID in your database
  privyId: string;      // Privy user ID
  email?: string;       // User's email (if available)
  walletAddress?: string; // Primary wallet address
  linkedAccounts?: any[]; // Array of linked accounts from Privy
  createdAt?: Date;     // Account creation timestamp
  updatedAt?: Date;     // Last update timestamp
}
```

### Error Responses

**401 Unauthorized:**

```json
{
  "success": false,
  "message": "Missing or invalid authorization header",
  "error": "Authentication failed"
}
```

**403 Forbidden:**

```json
{
  "success": false,
  "message": "Invalid or expired token",
  "error": "Authentication failed"
}
```

---

## Health

### `GET /service/health`

- **Description:** Health check endpoint.
- **Authentication:** None required
- **Response:**

  ```json
  {
    "status": "Limitless",
    "timestamp": "2025-08-02T12:34:56.789Z",
    "method": "GET",
    "path": "/service/health"
  }
  ```

---

## Overview

This API provides comprehensive functionality for:

- **User Management**: Privy integration for user authentication and wallet management
- **Chat Management**: Create and manage user conversations
- **Message Management**: Handle chat messages with role-based messaging

## User

### `POST /user/sync`

- **Description:** Sync user with Privy.
- **Authentication:** None required (public endpoint for initial user setup)
- **Request:**

  ```json
  {
    "privyId": "string (required)",
    "email": "string (optional, email)",
    "walletAddress": "string (optional)",
    "linkedAccounts": [ ... ] (optional)
  }
  ```

- **Response:**

  ```json
  {
    "success": true,
    "user": {
      "id": "b1a2c3d4-e5f6-7890-1234-56789abcdef0",
      "privyId": "privy_123456",
      "email": "user@example.com",
      "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
      "linkedAccounts": [],
      "createdAt": "2025-08-02T12:00:00.000Z",
      "updatedAt": "2025-08-02T12:00:00.000Z"
    }
  }
  ```

### `GET /user/users/:privyId`

- **Description:** Get user by Privy ID.
- **Authentication:** Required (`authenticatePrivy`)
- **Params:** `privyId` (string, required)
- **Response:**

  ```json
  {
    "id": "b1a2c3d4-e5f6-7890-1234-56789abcdef0",
    "privyId": "privy_123456",
    "email": "user@example.com",
    "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "linkedAccounts": [],
    "createdAt": "2025-08-02T12:00:00.000Z",
    "updatedAt": "2025-08-02T12:00:00.000Z"
  }
  ```

---

## Chats

### `POST /user/chats`

- **Description:** Create a new chat.
- **Authentication:** Required (`authenticateAndSync` - auto-syncs user data)
- **Request:**

  ```json
  {
    "title": "string (required)"
  }
  ```

  **Note:** `userId` is automatically extracted from the authenticated user token.

- **Response:** Chat object

### `GET /user/chats/:id`

- **Description:** Get chat by ID.
- **Authentication:** Required (`authenticatePrivy`)
- **Params:** `id` (string, uuid, required)
- **Response:** Chat object

### `GET /user/users/:userId/chats`

- **Description:** Get all chats for a user.
- **Authentication:** Required (`authenticatePrivy`)
- **Params:** `userId` (string, uuid, required)
- **Response:** Array of chat objects

### `PUT /user/chats/:id`

- **Description:** Update a chat.
- **Authentication:** Required (`authenticatePrivy`)
- **Params:** `id` (string, uuid, required)
- **Request:**

  ```json
  {
    "title": "string (required)"
  }
  ```

- **Response:** Updated chat object

### `DELETE /user/chats/:id`

- **Description:** Delete a chat.
- **Authentication:** Required (`authenticatePrivy`)
- **Params:** `id` (string, uuid, required)
- **Response:** Success message

---

## Messages

### `POST /user/messages`

- **Description:** Create a new message with automatic AI response generation.
- **Authentication:** Required (`authenticateAndSync` - auto-syncs user data)
- **Request:**

  ```json
  {
    "content": "string (required)",
    "chatId": "string (uuid, required)",
    "role": "user|assistant (required)"
  }
  ```

  **Note:**

  - `userId` is automatically extracted from the authenticated user token.
  - When `role` is "user", the system automatically generates an AI assistant response using LangChain and OpenAI.

- **Response:**

  ```json
  {
    "success": true,
    "message": "Messages created successfully with AI response",
    "userMessage": {
      "id": "message-uuid",
      "content": "User's message",
      "role": "user",
      "chatId": "chat-uuid",
      "userId": "user-uuid",
      "createdAt": "2025-08-03T12:00:00.000Z"
    },
    "aiMessage": {
      "id": "message-uuid",
      "content": "AI assistant response with potential tool usage",
      "role": "assistant",
      "chatId": "chat-uuid",
      "userId": "user-uuid",
      "createdAt": "2025-08-03T12:00:01.000Z"
    }
  }
  ```

### `GET /user/messages/:id`

- **Description:** Get message by ID.
- **Authentication:** Required (`authenticatePrivy`)
- **Params:** `id` (string, uuid, required)
- **Response:** Message object

### `GET /user/chats/:chatId/messages`

- **Description:** Get all messages in a chat.
- **Authentication:** Required (`authenticatePrivy`)
- **Params:** `chatId` (string, uuid, required)
- **Response:** Array of message objects

### `GET /user/users/:userId/messages`

- **Description:** Get all messages by a user.
- **Authentication:** Required (`authenticatePrivy`)
- **Params:** `userId` (string, uuid, required)
- **Response:** Array of message objects

### `PUT /user/messages/:id`

- **Description:** Update a message.
- **Authentication:** Required (`authenticatePrivy`)
- **Params:** `id` (string, uuid, required)
- **Request:**

  ```json
  {
    "content": "string (required)"
  }
  ```

- **Response:** Updated message object

### `DELETE /user/messages/:id`

- **Description:** Delete a message.
- **Authentication:** Required (`authenticatePrivy`)
- **Params:** `id` (string, uuid, required)
- **Response:** Success message

---

## AI Integration

The API includes LangChain.js integration with OpenAI for intelligent message responses and DeFi operations.

### Available AI Tools

1. **1inch Fusion Swap Tool** (`get_swap_quote`):

   - Get real-time swap quotes and rates across multiple blockchains
   - Supports: Ethereum, Polygon, BSC, Arbitrum, Optimism, Avalanche, Gnosis, Fantom, and more
   - Get best rates for token swaps with slippage protection
   - Supports both token symbols (ETH, USDC, BNB) and contract addresses
   - Example queries:
     - "Get a quote to swap 1 ETH for USDC on Ethereum"
     - "How much MATIC would I get for 100 USDC on Polygon?"
     - "Compare swap rates for 1 BNB to USDT on BSC"

2. **Token Information Tool** (`get_token_info`):

   - Get detailed information about any token including address, symbol, name, decimals
   - Works across all supported blockchains
   - Supports both token symbols and contract addresses
   - Example queries:
     - "What is the contract address for USDC on Ethereum?"
     - "Get information about token 0x..."
     - "Show me details for MATIC token"

3. **Token Prices Tool** (`token_prices`):

   - **Real-time Prices**: Get current market prices for any token
   - **Bulk Queries**: Get prices for multiple tokens simultaneously
   - **Supported Currencies**: Check available currencies for price data
   - Supports: Ethereum, Polygon, BSC, Arbitrum, Optimism, Avalanche, and more
   - Currently supports USD pricing
   - Example queries:
     - "What's the current price of ETH and USDC?"
     - "Get prices for BTC, ETH, and MATIC on Polygon"
     - "What currencies are supported for price queries on Ethereum?"

4. **Gas Prices Tool** (`gas_prices`):

   - **Real-time Gas Prices**: Get current EIP-1559 gas prices with priority levels
   - **Cost Estimates**: Calculate transaction costs for different operation types
   - **Priority Levels**: Low, Medium, High, and Instant priority options
   - **Multi-chain Support**: Ethereum, Polygon, BSC, Arbitrum, Optimism, Avalanche, and more
   - **Transaction Types**: Simple transfers, token transfers, and DeFi operations
   - Example queries:
     - "What are the current gas prices on Ethereum?"
     - "Show me gas prices with cost estimates for Polygon"
     - "Get gas prices for Arbitrum with ETH at $3400"
     - "What's the cost to do a DeFi transaction on Ethereum right now?"

5. **Token Balances Tool** (`token_balances`):

   - **All Token Balances**: Get complete token portfolio for any wallet address
   - **Custom Token Balances**: Check specific token balances for a wallet
   - **Multiple Wallets Analysis**: Compare token holdings across multiple wallets
   - **Smart Filtering**: Automatically filters out zero balances for cleaner results
   - **Multi-chain Support**: Ethereum, Polygon, BSC, Arbitrum, Optimism, Avalanche, and more
   - **Token Recognition**: Automatically identifies common tokens by symbol
   - Example queries:
     - "Show me all token balances for wallet 0x742d35Cc6634C0532925a3b8D5C9E5E0d96B8C79"
     - "Get USDC and USDT balances for wallet 0x... on Ethereum"
     - "Compare ETH balances across these wallets: 0x..., 0x..., 0x..."
     - "What tokens does this wallet hold on Polygon with non-zero balances?"

6. **Transaction History Tool** (`transaction_history`):

   - **Complete History**: Get comprehensive transaction history for any wallet
   - **Advanced Search**: Search with multiple filter options (time, chains, transaction types)
   - **Swap History**: Dedicated swap transaction analysis
   - **Multi-chain Support**: Track transactions across all supported blockchains
   - **Transaction Details**: Includes gas fees, token actions, metadata, and 1inch-specific info
   - **Smart Formatting**: Displays recent events with relevant context and summaries
   - Example queries:
     - "Show me recent transaction history for wallet 0x742d35Cc6634C0532925a3b8D5C9E5E0d96B8C79"
     - "Get all swap transactions on Ethereum for this wallet"
     - "Search for transactions involving USDC in the last 30 days"
     - "Show me all 1inch Fusion swaps for this address"
     - "What transactions happened on Polygon between timestamps X and Y?"

7. **NFT Operations Tool** (`nft_operations`):

   - **Supported Chains**: Get list of supported chains for NFT operations
   - **NFT Collections**: Retrieve all NFTs owned by a wallet address
   - **NFT Details**: Get detailed information about specific NFTs
   - Supports: Ethereum, Polygon, Arbitrum, Avalanche, Gnosis, Klaytn, Optimism, Base
   - Providers: OpenSea, Rarible, POAP
   - Example queries:
     - "What chains support NFT operations?"
     - "Show me all NFTs owned by address 0x742d35Cc6634C0532925a3b8D5C9E5E0d96B8C79"
     - "Get details for NFT token ID 1234 on contract 0x... on Ethereum using OpenSea"

### Environment Variables Required

```env
OPENAI_API_KEY=your_openai_api_key_here
ONEINCH_API_KEY=your_1inch_api_key_here
```

**Getting API Keys:**

- **OpenAI**: Visit [OpenAI Platform](https://platform.openai.com/api-keys)
- **1inch**: Visit [1inch Developer Portal](https://portal.1inch.dev/) to get your API key

### curl Examples for AI Features

```bash
# DeFi swap quote (using test endpoint)
curl -X POST http://localhost:3000/ai/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Get a quote to swap 1 ETH for USDC on Ethereum with 0.5% slippage from wallet 0x742d35Cc6634C0532925a3b8D5C9E5E0d96B8C79"
  }'

# Token prices
curl -X POST http://localhost:3000/ai/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the current prices of ETH, USDC, and BTC on Ethereum?"
  }'

# Multiple chain price comparison
curl -X POST http://localhost:3000/ai/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Get MATIC price on Polygon and ETH price on Ethereum"
  }'

# Supported currencies
curl -X POST http://localhost:3000/ai/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What currencies are supported for price queries on Ethereum?"
  }'

# Token information
curl -X POST http://localhost:3000/ai/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the contract address and decimals for USDC on Polygon?"
  }'

# Gas prices
curl -X POST http://localhost:3000/ai/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the current gas prices on Ethereum?"
  }'

# Gas prices with cost estimates
curl -X POST http://localhost:3000/ai/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me gas prices with cost estimates for Polygon assuming ETH is at $3400"
  }'

# Multi-chain gas comparison
curl -X POST http://localhost:3000/ai/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Compare gas prices between Ethereum and Arbitrum"
  }'

# Token balances - all tokens
curl -X POST http://localhost:3000/ai/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me all token balances for wallet 0x742d35Cc6634C0532925a3b8D5C9E5E0d96B8C79 on Ethereum"
  }'

# Token balances - specific tokens
curl -X POST http://localhost:3000/ai/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Get USDC and USDT balances for wallet 0x742d35Cc6634C0532925a3b8D5C9E5E0d96B8C79"
  }'

# Token balances - multiple wallets
curl -X POST http://localhost:3000/ai/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Compare USDC balances for these wallets: 0x742d35Cc6634C0532925a3b8D5C9E5E0d96B8C79, 0x8ba1f109551bD432803012645Hac136c"
  }'

# Transaction history - recent events
curl -X POST http://localhost:3000/ai/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me recent transaction history for wallet 0x742d35Cc6634C0532925a3b8D5C9E5E0d96B8C79"
  }'

# Transaction history - swap events only
curl -X POST http://localhost:3000/ai/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Get all swap transactions on Ethereum for wallet 0x742d35Cc6634C0532925a3b8D5C9E5E0d96B8C79"
  }'

# Transaction history - filtered search
curl -X POST http://localhost:3000/ai/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Search for USDC transactions on Ethereum for wallet 0x742d35Cc6634C0532925a3b8D5C9E5E0d96B8C79 in the last 7 days"
  }'

# NFT operations
curl -X POST http://localhost:3000/ai/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me all NFTs owned by 0x742d35Cc6634C0532925a3b8D5C9E5E0d96B8C79 on Ethereum"
  }'

# Using authenticated endpoints
curl -X POST http://localhost:3000/user/messages \
  -H "Authorization: Bearer <your_privy_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Get current prices for ETH and USDC, then show me swap rate between them",
    "chatId": "chat-uuid",
    "role": "user"
  }'
```

curl -X POST http://localhost:3000/user/messages \
 -H "Authorization: Bearer <your_privy_token>" \
 -H "Content-Type: application/json" \
 -d '{
"content": "What would be the best rate to swap 100 USDC for DAI?",
"chatId": "chat-uuid",
"role": "user"
}'

```

---
```
