# 1inch Cross-Chain Swap Implementation with AI Integration

## Overview

This document outlines the implementation of 1inch Fusion cross-chain swap functionality integrated with AI capabilities, allowing users to swap tokens directly through chat interactions with transaction signing.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │───▶│ Express Server  │───▶│  1inch Fusion   │
│                 │    │                 │    │     API         │
│ - Chat UI       │    │ - AI Service    │    │                 │
│ - Wallet        │    │ - Swap Service  │    │                 │
│ - Signing       │    │ - Controllers   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Step-by-Step Implementation Plan

### Phase 1: Backend Setup - Database Schema Extension

#### 1.1 Extend Database Schema for Swap Transactions

**File: `server/db/schema.ts`**

Add new tables for tracking swap transactions:

```typescript
// Add to existing schema.ts
export const swapTransactions = pgTable(
  "swap_transactions",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    chatId: uuid("chat_id").references(() => chats.id),
    messageId: uuid("message_id").references(() => messages.id),

    // Swap Details
    srcChainId: integer("src_chain_id").notNull(),
    dstChainId: integer("dst_chain_id").notNull(),
    srcTokenAddress: text("src_token_address").notNull(),
    dstTokenAddress: text("dst_token_address").notNull(),
    amount: text("amount").notNull(), // Store as string to handle big numbers

    // 1inch specific
    quoteId: text("quote_id"),
    orderHash: text("order_hash"),

    // Transaction Status
    status: text("status").notNull().default("pending"), // pending, processing, completed, failed

    // Metadata
    walletAddress: text("wallet_address").notNull(),
    quote: jsonb("quote"), // Store full quote response
    secrets: jsonb("secrets"), // Store secrets for order execution
    secretHashes: jsonb("secret_hashes"),
    errorDetails: jsonb("error_details"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdIndex: index("idx_swap_transactions_user_id").on(table.userId),
    orderHashIndex: index("idx_swap_transactions_order_hash").on(
      table.orderHash
    ),
    statusIndex: index("idx_swap_transactions_status").on(table.status),
  })
);

// Schema types
export const insertSwapTransactionSchema = createInsertSchema(swapTransactions);
export const selectSwapTransactionSchema = createSelectSchema(swapTransactions);
export type InsertSwapTransaction = typeof swapTransactions.$inferInsert;
export type SelectSwapTransaction = typeof swapTransactions.$inferSelect;
```

#### 1.2 Create Database Migration

```bash
npm run db:generate
npm run db:push
```

### Phase 2: Backend Services Implementation

#### 2.1 1inch Fusion SDK Service

**File: `server/services/swap/fusionService.ts`**

