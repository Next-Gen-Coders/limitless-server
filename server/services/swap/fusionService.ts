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
  quoteId?: string;
  preset?: PresetEnum;
}

export interface SwapQuoteResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface SwapExecuteResponse {
  success: boolean;
  data?: {
    orderHash: string;
    secrets: string[];
    secretHashes: string[];
    quote: any;
  };
  error?: string;
}

export class FusionSwapService {
  private sdk: SDK;
  private web3: any;

  constructor() {
    if (!ENV.ONEINCH_API_KEY) {
      throw new Error(
        "Missing ONEINCH_API_KEY environment variable for 1inch Fusion SDK"
      );
    }

    // For quotes-only mode, we can use a dummy RPC and private key
    const rpcUrl = ENV.RPC_URL || "https://eth.llamarpc.com"; // Free public RPC
    const privateKey =
      ENV.PRIVATE_KEY ||
      "0x0000000000000000000000000000000000000000000000000000000000000001"; // Dummy key for quotes

    this.web3 = new Web3(rpcUrl) as unknown as any;
    this.sdk = new SDK({
      url: "https://api.1inch.dev/fusion-plus",
      authKey: ENV.ONEINCH_API_KEY,
      blockchainProvider: new PrivateKeyProviderConnector(
        privateKey,
        this.web3
      ),
    });
  }

  async getSwapQuote(request: SwapQuoteRequest): Promise<SwapQuoteResponse> {
    try {
      console.log("Getting swap quote for:", request);

      const quote = await this.sdk.getQuote({
        amount: request.amount,
        srcChainId: request.srcChainId,
        dstChainId: request.dstChainId,
        enableEstimate: true,
        srcTokenAddress: request.srcTokenAddress,
        dstTokenAddress: request.dstTokenAddress,
        walletAddress: request.walletAddress,
      });

      console.log("Quote received:", { quoteId: quote.quoteId });

      return {
        success: true,
        data: quote,
        error: undefined,
      };
    } catch (error: any) {
      console.error("Fusion quote error:", error);
      return {
        success: false,
        data: undefined,
        error: error.message,
      };
    }
  }

  async executeSwap(request: SwapExecuteRequest): Promise<SwapExecuteResponse> {
    try {
      console.log("Preparing swap data for user execution:", request);

      // Check if this is a quotes-only setup (no real private key)
      const isQuotesOnly =
        !ENV.PRIVATE_KEY ||
        ENV.PRIVATE_KEY ===
          "0x0000000000000000000000000000000000000000000000000000000000000001";

      if (isQuotesOnly) {
        // For user-side execution, just return the quote data
        const quote = await this.sdk.getQuote({
          amount: request.amount,
          srcChainId: request.srcChainId,
          dstChainId: request.dstChainId,
          enableEstimate: true,
          srcTokenAddress: request.srcTokenAddress,
          dstTokenAddress: request.dstTokenAddress,
          walletAddress: request.walletAddress,
        });

        console.log("Quote prepared for user execution:", quote.quoteId);

        return {
          success: true,
          data: {
            orderHash: "user-will-execute", // Placeholder - user will execute via frontend
            secrets: [],
            secretHashes: [],
            quote,
          },
          error: undefined,
        };
      }

      // Server-side execution (if real private key is provided)
      const quote = await this.sdk.getQuote({
        amount: request.amount,
        srcChainId: request.srcChainId,
        dstChainId: request.dstChainId,
        enableEstimate: true,
        srcTokenAddress: request.srcTokenAddress,
        dstTokenAddress: request.dstTokenAddress,
        walletAddress: request.walletAddress,
      });

      const preset = request.preset || PresetEnum.fast;

      // Generate secrets
      const secrets = Array.from({
        length: quote.presets[preset]?.secretsCount || 1,
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

      console.log("Order placed successfully:", orderHash);

      return {
        success: true,
        data: {
          orderHash,
          secrets,
          secretHashes,
          quote,
        },
        error: undefined,
      };
    } catch (error: any) {
      console.error("Fusion execute error:", error);
      return {
        success: false,
        data: undefined,
        error: error.message,
      };
    }
  }

  async monitorOrder(orderHash: string, secrets: string[]) {
    try {
      console.log(`Monitoring order: ${orderHash}`);

      const order = await this.sdk.getOrderStatus(orderHash);

      if (order.status === "executed") {
        console.log(`Order ${orderHash} executed successfully`);
        return { status: "completed", order };
      }

      const fillsObject = await this.sdk.getReadyToAcceptSecretFills(orderHash);

      if (fillsObject.fills.length > 0) {
        console.log(
          `Found ${fillsObject.fills.length} fills for order ${orderHash}`
        );

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

  async getOrderStatus(orderHash: string) {
    try {
      const order = await this.sdk.getOrderStatus(orderHash);
      return { success: true, data: order };
    } catch (error: any) {
      console.error("Error getting order status:", error);
      return { success: false, error: error.message };
    }
  }
}
