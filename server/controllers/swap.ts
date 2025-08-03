import { RequestHandler } from "express";
import { FusionSwapService } from "../services/swap/fusionService";
import { db } from "../db";
import { swapTransactions } from "../db/schema";
import { eq } from "drizzle-orm";
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

    if (
      !amount ||
      !srcChainId ||
      !dstChainId ||
      !srcTokenAddress ||
      !dstTokenAddress
    ) {
      ResponseHelper.badRequest(
        res,
        "Missing required parameters",
        "Invalid request"
      );
      return;
    }

    const result = await fusionService.getSwapQuote({
      amount,
      srcChainId: parseInt(srcChainId),
      dstChainId: parseInt(dstChainId),
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
    console.error("Error in getSwapQuoteController:", error);
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

    if (
      !amount ||
      !srcChainId ||
      !dstChainId ||
      !srcTokenAddress ||
      !dstTokenAddress
    ) {
      ResponseHelper.badRequest(
        res,
        "Missing required parameters",
        "Invalid request"
      );
      return;
    }

    // Create swap transaction record
    const swapId = randomUUID();
    await db.insert(swapTransactions).values({
      id: swapId,
      userId,
      chatId: chatId || null,
      messageId: messageId || null,
      srcChainId: parseInt(srcChainId),
      dstChainId: parseInt(dstChainId),
      srcTokenAddress,
      dstTokenAddress,
      amount,
      walletAddress,
      status: "pending",
    });

    const result = await fusionService.executeSwap({
      amount,
      srcChainId: parseInt(srcChainId),
      dstChainId: parseInt(dstChainId),
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
        orderHash: result.data!.orderHash,
        quote: result.data!.quote,
        secrets: result.data!.secrets,
        secretHashes: result.data!.secretHashes,
        status: "processing",
        updatedAt: new Date(),
      })
      .where(eq(swapTransactions.id, swapId));

    // Start monitoring the order in background
    monitorOrderAsync(result.data!.orderHash, result.data!.secrets, swapId);

    ResponseHelper.success(
      res,
      {
        swapId,
        orderHash: result.data!.orderHash,
      },
      "Swap initiated successfully"
    );
  } catch (error: any) {
    console.error("Error in executeSwapController:", error);
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

      // If too many errors, stop monitoring
      if (attempts >= maxAttempts) {
        await db
          .update(swapTransactions)
          .set({
            status: "failed",
            errorDetails: { error: "Monitoring failed" },
            updatedAt: new Date(),
          })
          .where(eq(swapTransactions.id, swapId));

        clearInterval(monitor);
      }
    }
  }, 5000); // Check every 5 seconds
}

export const getSwapStatusController: RequestHandler = async (req, res) => {
  try {
    const { swapId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      ResponseHelper.notAuthorized(res, "User authentication required");
      return;
    }

    const swap = await db
      .select()
      .from(swapTransactions)
      .where(eq(swapTransactions.id, swapId));

    if (!swap.length) {
      ResponseHelper.notFound(res, "Swap transaction not found");
      return;
    }

    // Check if the swap belongs to the user
    if (swap[0].userId !== userId) {
      ResponseHelper.notAuthorized(
        res,
        "Unauthorized access to swap transaction"
      );
      return;
    }

    ResponseHelper.success(res, swap[0], "Swap status retrieved");
  } catch (error: any) {
    console.error("Error in getSwapStatusController:", error);
    ResponseHelper.error(res, error.message, "Internal server error");
  }
};

export const getUserSwapsController: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit = "10", offset = "0" } = req.query;

    if (!userId) {
      ResponseHelper.notAuthorized(res, "User authentication required");
      return;
    }

    const swaps = await db
      .select()
      .from(swapTransactions)
      .where(eq(swapTransactions.userId, userId))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string))
      .orderBy(swapTransactions.createdAt);

    ResponseHelper.success(res, swaps, "User swaps retrieved");
  } catch (error: any) {
    console.error("Error in getUserSwapsController:", error);
    ResponseHelper.error(res, error.message, "Internal server error");
  }
};
