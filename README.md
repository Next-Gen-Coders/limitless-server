# API Documentation

## Health

### `GET /service/health`

- **Description:** Health check endpoint.
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

## User

### `POST /user/sync`

- **Description:** Sync user with Privy.
- **Request:**

  ```json
  {
    "privyId": "string (required)",
    "email": "string (optional, email)",
    "walletAddress": "string (optional)",
    "linkedAccounts": [ ... ] (optional)
  }
  ```

  **Response:**

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
- **Params:** `privyId` (string, required)
  **Response:**

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
- **Request:**

  ```json
  {
    "title": "string (required)",
    "userId": "string (uuid, required)"
  }
  ```

- **Response:** Chat object

### `GET /user/chats/:id`

- **Description:** Get chat by ID.
- **Params:** `id` (string, uuid, required)
- **Response:** Chat object

### `GET /user/users/:userId/chats`

- **Description:** Get all chats for a user.
- **Params:** `userId` (string, uuid, required)
- **Response:** Array of chat objects

### `PUT /user/chats/:id`

- **Description:** Update a chat.
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
- **Params:** `id` (string, uuid, required)
- **Response:** Success message

---

## Messages

### `POST /user/messages`

- **Description:** Create a new message.
- **Request:**

  ```json
  {
    "content": "string (required)",
    "chatId": "string (uuid, required)",
    "userId": "string (uuid, required)",
    "role": "user|assistant (required)"
  }
  ```

- **Response:** Message object

### `GET /user/messages/:id`

- **Description:** Get message by ID.
- **Params:** `id` (string, uuid, required)
- **Response:** Message object

### `GET /user/chats/:chatId/messages`

- **Description:** Get all messages in a chat.
- **Params:** `chatId` (string, uuid, required)
- **Response:** Array of message objects

### `GET /user/users/:userId/messages`

- **Description:** Get all messages by a user.
- **Params:** `userId` (string, uuid, required)
- **Response:** Array of message objects

### `PUT /user/messages/:id`

- **Description:** Update a message.
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
- **Params:** `id` (string, uuid, required)
- **Response:** Success message

---
