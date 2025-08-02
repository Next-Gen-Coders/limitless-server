import { RequestHandler, Response } from "express";

import { ControllerHelper } from "../utils/controllerHelper";
import { SCOPE } from "../utils/enums";

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
  storeDelegationSchema,
  getDelegationsSchema,
  getDelegationsQuerySchema,
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
      delegations: data.delegations,
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

// Delegation Controllers
export const storeDelegationController: RequestHandler = async (req, res) => {
  await ControllerHelper({
    res,
    logMessage: "Store Delegation",
    validationSchema: storeDelegationSchema,
    validationData: req.body,
    serviceMethod: UserService.storeDelegation,
    scope: SCOPE.USER,
  });
};

export const getDelegationsController: RequestHandler = async (
  req,
  res
): Promise<void> => {
  // Validate path params
  const paramsValidation = getDelegationsSchema.safeParse(req.params);
  if (!paramsValidation.success) {
    res.status(400).json({
      success: false,
      error: "Invalid parameters",
      details: paramsValidation.error.errors,
    });
    return;
  }

  // Validate query params
  const queryValidation = getDelegationsQuerySchema.safeParse(req.query);
  if (!queryValidation.success) {
    res.status(400).json({
      success: false,
      error: "Invalid query parameters",
      details: queryValidation.error.errors,
    });
    return;
  }

  try {
    const chainId = queryValidation.data.chainId
      ? parseInt(queryValidation.data.chainId)
      : undefined;
    const result = await UserService.getDelegationsByAddress(
      paramsValidation.data,
      chainId
    );

    if (result.error) {
      res.status(400).json({
        success: false,
        error: result.error,
        message: result.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      delegations: result.data,
      count: result.count,
      message: result.message,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

// Chat Controllers
export const createChatController: RequestHandler = async (req, res) => {
  await ControllerHelper({
    res,
    logMessage: "Create Chat",
    validationSchema: addChatSchema,
    validationData: req.body,
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
  await ControllerHelper({
    res,
    logMessage: "Create Message",
    validationSchema: addMessageSchema,
    validationData: req.body,
    serviceMethod: UserService.createMessage,
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
