import express from "express";

const router = express.Router();

import * as userController from "../controllers/user";
import { authenticatePrivy, authenticateAndSync } from "../middleware/auth";

// User routes for Privy integration
router.post("/sync", userController.syncUserController);
router.get(
  "/users/:privyId",
  authenticatePrivy,
  userController.getUserController
);

// Protected Chat routes
router.post("/chats", authenticateAndSync, userController.createChatController);
router.get("/chats/:id", authenticatePrivy, userController.getChatController);
router.get(
  "/users/:userId/chats",
  authenticatePrivy,
  userController.getChatsByUserController
);
router.put(
  "/chats/:id",
  authenticatePrivy,
  userController.updateChatController
);
router.delete(
  "/chats/:id",
  authenticatePrivy,
  userController.deleteChatController
);

// Protected Message routes
router.post(
  "/messages",
  authenticateAndSync,
  userController.createMessageController
);
router.get(
  "/messages/:id",
  authenticatePrivy,
  userController.getMessageController
);
router.get(
  "/chats/:chatId/messages",
  authenticatePrivy,
  userController.getMessagesByChatController
);
router.get(
  "/users/:userId/messages",
  authenticatePrivy,
  userController.getMessagesByUserController
);
router.put(
  "/messages/:id",
  authenticatePrivy,
  userController.updateMessageController
);
router.delete(
  "/messages/:id",
  authenticatePrivy,
  userController.deleteMessageController
);

export default router;
