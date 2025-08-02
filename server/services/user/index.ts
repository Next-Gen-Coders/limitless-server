// Chat services
import { createChat } from "./createChat";
import { getChat } from "./getChat";
import { getChatsByUser } from "./getChatsByUser";
import { updateChat } from "./updateChat";
import { deleteChat } from "./deleteChat";

// Message services
import { createMessage } from "./createMessage";
import { getMessage } from "./getMessage";
import { getMessagesByChat } from "./getMessagesByChat";
import { getMessagesByUser } from "./getMessagesByUser";
import { updateMessage } from "./updateMessage";
import { deleteMessage } from "./deleteMessage";

// User services for Privy integration
import { syncUser } from "./syncUser";
import { getUserByPrivyId } from "./getUserByPrivyId";

// Delegation services
import { storeDelegation } from "./storeDelegation";
import { getDelegationsByAddress } from "./getDelegationsByAddress";
import { getDelegationsByUserId } from "./getDelegationsByUserId";

export {
  // Chat exports
  createChat,
  getChat,
  getChatsByUser,
  updateChat,
  deleteChat,
  // Message exports
  createMessage,
  getMessage,
  getMessagesByChat,
  getMessagesByUser,
  updateMessage,
  deleteMessage,

  // User exports
  syncUser,
  getUserByPrivyId,

  // Delegation exports
  storeDelegation,
  getDelegationsByAddress,
  getDelegationsByUserId,
};