```typescript
import {
  SDK,
  NetworkEnum,
  PresetEnum,
  PrivateKeyProviderConnector,
  HashLock,
} from "@1inch/cross-chain-sdk";
import Web3 from "web3";
import { randomBytes } from "crypto";
import { ENV } from "../../config/env";

export interface SwapQuoteRequest {
  amount: string;
  srcChainId: number;
  dstChainId: number;
  srcTokenAddress: string;
  dstTokenAddress: string;
  walletAddress: string;
}

export interface SwapExecuteRequest extends SwapQuoteRequest {
  quoteId: string;
  preset?: PresetEnum;
}

export class FusionSwapService {
  private sdk: SDK;
  private web3: any;

  constructor() {
    this.web3 = new Web3(ENV.RPC_URL);
    this.sdk = new SDK({
      url: "https://api.1inch.dev/fusion-plus",
      authKey: ENV.ONEINCH_API_KEY,
      blockchainProvider: new PrivateKeyProviderConnector(
        ENV.PRIVATE_KEY,
        this.web3
      ),
    });
  }

  async getSwapQuote(request: SwapQuoteRequest) {
    try {
      const quote = await this.sdk.getQuote({
        amount: request.amount,
        srcChainId: request.srcChainId as NetworkEnum,
        dstChainId: request.dstChainId as NetworkEnum,
        enableEstimate: true,
        srcTokenAddress: request.srcTokenAddress,
        dstTokenAddress: request.dstTokenAddress,
        walletAddress: request.walletAddress,
      });

      return {
        success: true,
        data: quote,
        error: null,
      };
    } catch (error: any) {
      console.error("Fusion quote error:", error);
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  async executeSwap(request: SwapExecuteRequest) {
    try {
      const quote = await this.sdk.getQuote({
        amount: request.amount,
        srcChainId: request.srcChainId as NetworkEnum,
        dstChainId: request.dstChainId as NetworkEnum,
        enableEstimate: true,
        srcTokenAddress: request.srcTokenAddress,
        dstTokenAddress: request.dstTokenAddress,
        walletAddress: request.walletAddress,
      });

      const preset = request.preset || PresetEnum.fast;

      // Generate secrets
      const secrets = Array.from({
        length: quote.presets[preset].secretsCount,
      }).map(() => "0x" + randomBytes(32).toString("hex"));

      const secretHashes = secrets.map((s) => HashLock.hashSecret(s));
      const hashLock =
        secrets.length === 1
          ? HashLock.forSingleFill(secrets[0])
          : HashLock.forMultipleFills(HashLock.getMerkleLeaves(secrets));

      const { orderHash } = await this.sdk.placeOrder(quote, {
        walletAddress: request.walletAddress,
        hashLock,
        secretHashes,
        preset,
        source: "limitless-ai",
      });

      return {
        success: true,
        data: {
          orderHash,
          secrets,
          secretHashes,
          quote,
        },
        error: null,
      };
    } catch (error: any) {
      console.error("Fusion execute error:", error);
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  async monitorOrder(orderHash: string, secrets: string[]) {
    try {
      const order = await this.sdk.getOrderStatus(orderHash);

      if (order.status === "executed") {
        return { status: "completed", order };
      }

      const fillsObject = await this.sdk.getReadyToAcceptSecretFills(orderHash);

      if (fillsObject.fills.length > 0) {
        for (const fill of fillsObject.fills) {
          try {
            await this.sdk.submitSecret(orderHash, secrets[fill.idx]);
            console.log(`Secret submitted for fill index ${fill.idx}`);
          } catch (error: any) {
            console.error(`Error submitting secret: ${error.message}`);
          }
        }
      }

      return { status: "processing", order };
    } catch (error: any) {
      console.error("Order monitoring error:", error);
      return { status: "error", error: error.message };
    }
  }
}
```

#### 2.2 Swap Tool for AI

**File: `server/services/ai/tools/swapTool.ts`**

```typescript
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { FusionSwapService } from "../swap/fusionService";

const fusionService = new FusionSwapService();

export const swapTool = new DynamicStructuredTool({
  name: "cross_chain_swap",
  description:
    "Get quotes and execute cross-chain token swaps using 1inch Fusion",
  schema: z.object({
    operation: z
      .enum(["get_quote", "prepare_swap"])
      .describe(
        "Operation: 'get_quote' for quotes, 'prepare_swap' for swap preparation"
      ),
    amount: z.string().describe("Amount to swap (in wei/smallest unit)"),
    srcChainId: z
      .number()
      .describe("Source chain ID (1=Ethereum, 137=Polygon, etc.)"),
    dstChainId: z.number().describe("Destination chain ID"),
    srcTokenAddress: z.string().describe("Source token contract address"),
    dstTokenAddress: z.string().describe("Destination token contract address"),
    walletAddress: z.string().describe("User's wallet address"),
  }),
  func: async ({
    operation,
    amount,
    srcChainId,
    dstChainId,
    srcTokenAddress,
    dstTokenAddress,
    walletAddress,
  }) => {
    try {
      if (operation === "get_quote") {
        const result = await fusionService.getSwapQuote({
          amount,
          srcChainId,
          dstChainId,
          srcTokenAddress,
          dstTokenAddress,
          walletAddress,
        });

        if (!result.success) {
          return `Error getting swap quote: ${result.error}`;
        }

        const quote = result.data;
        return `
