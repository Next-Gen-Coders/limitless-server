// Structured types for swap tool responses
export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
}

export interface TransactionData {
  from: string;
  to: string;
  data: string;
  value: string;
  gas?: string;
  gasPrice?: string;
}

export interface ProtocolInfo {
  name: string;
  part: number;
  fromTokenAddress: string;
  toTokenAddress: string;
}

export interface SwapQuoteResponse {
  type: 'quote';
  chainId: number;
  chainName: string;
  srcToken: TokenInfo;
  dstToken: TokenInfo;
  srcAmount: string;
  dstAmount: string;
  srcAmountFormatted: string;
  dstAmountFormatted: string;
  exchangeRate: string;
  gas: number;
  gasPrice?: string;
  protocols?: ProtocolInfo[];
  slippage?: number;
}

export interface SwapTransactionResponse {
  type: 'swap';
  chainId: number;
  chainName: string;
  srcToken: TokenInfo;
  dstToken: TokenInfo;
  srcAmount: string;
  dstAmount: string;
  srcAmountFormatted: string;
  dstAmountFormatted: string;
  slippage: number;
  receiver: string;
  needsApproval: boolean;
  spenderAddress?: string;
  approvalTransaction?: {
    txType: 'Approval';
    from: string;
    to: string;
    data: string;
    value: string;
    gasPrice?: string;
    gas?: string;
  };
  swapTransaction: {
    txType: 'Swap';
    from: string;
    to: string;
    data: string;
    value: string;
    gasPrice: string;
    gas: string;
  };
  protocols?: ProtocolInfo[];
}

export interface ApprovalCheckResponse {
  type: 'approval_check';
  chainId: number;
  chainName: string;
  token: TokenInfo;
  walletAddress: string;
  spenderAddress: string;
  currentAllowance: string;
  requiredAmount: string;
  needsApproval: boolean;
  approvalTransaction?: {
    txType: 'Approval';
    from: string;
    to: string;
    data: string;
    value: string;
    gasPrice?: string;
    gas?: string;
  };
}

export interface SpenderResponse {
  type: 'spender';
  chainId: number;
  chainName: string;
  spenderAddress: string;
}

export interface ErrorResponse {
  type: 'error';
  error: string;
  message: string;
}

export type SwapToolResponse = 
  | SwapQuoteResponse 
  | SwapTransactionResponse 
  | ApprovalCheckResponse 
  | SpenderResponse 
  | ErrorResponse;

// Helper function to create a formatted text message alongside structured data
export function createSwapResponse(data: SwapToolResponse): string {
  // Return JSON wrapped in a special marker for frontend parsing
  return `SWAP_DATA_START${JSON.stringify(data, null, 2)}SWAP_DATA_END`;
}