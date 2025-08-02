import express from "express";

const router = express.Router();

import * as userController from "../controllers/user";

// User routes for Privy integration
router.post("/sync", userController.syncUserController);
router.get("/users/:privyId", userController.getUserController);

// Delegation routes for EIP-7702
router.post("/delegations", userController.storeDelegationController);
router.get("/delegations/:address", userController.getDelegationsController);

// Chat routes
router.post("/chats", userController.createChatController);
router.get("/chats/:id", userController.getChatController);
router.get("/users/:userId/chats", userController.getChatsByUserController);
router.put("/chats/:id", userController.updateChatController);
router.delete("/chats/:id", userController.deleteChatController);

// Message routes
router.post("/messages", userController.createMessageController);
router.get("/messages/:id", userController.getMessageController);
router.get(
  "/chats/:chatId/messages",
  userController.getMessagesByChatController
);
router.get(
  "/users/:userId/messages",
  userController.getMessagesByUserController
);
router.put("/messages/:id", userController.updateMessageController);
router.delete("/messages/:id", userController.deleteMessageController);

export default router;
