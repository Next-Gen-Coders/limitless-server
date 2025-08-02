import express from "express";
import * as aiController from "../controllers/ai";

const router = express.Router();

// Test route for AI functionality (no auth for testing)
router.post("/test", aiController.testAIController);

export default router;