🔄 **Cross-Chain Swap Quote**

**From:** ${srcChainId === 1 ? "Ethereum" : `Chain ${srcChainId}`}
**To:** ${dstChainId === 1 ? "Ethereum" : `Chain ${dstChainId}`}
**Amount:** ${amount}
**Estimated Output:** ${quote.estimate}
**Quote ID:** ${quote.quoteId}

💡 **Ready to execute?** Confirm this swap to proceed with the transaction.
        `;
      }

      return "Swap preparation completed. Please use the frontend to sign the transaction.";
    } catch (error: any) {
      return `Error in swap operation: ${error.message}`;
    }
  },
});
```

#### 2.3 Add Swap Tool to Tools Index

**File: `server/services/ai/tools/index.ts`**

```typescript
// Add to existing imports
import { swapTool } from "./swapTool";

// Add to availableTools array
export const availableTools = [
  tokenInfoTool,
  nftTool,
  priceTool,
  gasPriceTool,
  balanceTool,
  historyTool,
  chartTool,
  domainsTool,
  swapTool, // Add this line
];

// Add to exports
export { swapTool };

// Add to toolRegistry
export const toolRegistry = {
  get_token_info: tokenInfoTool.func,
  nft_operations: nftTool.func,
  token_prices: priceTool.func,
  gas_prices: gasPriceTool.func,
  token_balances: balanceTool.func,
  transaction_history: historyTool.func,
  chart_data: chartTool.func,
  domain_operations: domainsTool.func,
  cross_chain_swap: swapTool.func, // Add this line
} as const;
```

#### 2.4 Swap Controllers

**File: `server/controllers/swap.ts`**

