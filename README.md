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

- **Description:** Create a new message.
- **Authentication:** Required (`authenticateAndSync` - auto-syncs user data)
- **Request:**

  ```json
  {
    "content": "string (required)",
    "chatId": "string (uuid, required)",
    "role": "user|assistant (required)"
  }
  ```

  **Note:** `userId` is automatically extracted from the authenticated user token.

- **Response:** Message object

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
