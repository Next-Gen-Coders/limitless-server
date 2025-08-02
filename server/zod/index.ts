import { addChatSchema, AddChatRequest } from "./addChat";
import { addMessageSchema, AddMessageRequest } from "./addMessage";
import {
  updateChatSchema,
  getChatSchema,
  deleteChatSchema,
  getChatsByUserSchema,
  UpdateChatRequest,
  GetChatRequest,
  DeleteChatRequest,
  GetChatsByUserRequest,
} from "./chatSchemas";
import {
  updateMessageSchema,
  getMessageSchema,
  deleteMessageSchema,
  getMessagesByChatSchema,
  getMessagesByUserSchema,
  UpdateMessageRequest,
  GetMessageRequest,
  DeleteMessageRequest,
  GetMessagesByChatRequest,
  GetMessagesByUserRequest,
} from "./messageSchemas";
import {
  userSyncSchema,
  getUserSchema,
  userSyncResponseSchema,
  UserSyncRequest,
  GetUserRequest,
  UserSyncResponse,
} from "./userSchemas";
import {
  storeDelegationSchema,
  getDelegationsSchema,
  getDelegationsQuerySchema,
  delegationResponseSchema,
  StoreDelegationRequest,
  GetDelegationsRequest,
  GetDelegationsQuery,
  DelegationData,
} from "./delegationSchemas";

export {
  // Chat schemas
  addChatSchema,
  AddChatRequest,
  updateChatSchema,
  getChatSchema,
  deleteChatSchema,
  getChatsByUserSchema,
  UpdateChatRequest,
  GetChatRequest,
  DeleteChatRequest,
  GetChatsByUserRequest,

  // Message schemas
  addMessageSchema,
  AddMessageRequest,
  updateMessageSchema,
  getMessageSchema,
  deleteMessageSchema,
  getMessagesByChatSchema,
  getMessagesByUserSchema,
  UpdateMessageRequest,
  GetMessageRequest,
  DeleteMessageRequest,
  GetMessagesByChatRequest,
  GetMessagesByUserRequest,

  // User schemas
  userSyncSchema,
  getUserSchema,
  userSyncResponseSchema,
  UserSyncRequest,
  GetUserRequest,
  UserSyncResponse,

  // Delegation schemas
  storeDelegationSchema,
  getDelegationsSchema,
  getDelegationsQuerySchema,
  delegationResponseSchema,
  StoreDelegationRequest,
  GetDelegationsRequest,
  GetDelegationsQuery,
  DelegationData,
};
