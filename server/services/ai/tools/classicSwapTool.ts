import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ENV } from "../../../config/env";
import { 
  SwapQuoteResponse, 
  SwapTransactionResponse, 
  ApprovalCheckResponse, 
  SpenderResponse, 
  ErrorResponse,
  createSwapResponse,
  type TokenInfo,
  type ProtocolInfo
} from "../../../types/swapTypes";

// 1inch Classic Swap API base URL
const ONEINCH_SWAP_API_BASE = "https://api.1inch.dev/swap/v6.1";

// Supported chains for classic swap
export const CLASSIC_SWAP_SUPPORTED_CHAINS = {
  ethereum: 1,
  arbitrum: 42161,
  avalanche: 43114,
  base: 8453,
  bsc: 56,
  gnosis: 100,
  sonic: 146,
  optimism: 10,
  polygon: 137,
  zksync: 324,
  linea: 59144,
  unichain: 1301,
} as const;

// Native token addresses (use this address for native tokens like ETH, MATIC, etc.)
const NATIVE_TOKEN_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

// Helper function to get native token symbol
function getNativeTokenSymbol(chainId: number): string {
  const nativeTokens: Record<number, string> = {
    1: "ETH",
    42161: "ETH", 
    43114: "AVAX",
    8453: "ETH",
    56: "BNB",
    100: "xDAI",
    146: "S",
    10: "ETH",
    137: "MATIC",
    324: "ETH",
    59144: "ETH",
    1301: "ETH",
  };
  return nativeTokens[chainId] || "NATIVE";
}

// Get the 1inch router address that needs approval
async function getSpenderAddress(chainId: number): Promise<string> {
  try {
    const response = await fetch(
      `${ONEINCH_SWAP_API_BASE}/${chainId}/approve/spender`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
          accept: "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.address;
    } else {
      const errorText = await response.text();
      console.error("Spender API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Spender API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not fetch spender address:", error);
    throw error;
  }
}

// Check current allowance for a token
async function checkAllowance(
  chainId: number,
  tokenAddress: string,
  walletAddress: string
): Promise<string> {
  try {
    const response = await fetch(
      `${ONEINCH_SWAP_API_BASE}/${chainId}/approve/allowance?tokenAddress=${tokenAddress}&walletAddress=${walletAddress}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
          accept: "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.allowance;
    } else {
      const errorText = await response.text();
      console.error("Allowance API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Allowance API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not check allowance:", error);
    throw error;
  }
}

// Generate approval transaction calldata
async function generateApprovalCalldata(
  chainId: number,
  tokenAddress: string,
  amount?: string
): Promise<any> {
  try {
    const params = new URLSearchParams({
      tokenAddress,
    });
    
    if (amount) {
      params.append("amount", amount);
    }

    const response = await fetch(
      `${ONEINCH_SWAP_API_BASE}/${chainId}/approve/transaction?${params}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
          accept: "application/json",
        },
      }
    );

    if (response.ok) {
      return response.json();
    } else {
      const errorText = await response.text();
      console.error("Approval transaction API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Approval transaction API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not generate approval calldata:", error);
    throw error;
  }
}

// Get swap quote
async function getSwapQuote(
  chainId: number,
  src: string,
  dst: string,
  amount: string,
  protocols?: string,
  fee?: number,
  gasPrice?: string,
  includeTokensInfo: boolean = true,
  includeProtocols: boolean = true,
  includeGas: boolean = true
): Promise<any> {
  try {
    const params = new URLSearchParams({
      src,
      dst,
      amount,
      includeTokensInfo: includeTokensInfo.toString(),
      includeProtocols: includeProtocols.toString(),
      includeGas: includeGas.toString(),
    });

    if (protocols) params.append("protocols", protocols);
    if (fee !== undefined) params.append("fee", fee.toString());
    if (gasPrice) params.append("gasPrice", gasPrice);

    const response = await fetch(
      `${ONEINCH_SWAP_API_BASE}/${chainId}/quote?${params}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
          accept: "application/json",
        },
      }
    );

    if (response.ok) {
      return response.json();
    } else {
      const errorText = await response.text();
      console.error("Quote API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Quote API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not get swap quote:", error);
    throw error;
  }
}

// Generate swap transaction calldata
async function generateSwapCalldata(
  chainId: number,
  src: string,
  dst: string,
  amount: string,
  from: string,
  slippage: number,
  protocols?: string,
  receiver?: string,
  fee?: number,
  gasPrice?: string,
  includeTokensInfo: boolean = true,
  includeProtocols: boolean = true,
  includeGas: boolean = true
): Promise<any> {
  try {
    const params = new URLSearchParams({
      src,
      dst,
      amount,
      from,
      origin: from, // EOA address that initiates the transaction
      slippage: slippage.toString(),
      includeTokensInfo: includeTokensInfo.toString(),
      includeProtocols: includeProtocols.toString(),
      includeGas: includeGas.toString(),
    });

    if (protocols) params.append("protocols", protocols);
    if (receiver) params.append("receiver", receiver);
    if (fee !== undefined) params.append("fee", fee.toString());
    if (gasPrice) params.append("gasPrice", gasPrice);

    const response = await fetch(
      `${ONEINCH_SWAP_API_BASE}/${chainId}/swap?${params}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
          accept: "application/json",
        },
      }
    );

    if (response.ok) {
      return response.json();
    } else {
      const errorText = await response.text();
      console.error("Swap API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Swap API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not generate swap calldata:", error);
    throw error;
  }
}

