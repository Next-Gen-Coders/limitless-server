import { Request, Response, NextFunction } from "express";
import { PrivyClient } from "@privy-io/server-auth";
import rateLimit from "express-rate-limit";
import { ENV } from "../config/env";
import * as ResponseHelper from "../utils/responseHelper";

// Initialize Privy client
const privy = new PrivyClient(ENV.PRIVY_APP_ID!, ENV.PRIVY_APP_SECRET!);

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        privyId: string;
        walletAddress?: string | null;
        email?: string | null;
        linkedAccounts?: any[];
        createdAt?: Date;
        updatedAt?: Date;
      };
    }
  }
}

export const authenticatePrivy = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ResponseHelper.notAuthorized(
        res,
        "Missing or invalid authorization header"
      );
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      // Verify the token with Privy
      const verifiedClaims = await privy.verifyAuthToken(token);

      if (!verifiedClaims || !verifiedClaims.userId) {
        ResponseHelper.notAuthorized(res, "Invalid or expired token");
        return;
      }

      // Get user details from Privy
      const privyUser = await privy.getUser(verifiedClaims.userId);

      if (!privyUser) {
        ResponseHelper.notAuthorized(res, "User not found");
        return;
      }

      // Extract wallet address and linked accounts
      let walletAddress: string | undefined;
      let linkedAccounts: any[] = [];

      if (privyUser.wallet?.address) {
        walletAddress = privyUser.wallet.address;
      }

      // Process linked accounts
      if (privyUser.linkedAccounts && Array.isArray(privyUser.linkedAccounts)) {
        linkedAccounts = privyUser.linkedAccounts;

        // Find wallet address from linked accounts if not found above
        if (!walletAddress) {
          const walletAccount = linkedAccounts.find(
            (account: any) =>
              account.type === "wallet" ||
              account.type === "ethereum_wallet" ||
              account.type === "smart_wallet"
          );
          if (walletAccount && "address" in walletAccount) {
            walletAddress = (walletAccount as any).address;
          }
        }
      }

      // Add user info to request object
      req.user = {
        id: privyUser.id,
        privyId: privyUser.id,
        walletAddress,
        email: privyUser.email?.address,
        linkedAccounts,
      };

      next();
    } catch (verifyError: any) {
      console.error("Token verification failed:", verifyError.message);
      ResponseHelper.notAuthorized(res, "Invalid or expired token");
      return;
    }
  } catch (error: any) {
    console.error("Authentication middleware error:", error.message);
    ResponseHelper.error(res, error.message, "Authentication failed");
    return;
  }
};

// Optional middleware to auto-sync user after authentication
export const authenticateAndSync = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // First authenticate with Privy
    await new Promise<void>((resolve, reject) => {
      authenticatePrivy(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // If authentication failed, the response would have been sent already
    if (res.headersSent) return;

    // Auto-sync user data if authenticated successfully
    if (req.user) {
      const { syncUser } = await import("../services/user/syncUser");

      const syncResult = await syncUser({
        privyId: req.user.privyId,
        email: req.user.email || undefined,
        walletAddress: req.user.walletAddress || undefined,
        linkedAccounts: req.user.linkedAccounts || [],
      });

      if (syncResult.error) {
        console.warn("User sync failed:", syncResult.error);
        // Don't fail the request, just log the warning
      } else {
        // Update request user with synced data
        req.user = {
          id: syncResult.data?.user?.id || req.user.id,
          privyId: req.user.privyId,
          walletAddress:
            syncResult.data?.user?.walletAddress || req.user.walletAddress,
          email: syncResult.data?.user?.email || req.user.email,
          linkedAccounts: Array.isArray(syncResult.data?.user?.linkedAccounts)
            ? syncResult.data.user.linkedAccounts
            : [],
          createdAt: syncResult.data?.user?.createdAt || undefined,
          updatedAt: syncResult.data?.user?.updatedAt || undefined,
        };
      }
    }

    next();
  } catch (error: any) {
    console.error("Authentication and sync middleware error:", error.message);
    ResponseHelper.error(res, error.message, "Authentication failed");
    return;
  }
};
