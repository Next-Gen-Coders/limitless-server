import express from "express";
import * as swapController from "../controllers/swap";
import { authenticatePrivy } from "../middleware/auth";

const router = express.Router();

// Protected swap routes - all require authentication
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
router.get(
  "/user/swaps",
  authenticatePrivy,
  swapController.getUserSwapsController
);

export default router;