// Helper function to format token amount for display
function formatTokenAmount(amountWei: string, decimals: number = 18): string {
  const amount = parseFloat(amountWei) / Math.pow(10, decimals);
  if (amount === 0) return "0";
  if (amount < 0.000001) return amount.toExponential(6);
  if (amount < 1) return amount.toFixed(8);
  if (amount < 1000) return amount.toFixed(6);
  return amount.toLocaleString();
}

// Helper function to parse user input and extract token addresses
function parseTokenInput(input: string, chainId: number): string {
  // If it's already a contract address, return as-is
  if (/^0x[a-fA-F0-9]{40}$/.test(input)) {
    return input;
  }
  
  // If it's a native token (ETH, MATIC, BNB, etc.)
  const nativeSymbol = getNativeTokenSymbol(chainId).toLowerCase();
  if (input.toLowerCase() === nativeSymbol || 
      input.toLowerCase() === "eth" || 
      input.toLowerCase() === "native") {
    return NATIVE_TOKEN_ADDRESS;
  }
  
  // Common token mappings per chain
  const tokenMappings: Record<number, Record<string, string>> = {
    1: { // Ethereum
      "usdc": "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "usdt": "0xdac17f958d2ee523a2206206994597c13d831ec7",
      "dai": "0x6b175474e89094c44da98b954eedeac495271d0f",
      "weth": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      "wbtc": "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
      "link": "0x514910771af9ca656af840dff83e8264ecf986ca",
      "1inch": "0x111111111117dc0aa78b770fa6a738034120c302",
    },
    137: { // Polygon
      "usdc": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      "usdt": "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
      "dai": "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
      "wmatic": "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
      "weth": "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
      "wbtc": "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
    },
    42161: { // Arbitrum
      "usdc": "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
      "usdt": "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
      "weth": "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
      "wbtc": "0x2f2a2543b76a4166549f7aaab2e75b4c6e373aec",
      "arb": "0x912ce59144191c1204e64559fe8253a0e49e6548",
    },
    8453: { // Base
      "usdc": "0xd9aaEC86b65d86f6A7B5B1b0c42fa1eB3B8A2C5d",
      "weth": "0x4200000000000000000000000000000000000006",
    },
    56: { // BSC
      "usdc": "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
      "usdt": "0x55d398326f99059ff775485246999027b3197955",
      "wbnb": "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
      "eth": "0x2170ed0880ac9a755fd29b2688956bd959f933f8",
      "btcb": "0x7130d2a12b9bcfaae4f2634d864a1ee1ce3ead9c",
      "busd": "0xe9e7cea3dedca5984780bafc599bd69add087d56",
    },
  };

  const tokens = tokenMappings[chainId] || {};
  const address = tokens[input.toLowerCase()];
  
  if (address) {
    return address;
  }
  
  // If we can't find it, return the input and let the API handle validation
  return input;
}

