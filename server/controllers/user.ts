import { RequestHandler, Response } from "express";

import { ControllerHelper } from "../utils/controllerHelper";
import { SCOPE } from "../utils/enums";
import * as ResponseHelper from "../utils/responseHelper";

import * as UserService from "../services/user/index";
import {
  addChatSchema,
  getChatSchema,
  getChatsByUserSchema,
  updateChatSchema,
  deleteChatSchema,
  addMessageSchema,
  getMessageSchema,
  getMessagesByChatSchema,
  getMessagesByUserSchema,
  updateMessageSchema,
  deleteMessageSchema,
  userSyncSchema,
  getUserSchema,
} from "../zod";

// User Controllers for Privy Integration
export const syncUserController: RequestHandler = async (req, res) => {
  // Custom success handler for user sync to format response correctly
  const onSyncUserSuccess = (
    res: Response,
    data: any,
    message: string
  ): Response => {
    return res.status(200).json({
      success: true,
      user: data.user,
    });
  };

  await ControllerHelper({
    res,
    logMessage: "Sync User",
    validationSchema: userSyncSchema,
    validationData: req.body,
    serviceMethod: UserService.syncUser,
    onSuccess: onSyncUserSuccess,
    scope: SCOPE.USER,
  });
};

export const getUserController: RequestHandler = async (req, res) => {
  await ControllerHelper({
    res,
    logMessage: "Get User by Privy ID",
    validationSchema: getUserSchema,
    validationData: req.params,
    serviceMethod: UserService.getUserByPrivyId,
    scope: SCOPE.USER,
  });
};

// Chat Controllers
export const createChatController: RequestHandler = async (req, res) => {
  // Extract userId from authenticated user
  const userId = req.user?.id;
  if (!userId) {
    ResponseHelper.notAuthorized(res, "User not authenticated");
    return;
  }

  await ControllerHelper({
    res,
    logMessage: "Create Chat",
    validationSchema: addChatSchema,
    validationData: { ...req.body, userId },
    serviceMethod: UserService.createChat,
    scope: SCOPE.USER,
  });
};

export const getChatController: RequestHandler = async (req, res) => {
  await ControllerHelper({
    res,
    logMessage: "Get Chat",
    validationSchema: getChatSchema,
    validationData: req.params,
    serviceMethod: UserService.getChat,
    scope: SCOPE.USER,
  });
};

export const getChatsByUserController: RequestHandler = async (req, res) => {
  await ControllerHelper({
    res,
    logMessage: "Get Chats by User",
    validationSchema: getChatsByUserSchema,
    validationData: req.params,
    serviceMethod: UserService.getChatsByUser,
    scope: SCOPE.USER,
  });
};

export const updateChatController: RequestHandler = async (req, res) => {
  await ControllerHelper({
    res,
    logMessage: "Update Chat",
    validationSchema: updateChatSchema,
    validationData: { ...req.params, ...req.body },
    serviceMethod: UserService.updateChat,
    scope: SCOPE.USER,
  });
};

export const deleteChatController: RequestHandler = async (req, res) => {
  await ControllerHelper({
    res,
    logMessage: "Delete Chat",
    validationSchema: deleteChatSchema,
    validationData: req.params,
    serviceMethod: UserService.deleteChat,
    scope: SCOPE.USER,
  });
};

// Message Controllers
export const createMessageController: RequestHandler = async (req, res) => {
  // Extract userId from authenticated user
  const userId = req.user?.id;
  if (!userId) {
    ResponseHelper.notAuthorized(res, "User not authenticated");
    return;
  }

  // Custom success handler for message creation with potential AI response
  const onCreateMessageSuccess = (
    res: Response,
    data: any,
    message: string
  ): Response => {
    return res.status(200).json({
      success: true,
      message,
      userMessage: data.userMessage || data,
      aiMessage: data.aiMessage || null,
    });
  };

  await ControllerHelper({
    res,
    logMessage: "Create Message",
    validationSchema: addMessageSchema,
    validationData: { ...req.body, userId },
    serviceMethod: UserService.createMessage,
    onSuccess: onCreateMessageSuccess,
    scope: SCOPE.USER,
  });
};

export const getMessageController: RequestHandler = async (req, res) => {
  await ControllerHelper({
    res,
    logMessage: "Get Message",
    validationSchema: getMessageSchema,
    validationData: req.params,
    serviceMethod: UserService.getMessage,
    scope: SCOPE.USER,
  });
};

export const getMessagesByChatController: RequestHandler = async (req, res) => {
  await ControllerHelper({
    res,
    logMessage: "Get Messages by Chat",
    validationSchema: getMessagesByChatSchema,
    validationData: req.params,
    serviceMethod: UserService.getMessagesByChat,
    scope: SCOPE.USER,
  });
};

export const getMessagesByUserController: RequestHandler = async (req, res) => {
  await ControllerHelper({
    res,
    logMessage: "Get Messages by User",
    validationSchema: getMessagesByUserSchema,
    validationData: req.params,
    serviceMethod: UserService.getMessagesByUser,
    scope: SCOPE.USER,
  });
};

export const updateMessageController: RequestHandler = async (req, res) => {
  await ControllerHelper({
    res,
    logMessage: "Update Message",
    validationSchema: updateMessageSchema,
    validationData: { ...req.params, ...req.body },
    serviceMethod: UserService.updateMessage,
    scope: SCOPE.USER,
  });
};

export const deleteMessageController: RequestHandler = async (req, res) => {
  await ControllerHelper({
    res,
    logMessage: "Delete Message",
    validationSchema: deleteMessageSchema,
    validationData: req.params,
    serviceMethod: UserService.deleteMessage,
    scope: SCOPE.USER,
  });
};