```typescript
import { RequestHandler } from "express";
import { FusionSwapService } from "../services/swap/fusionService";
import { db } from "../db";
import { swapTransactions } from "../db/schema";
import * as ResponseHelper from "../utils/responseHelper";
import { randomUUID } from "crypto";

const fusionService = new FusionSwapService();

export const getSwapQuoteController: RequestHandler = async (req, res) => {
  try {
    const { amount, srcChainId, dstChainId, srcTokenAddress, dstTokenAddress } =
      req.body;
    const walletAddress = req.user?.walletAddress;

    if (!walletAddress) {
      ResponseHelper.notAuthorized(res, "Wallet address required");
      return;
    }

    const result = await fusionService.getSwapQuote({
      amount,
      srcChainId,
      dstChainId,
      srcTokenAddress,
      dstTokenAddress,
      walletAddress,
    });

    if (!result.success) {
      ResponseHelper.badRequest(res, result.error, "Quote failed");
      return;
    }

    ResponseHelper.success(res, result.data, "Quote generated successfully");
  } catch (error: any) {
    ResponseHelper.error(res, error.message, "Internal server error");
  }
};

export const executeSwapController: RequestHandler = async (req, res) => {
  try {
    const {
      amount,
      srcChainId,
      dstChainId,
      srcTokenAddress,
      dstTokenAddress,
      chatId,
      messageId,
    } = req.body;

    const userId = req.user?.id;
    const walletAddress = req.user?.walletAddress;

    if (!userId || !walletAddress) {
      ResponseHelper.notAuthorized(res, "User authentication required");
      return;
    }

    // Create swap transaction record
    const swapId = randomUUID();
    await db.insert(swapTransactions).values({
      id: swapId,
      userId,
      chatId,
      messageId,
      srcChainId,
      dstChainId,
      srcTokenAddress,
      dstTokenAddress,
      amount,
      walletAddress,
      status: "pending",
    });

    const result = await fusionService.executeSwap({
      amount,
      srcChainId,
      dstChainId,
      srcTokenAddress,
      dstTokenAddress,
      walletAddress,
    });

    if (!result.success) {
      // Update transaction status
      await db
        .update(swapTransactions)
        .set({
          status: "failed",
          errorDetails: { error: result.error },
          updatedAt: new Date(),
        })
        .where(eq(swapTransactions.id, swapId));

      ResponseHelper.badRequest(res, result.error, "Swap execution failed");
      return;
    }

    // Update transaction with order details
    await db
      .update(swapTransactions)
      .set({
        orderHash: result.data.orderHash,
        quote: result.data.quote,
        secrets: result.data.secrets,
        secretHashes: result.data.secretHashes,
        status: "processing",
        updatedAt: new Date(),
      })
      .where(eq(swapTransactions.id, swapId));

    // Start monitoring the order
    monitorOrderAsync(result.data.orderHash, result.data.secrets, swapId);

    ResponseHelper.success(
      res,
      {
        swapId,
        orderHash: result.data.orderHash,
      },
      "Swap initiated successfully"
    );
  } catch (error: any) {
    ResponseHelper.error(res, error.message, "Internal server error");
  }
};

// Background monitoring function
async function monitorOrderAsync(
  orderHash: string,
  secrets: string[],
  swapId: string
) {
  const maxAttempts = 60; // 5 minutes of monitoring
  let attempts = 0;

  const monitor = setInterval(async () => {
    try {
      attempts++;
      const result = await fusionService.monitorOrder(orderHash, secrets);

      if (result.status === "completed") {
        await db
          .update(swapTransactions)
          .set({
            status: "completed",
            updatedAt: new Date(),
          })
          .where(eq(swapTransactions.id, swapId));

        clearInterval(monitor);
        console.log(`Swap ${swapId} completed successfully`);
      } else if (result.status === "error" || attempts >= maxAttempts) {
        await db
          .update(swapTransactions)
          .set({
            status: "failed",
            errorDetails: { error: result.error || "Monitoring timeout" },
            updatedAt: new Date(),
          })
          .where(eq(swapTransactions.id, swapId));

        clearInterval(monitor);
        console.log(`Swap ${swapId} failed or timed out`);
      }
    } catch (error) {
      console.error(`Error monitoring swap ${swapId}:`, error);
    }
  }, 5000); // Check every 5 seconds
}

export const getSwapStatusController: RequestHandler = async (req, res) => {
  try {
    const { swapId } = req.params;
    const userId = req.user?.id;

    const swap = await db
      .select()
      .from(swapTransactions)
      .where(
        eq(swapTransactions.id, swapId) && eq(swapTransactions.userId, userId)
      );

    if (!swap.length) {
      ResponseHelper.notFound(res, "Swap transaction not found");
      return;
    }

    ResponseHelper.success(res, swap[0], "Swap status retrieved");
  } catch (error: any) {
    ResponseHelper.error(res, error.message, "Internal server error");
  }
};
```

#### 2.5 Swap Routes

**File: `server/routes/swap.ts`**

```typescript
import express from "express";
import * as swapController from "../controllers/swap";
import { authenticatePrivy } from "../middleware/auth";

const router = express.Router();

// Protected swap routes
router.post("/quote", authenticatePrivy, swapController.getSwapQuoteController);
router.post(
  "/execute",
  authenticatePrivy,
  swapController.executeSwapController
);
router.get(
  "/status/:swapId",
  authenticatePrivy,
  swapController.getSwapStatusController
);

export default router;
```

#### 2.6 Update Main Server

**File: `server/server.ts`**

```typescript
// Add to existing imports
import swapRoutes from "./routes/swap";

// Add route after existing routes
app.use("/swap", swapRoutes);
```

### Phase 3: Environment Configuration

#### 3.1 Update Environment Variables

**File: `.env`**

```env
# Existing variables...

# 1inch Fusion SDK
ONEINCH_API_KEY=your_1inch_api_key
PRIVATE_KEY=your_private_key_for_server_wallet
RPC_URL=your_rpc_url

# Cross-chain networks
ETHEREUM_RPC=https://eth-mainnet.g.alchemy.com/v2/your-key
POLYGON_RPC=https://polygon-mainnet.g.alchemy.com/v2/your-key
ARBITRUM_RPC=https://arb-mainnet.g.alchemy.com/v2/your-key
```

#### 3.2 Install Dependencies

**File: `package.json`**