// Create the classic swap tool
export const classicSwapTool = new DynamicStructuredTool({
  name: "classic_swap",
  description: `
The classicSwapTool provides comprehensive same-chain token swapping capabilities using the 1inch Classic Swap API (Pathfinder v6.1). This tool should be called when users want to:

**Primary Functions:**
- Get real-time swap quotes with best rates across multiple DEXs
- Generate swap transaction calldata for frontend execution
- Handle token approvals and check allowances
- Support multi-step swap operations

**Supported Networks:**
Ethereum Mainnet (1), Arbitrum (42161), Avalanche (43114), Base (8453), BNB Chain (56), Gnosis (100), Sonic (146), Optimism (10), Polygon (137), zkSync Era (324), Linea (59144), Unichain (1301)

**Key Features:**
- Automatic token address resolution (supports symbols like USDC, ETH, WBTC)
- Native token support (ETH, MATIC, BNB, etc.)
- Slippage protection with customizable tolerance
- Gas price optimization
- Protocol selection and filtering
- Comprehensive approval management

**Use Cases:**
1. **Quote Generation**: Get expected output amounts and optimal routes
2. **Swap Execution**: Generate calldata for transaction signing
3. **Approval Management**: Check and generate approval transactions
4. **Route Analysis**: Understand which protocols provide best rates

**User Intent Recognition:**
Trigger this tool when users express swap intentions like:
- "Swap 100 USDC for ETH"
- "Exchange 1 ETH to USDC on Polygon"
- "Get quote for trading WBTC to DAI"
- "How much MATIC can I get for 50 USDT?"
- "Prepare swap transaction for 1000 USDC to ETH"

**Token Support:**
- Native tokens: ETH, MATIC, BNB, AVAX, etc. (use "ETH", "native", or chain-specific symbols)
- Major tokens: USDC, USDT, DAI, WETH, WBTC, LINK, etc.
- Contract addresses: Full 0x... addresses are supported
- Automatic symbol-to-address mapping for common tokens

**Output Information:**
- Expected output amounts with price impact
- Required approvals and calldata
- Gas estimates and costs
- Protocol routes and fee breakdowns
- Transaction parameters ready for signing

The tool handles the complete swap workflow from quote to execution-ready calldata.
`,
  schema: z.object({
    operation: z
      .enum(["quote", "swap", "approval_check", "get_spender"])
      .describe(
        "Operation type: 'quote' for getting swap quotes, 'swap' for generating swap calldata, 'approval_check' for checking token allowances, 'get_spender' for getting 1inch router address"
      ),
    srcToken: z
      .string()
      .describe(
        "Source token to swap from. Can be token symbol (USDC, ETH, WBTC) or contract address (0x...)"
      ),
    dstToken: z
      .string()
      .describe(
        "Destination token to swap to. Can be token symbol (USDC, ETH, WBTC) or contract address (0x...)"
      ),
    amount: z
      .string()
      .describe(
        "Amount to swap in minimal divisible units (wei for ETH, smallest unit for tokens)"
      ),
    chain: z
      .string()
      .default("ethereum")
      .describe(
        "Blockchain network (ethereum, polygon, arbitrum, base, bsc, avalanche, optimism, gnosis, sonic, zksync, linea, unichain)"
      ),
    walletAddress: z
      .string()
      .describe(
        "User's wallet address (required for swap and approval operations)"
      ),
    slippage: z
      .number()
      .min(0)
      .max(50)
      .default(1)
      .describe(
        "Maximum acceptable slippage percentage (0-50). Default: 1%"
      ),
    protocols: z
      .string()
      .optional()
      .describe(
        "Comma-separated list of protocols to use (e.g., 'UNISWAP_V3,CURVE'). Leave empty for all protocols"
      ),
    receiver: z
      .string()
      .optional()
      .describe(
        "Address to receive the output tokens. Defaults to walletAddress if not specified"
      ),
    fee: z
      .number()
      .min(0)
      .max(3)
      .optional()
      .describe(
        "Partner fee percentage (0-3%). This fee will be deducted from input amount"
      ),
    gasPrice: z
      .string()
      .optional()
      .describe(
        "Gas price in wei (e.g., '12500000000' for 12.5 GWEI). Defaults to network fast gas price"
      ),
  }),
  func: async ({
    operation,
    srcToken,
    dstToken,
    amount,
    chain = "ethereum",
    walletAddress,
    slippage = 1,
    protocols,
    receiver,
    fee,
    gasPrice,
  }) => {
    try {
      // Validate chain
      const chainId = CLASSIC_SWAP_SUPPORTED_CHAINS[
        chain.toLowerCase() as keyof typeof CLASSIC_SWAP_SUPPORTED_CHAINS
      ];
      if (!chainId) {
        return `❌ **Error**: Unsupported chain "${chain}". 

**Supported chains:** ${Object.keys(CLASSIC_SWAP_SUPPORTED_CHAINS).join(", ")}`;
      }

      const chainName = chain.charAt(0).toUpperCase() + chain.slice(1);

      // Validate wallet address for operations that need it
      if ((operation === "swap" || operation === "approval_check") && !walletAddress) {
        return `❌ **Error**: Wallet address is required for ${operation} operation.`;
      }

      if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return `❌ **Error**: Invalid wallet address format. Must be a valid Ethereum address (0x followed by 40 hex characters).`;
      }

      // Handle get_spender operation
      if (operation === "get_spender") {
        const spenderAddress = await getSpenderAddress(chainId);
        
        const response: SpenderResponse = {
          type: 'spender',
          chainId,
          chainName,
          spenderAddress
        };

        return createSwapResponse(response);
      }

      // Parse token addresses
      const srcTokenAddress = parseTokenInput(srcToken, chainId);
      const dstTokenAddress = parseTokenInput(dstToken, chainId);

      // Handle approval_check operation
      if (operation === "approval_check") {
        if (srcTokenAddress === NATIVE_TOKEN_ADDRESS) {
          const response: ApprovalCheckResponse = {
            type: 'approval_check',
            chainId,
            chainName,
            token: {
              symbol: getNativeTokenSymbol(chainId),
              name: getNativeTokenSymbol(chainId),
              address: srcTokenAddress,
              decimals: 18
            },
            walletAddress,
            spenderAddress: "",
            currentAllowance: "0",
            requiredAmount: amount,
            needsApproval: false
          };

          return createSwapResponse(response);
        }

        const allowance = await checkAllowance(chainId, srcTokenAddress, walletAddress);
        const spenderAddress = await getSpenderAddress(chainId);
        
        // Check if allowance is sufficient
        const isApprovalNeeded = BigInt(allowance) < BigInt(amount);

        const response: ApprovalCheckResponse = {
          type: 'approval_check',
          chainId,
          chainName,
          token: {
            symbol: srcToken.toUpperCase(),
            name: srcToken.toUpperCase(),
            address: srcTokenAddress,
            decimals: 18 // Default, should be fetched from token contract
          },
          walletAddress,
          spenderAddress,
          currentAllowance: allowance,
          requiredAmount: amount,
          needsApproval: isApprovalNeeded
        };

        if (isApprovalNeeded) {
          try {
            const approvalCalldata = await generateApprovalCalldata(chainId, srcTokenAddress, amount);
            response.approvalTransaction = {
              txType: 'Approval',
              from: walletAddress,
              to: approvalCalldata.to,
              data: approvalCalldata.data,
              value: approvalCalldata.value,
              gasPrice: approvalCalldata.gasPrice,
              gas: approvalCalldata.gas
            };
          } catch (error) {
            console.warn("Could not generate approval calldata:", error);
          }
        }

        return createSwapResponse(response);
      }

      // Handle quote operation
      if (operation === "quote") {
        const quote = await getSwapQuote(
          chainId,
          srcTokenAddress,
          dstTokenAddress,
          amount,
          protocols,
          fee,
          gasPrice
        );

        const srcDecimals = quote.srcToken?.decimals || 18;
        const dstDecimals = quote.dstToken?.decimals || 18;
        
        const srcAmountFormatted = formatTokenAmount(amount, srcDecimals);
        const dstAmountFormatted = formatTokenAmount(quote.dstAmount, dstDecimals);
        
        const srcSymbol = quote.srcToken?.symbol || srcToken.toUpperCase();
        const dstSymbol = quote.dstToken?.symbol || dstToken.toUpperCase();

        const exchangeRate = (parseFloat(quote.dstAmount) / parseFloat(amount) * Math.pow(10, srcDecimals - dstDecimals)).toFixed(6);

        const response: SwapQuoteResponse = {
          type: 'quote',
          chainId,
          chainName,
          srcToken: {
            symbol: srcSymbol,
            name: quote.srcToken?.name || srcSymbol,
            address: srcTokenAddress,
            decimals: srcDecimals,
            logoURI: quote.srcToken?.logoURI
          },
          dstToken: {
            symbol: dstSymbol,
            name: quote.dstToken?.name || dstSymbol,
            address: dstTokenAddress,
            decimals: dstDecimals,
            logoURI: quote.dstToken?.logoURI
          },
          srcAmount: amount,
          dstAmount: quote.dstAmount,
          srcAmountFormatted,
          dstAmountFormatted,
          exchangeRate,
          gas: quote.gas || 0,
          gasPrice,
          protocols: quote.protocols?.map((protocol: any) => ({
            name: protocol.name || 'Unknown Protocol',
            part: protocol.part || 0,
            fromTokenAddress: protocol.fromTokenAddress || srcTokenAddress,
            toTokenAddress: protocol.toTokenAddress || dstTokenAddress
          }))
        };

        return createSwapResponse(response);
      }

      // Handle swap operation
      if (operation === "swap") {
        // First check if approval is needed for non-native tokens
        let approvalCalldata = null;
        let spenderAddress: string | undefined = undefined;
        const needsApproval = srcTokenAddress !== NATIVE_TOKEN_ADDRESS;
        
        if (needsApproval) {
          try {
            spenderAddress = await getSpenderAddress(chainId);
            const allowance = await checkAllowance(chainId, srcTokenAddress, walletAddress);
            const isApprovalNeeded = BigInt(allowance) < BigInt(amount);
            
            if (isApprovalNeeded) {
              approvalCalldata = await generateApprovalCalldata(chainId, srcTokenAddress, amount);
            }
          } catch (error) {
            console.warn("Could not check allowance, proceeding with swap generation:", error);
          }
        }

        // Generate swap calldata
        const swapData = await generateSwapCalldata(
          chainId,
          srcTokenAddress,
          dstTokenAddress,
          amount,
          walletAddress,
          slippage,
          protocols,
          receiver,
          fee,
          gasPrice
        );

        const srcDecimals = swapData.srcToken?.decimals || 18;
        const dstDecimals = swapData.dstToken?.decimals || 18;
        
        const srcAmountFormatted = formatTokenAmount(amount, srcDecimals);
        const dstAmountFormatted = formatTokenAmount(swapData.dstAmount, dstDecimals);
        
        const srcSymbol = swapData.srcToken?.symbol || srcToken.toUpperCase();
        const dstSymbol = swapData.dstToken?.symbol || dstToken.toUpperCase();

        const response: SwapTransactionResponse = {
          type: 'swap',
          chainId,
          chainName,
          srcToken: {
            symbol: srcSymbol,
            name: swapData.srcToken?.name || srcSymbol,
            address: srcTokenAddress,
            decimals: srcDecimals,
            logoURI: swapData.srcToken?.logoURI
          },
          dstToken: {
            symbol: dstSymbol,
            name: swapData.dstToken?.name || dstSymbol,
            address: dstTokenAddress,
            decimals: dstDecimals,
            logoURI: swapData.dstToken?.logoURI
          },
          srcAmount: amount,
          dstAmount: swapData.dstAmount,
          srcAmountFormatted,
          dstAmountFormatted,
          slippage,
          receiver: receiver || walletAddress,
          needsApproval: !!approvalCalldata,
          spenderAddress,
          swapTransaction: {
            txType: 'Swap',
            from: swapData.tx.from,
            to: swapData.tx.to,
            data: swapData.tx.data,
            value: swapData.tx.value,
            gasPrice: swapData.tx.gasPrice,
            gas: swapData.tx.gas
          },
          protocols: swapData.protocols?.map((protocol: any) => ({
            name: protocol.name || 'Unknown Protocol',
            part: protocol.part || 0,
            fromTokenAddress: protocol.fromTokenAddress || srcTokenAddress,
            toTokenAddress: protocol.toTokenAddress || dstTokenAddress
          }))
        };

        // Add approval transaction if needed
        if (approvalCalldata) {
          response.approvalTransaction = {
            txType: 'Approval',
            from: walletAddress,
            to: approvalCalldata.to,
            data: approvalCalldata.data,
            value: approvalCalldata.value,
            gasPrice: approvalCalldata.gasPrice,
            gas: approvalCalldata.gas
          };
        }

        return createSwapResponse(response);
      }

      const errorResponse: ErrorResponse = {
        type: 'error',
        error: 'Invalid Operation',
        message: `Invalid operation "${operation}". Use 'quote', 'swap', 'approval_check', or 'get_spender'.`
      };
      return createSwapResponse(errorResponse);

    } catch (error: any) {
      console.error("Classic swap tool error:", error);

      let errorMessage = error.message;
      let errorType = 'Unknown Error';

      // Handle specific API errors
      if (error.message.includes("Quote API error") || 
          error.message.includes("Swap API error") ||
          error.message.includes("Allowance API error") ||
          error.message.includes("Approval transaction API error") ||
          error.message.includes("Spender API error")) {
        errorType = 'API Error';
        errorMessage = `${error.message}\n\nPlease check:\n- Token addresses are valid\n- Amount is properly formatted\n- Network is supported\n- Try again in a few moments`;
      } else {
        errorMessage = `${error.message}\n\nIf this error persists, please try:\n- Checking your token symbols/addresses\n- Reducing the swap amount\n- Using a different slippage tolerance`;
      }

      const errorResponse: ErrorResponse = {
        type: 'error',
        error: errorType,
        message: errorMessage
      };

      return createSwapResponse(errorResponse);
    }
  },
});