```json
{
  "dependencies": {
    // Existing dependencies...
    "@1inch/cross-chain-sdk": "^1.0.0",
    "web3": "^4.0.0"
  }
}
```

```bash
npm install @1inch/cross-chain-sdk web3
```

### Phase 4: Frontend Implementation

#### 4.1 React Components Structure

```
client-integration/
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   │   ├── MessageList.tsx
│   │   ├── SwapConfirmation.tsx
│   │   └── TransactionStatus.tsx
│   ├── wallet/
│   │   ├── WalletConnection.tsx
│   │   └── SwapModal.tsx
│   └── swap/
│       ├── SwapQuote.tsx
│       ├── SwapExecution.tsx
│       └── SwapHistory.tsx
├── hooks/
│   ├── useChat.ts
│   ├── useSwap.ts
│   ├── useWallet.ts
│   └── useTransactionStatus.ts
├── services/
│   ├── api.ts
│   ├── walletService.ts
│   └── swapService.ts
└── types/
    ├── chat.ts
    ├── swap.ts
    └── wallet.ts
```

#### 4.2 Swap Service

**File: `client-integration/services/swapService.ts`**

```typescript
import { ethers } from "ethers";

export interface SwapQuoteRequest {
  amount: string;
  srcChainId: number;
  dstChainId: number;
  srcTokenAddress: string;
  dstTokenAddress: string;
}

export interface SwapExecuteRequest extends SwapQuoteRequest {
  chatId?: string;
  messageId?: string;
}

export class SwapService {
  private baseUrl: string;
  private authToken: string;

  constructor(baseUrl: string, authToken: string) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  async getQuote(request: SwapQuoteRequest) {
    const response = await fetch(`${this.baseUrl}/swap/quote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.authToken}`,
      },
      body: JSON.stringify(request),
    });

    return response.json();
  }

  async executeSwap(request: SwapExecuteRequest) {
    const response = await fetch(`${this.baseUrl}/swap/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.authToken}`,
      },
      body: JSON.stringify(request),
    });

    return response.json();
  }

  async getSwapStatus(swapId: string) {
    const response = await fetch(`${this.baseUrl}/swap/status/${swapId}`, {
      headers: {
        Authorization: `Bearer ${this.authToken}`,
      },
    });

    return response.json();
  }
}
```

#### 4.3 Swap Hook

**File: `client-integration/hooks/useSwap.ts`**

```typescript
import { useState, useCallback } from "react";
import { useWallet } from "./useWallet";
import { SwapService } from "../services/swapService";

export interface SwapQuote {
  amount: string;
  estimatedOutput: string;
  quoteId: string;
  srcToken: string;
  dstToken: string;
  srcChainId: number;
  dstChainId: number;
}

export const useSwap = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { wallet, signTransaction } = useWallet();

  const swapService = new SwapService(
    process.env.REACT_APP_API_URL || "http://localhost:3000",
    wallet?.authToken || ""
  );

  const getQuote = useCallback(
    async (params: {
      amount: string;
      srcChainId: number;
      dstChainId: number;
      srcTokenAddress: string;
      dstTokenAddress: string;
    }) => {
      if (!wallet?.address) {
        setError("Wallet not connected");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await swapService.getQuote({
          ...params,
        });

        if (result.success) {
          setQuote(result.data);
        } else {
          setError(result.message);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [wallet, swapService]
  );

  const executeSwap = useCallback(
    async (params: {
      amount: string;
      srcChainId: number;
      dstChainId: number;
      srcTokenAddress: string;
      dstTokenAddress: string;
      chatId?: string;
      messageId?: string;
    }) => {
      if (!wallet?.address) {
        setError("Wallet not connected");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Execute the swap
        const result = await swapService.executeSwap(params);

        if (result.success) {
          return result.data;
        } else {
          setError(result.message);
          return null;
        }
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [wallet, swapService]
  );

  return {
    isLoading,
    quote,
    error,
    getQuote,
    executeSwap,
    clearQuote: () => setQuote(null),
    clearError: () => setError(null),
  };
};
```

#### 4.4 Swap Confirmation Component

**File: `client-integration/components/chat/SwapConfirmation.tsx`**

```typescript
import React, { useState } from "react";
import { useSwap } from "../../hooks/useSwap";

interface SwapConfirmationProps {
  swapData: {
    amount: string;
    srcChainId: number;
    dstChainId: number;
    srcTokenAddress: string;
    dstTokenAddress: string;
    srcTokenSymbol: string;
    dstTokenSymbol: string;
  };
  chatId: string;
  messageId: string;
  onConfirm: (swapId: string) => void;
  onCancel: () => void;
}

export const SwapConfirmation: React.FC<SwapConfirmationProps> = ({
  swapData,
  chatId,
  messageId,
  onConfirm,
  onCancel,
}) => {
  const { quote, isLoading, error, getQuote, executeSwap } = useSwap();
  const [isExecuting, setIsExecuting] = useState(false);

  React.useEffect(() => {
    getQuote(swapData);
  }, [swapData, getQuote]);

  const handleConfirm = async () => {
    setIsExecuting(true);

    try {
      const result = await executeSwap({
        ...swapData,
        chatId,
        messageId,
      });

      if (result?.swapId) {
        onConfirm(result.swapId);
      }
    } catch (err) {
      console.error("Swap execution failed:", err);
    } finally {
      setIsExecuting(false);
    }
  };

  if (isLoading) {
    return <div className="swap-loading">Getting quote...</div>;
  }

  if (error) {
    return (
      <div className="swap-error">
        <p>Error: {error}</p>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  }

  if (!quote) {
    return null;
  }

  return (
    <div className="swap-confirmation">
      <h3>🔄 Confirm Cross-Chain Swap</h3>

      <div className="swap-details">
        <div className="swap-from">
          <strong>From:</strong> {swapData.amount} {swapData.srcTokenSymbol}
          <br />
          <small>Chain: {getChainName(swapData.srcChainId)}</small>
        </div>

        <div className="swap-arrow">↓</div>

        <div className="swap-to">
          <strong>To:</strong> ~{quote.estimatedOutput}{" "}
          {swapData.dstTokenSymbol}
          <br />
          <small>Chain: {getChainName(swapData.dstChainId)}</small>
        </div>
      </div>

      <div className="swap-actions">
        <button
          onClick={handleConfirm}
          disabled={isExecuting}
          className="confirm-button"
        >
          {isExecuting ? "Processing..." : "Confirm Swap"}
        </button>
        <button onClick={onCancel} className="cancel-button">
          Cancel
        </button>
      </div>
    </div>
  );
};

function getChainName(chainId: number): string {
  const chains: Record<number, string> = {
    1: "Ethereum",
    137: "Polygon",
    42161: "Arbitrum",
    10: "Optimism",
    56: "BSC",
  };
  return chains[chainId] || `Chain ${chainId}`;
}
```

#### 4.5 Enhanced Chat Interface

**File: `client-integration/components/chat/ChatInterface.tsx`**

```typescript
import React, { useState, useEffect } from "react";
import { MessageList } from "./MessageList";
import { SwapConfirmation } from "./SwapConfirmation";
import { TransactionStatus } from "./TransactionStatus";
import { useChat } from "../../hooks/useChat";

export const ChatInterface: React.FC = () => {
  const [swapPending, setSwapPending] = useState<any>(null);
  const [activeSwapId, setActiveSwapId] = useState<string | null>(null);
  const { messages, sendMessage, isLoading } = useChat();

  const handleMessage = async (content: string) => {
    const response = await sendMessage(content);

    // Check if AI response includes swap suggestion
    if (response?.toolsUsed?.includes("cross_chain_swap")) {
      // Extract swap parameters from AI response
      const swapData = extractSwapData(response.content);
      if (swapData) {
        setSwapPending(swapData);
      }
    }
  };

  const handleSwapConfirm = (swapId: string) => {
    setActiveSwapId(swapId);
    setSwapPending(null);
  };

  const handleSwapCancel = () => {
    setSwapPending(null);
  };

  return (
    <div className="chat-interface">
      <MessageList messages={messages} />

      {swapPending && (
        <SwapConfirmation
          swapData={swapPending}
          chatId={messages[0]?.chatId || ""}
          messageId={messages[messages.length - 1]?.id || ""}
          onConfirm={handleSwapConfirm}
          onCancel={handleSwapCancel}
        />
      )}

      {activeSwapId && (
        <TransactionStatus
          swapId={activeSwapId}
          onComplete={() => setActiveSwapId(null)}
        />
      )}

      <div className="message-input">
        <input
          type="text"
          placeholder="Ask me anything about DeFi, or say 'swap 1 ETH to USDC on Polygon'"
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleMessage((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = "";
            }
          }}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

function extractSwapData(content: string): any {
  // Parse AI response to extract swap parameters
  // This would need to be implemented based on your AI response format
  const swapRegex = /swap (\d+\.?\d*) (\w+) (?:to|for) (\w+)(?: on (\w+))?/i;
  const match = content.match(swapRegex);

  if (match) {
    return {
      amount: match[1],
      srcTokenSymbol: match[2],
      dstTokenSymbol: match[3],
      dstChain: match[4] || "ethereum",
    };
  }

  return null;
}
```

### Phase 5: Integration Testing

#### 5.1 Test Cases

1. **Quote Generation**

   ```
   Test: "Get quote for swapping 1 ETH to USDC on Polygon"
   Expected: AI returns formatted quote with swap details
   ```

2. **Swap Execution**

   ```
   Test: User confirms swap from quote
   Expected: Transaction initiated, monitoring started
   ```

3. **Status Monitoring**
   ```
   Test: Check swap status during execution
   Expected: Real-time updates until completion
   ```

#### 5.2 Error Handling

1. **Insufficient Balance**
2. **Network Connectivity Issues**
3. **1inch API Errors**
4. **Transaction Failures**

### Phase 6: Security Considerations

#### 6.1 Server-Side Security

1. **Private Key Management**: Use secure key storage (AWS KMS, HashiCorp Vault)
2. **Rate Limiting**: Implement swap rate limits per user
3. **Input Validation**: Validate all swap parameters
4. **Transaction Limits**: Set maximum swap amounts

#### 6.2 Client-Side Security

1. **Wallet Integration**: Use secure wallet connectors
2. **Transaction Verification**: Show clear transaction details
3. **User Confirmation**: Require explicit user approval

### Phase 7: Deployment

#### 7.1 Environment Setup

1. **Development**: Local testing with testnets
2. **Staging**: Full mainnet testing with small amounts
3. **Production**: Full deployment with monitoring

#### 7.2 Monitoring

1. **Transaction Monitoring**: Track all swap executions
2. **Error Logging**: Comprehensive error tracking
3. **Performance Metrics**: API response times, success rates

## Usage Flow

### User Experience Flow

1. **User Input**: "Swap 1 ETH to USDC on Polygon"
2. **AI Processing**: AI uses swap tool to get quote
3. **Quote Display**: AI shows formatted quote to user
4. **User Confirmation**: User clicks "Confirm Swap"
5. **Transaction**: Backend initiates 1inch Fusion swap
6. **Monitoring**: System monitors transaction progress
7. **Completion**: User notified when swap completes

### Technical Flow

1. **Message → AI Service**: User message processed by LangChain
2. **AI → Swap Tool**: AI calls swap tool with parsed parameters
3. **Swap Tool → 1inch**: Tool calls 1inch Fusion SDK
4. **Quote Return**: Quote data flows back through chain
5. **User Confirmation**: Frontend shows SwapConfirmation component
6. **Execute API**: Frontend calls /swap/execute endpoint
7. **Database Record**: Transaction stored in swapTransactions table
8. **Background Monitor**: Order monitoring starts
9. **Status Updates**: Real-time status updates to frontend

This implementation provides a complete end-to-end solution for AI-powered cross-chain swaps with user-friendly interfaces and robust error handling.
