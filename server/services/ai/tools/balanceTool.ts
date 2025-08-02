import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ENV } from "../../../config/env";

// 1inch Balance API base URL
const ONEINCH_BALANCE_API_BASE = "https://api.1inch.dev/balance/v1.2";

// Supported chains for balance API
export const BALANCE_SUPPORTED_CHAINS = {
  ethereum: 1,
  bsc: 56,
  polygon: 137,
  arbitrum: 42161,
  optimism: 10,
  avalanche: 43114,
  gnosis: 100,
  fantom: 250,
  klaytn: 8217,
  aurora: 1313161554,
  zksync: 324,
  base: 8453,
} as const;

// Helper function to format balance values
function formatBalance(balanceWei: string, decimals: number = 18): string {
  const balance = parseFloat(balanceWei) / Math.pow(10, decimals);
  if (balance === 0) return "0";
  if (balance < 0.000001) return balance.toExponential(3);
  if (balance < 1) return balance.toFixed(6);
  if (balance < 1000) return balance.toFixed(4);
  return balance.toLocaleString();
}

// Helper function to get token symbol from address (basic implementation)
function getTokenSymbol(address: string, chainId: number): string {
  const lowerAddress = address.toLowerCase();

  // Common token mappings
  const tokenMappings: Record<number, Record<string, string>> = {
    1: {
      // Ethereum
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "ETH",
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "USDC",
      "0xdac17f958d2ee523a2206206994597c13d831ec7": "USDT",
      "0x6b175474e89094c44da98b954eedeac495271d0f": "DAI",
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "WETH",
      "0x111111111117dc0aa78b770fa6a738034120c302": "1INCH",
    },
    137: {
      // Polygon
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "MATIC",
      "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": "USDC",
      "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": "USDT",
      "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270": "WMATIC",
    },
    56: {
      // BSC
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "BNB",
      "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d": "USDC",
      "0x55d398326f99059ff775485246999027b3197955": "USDT",
      "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c": "WBNB",
    },
  };

  const tokens = tokenMappings[chainId];
  if (tokens && tokens[lowerAddress]) {
    return tokens[lowerAddress];
  }

  // Return abbreviated address if not found
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Get all token balances for a wallet
async function getAllBalances(
  chainId: number,
  walletAddress: string
): Promise<Record<string, string>> {
  try {
    const response = await fetch(
      `${ONEINCH_BALANCE_API_BASE}/${chainId}/balances/${walletAddress}`,
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
      console.error("Balance API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Balance API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not fetch token balances:", error);
    throw error;
  }
}

// Get custom token balances for a wallet
async function getCustomTokenBalances(
  chainId: number,
  walletAddress: string,
  tokens: string[]
): Promise<Record<string, string>> {
  try {
    const response = await fetch(
      `${ONEINCH_BALANCE_API_BASE}/${chainId}/balances/${walletAddress}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ tokens }),
      }
    );

    if (response.ok) {
      return response.json();
    } else {
      const errorText = await response.text();
      console.error("Custom Balance API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Custom Balance API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not fetch custom token balances:", error);
    throw error;
  }
}

// Get balances for multiple wallets and tokens
async function getMultipleWalletsBalances(
  chainId: number,
  wallets: string[],
  tokens: string[]
): Promise<Record<string, Record<string, string>>> {
  try {
    const response = await fetch(
      `${ONEINCH_BALANCE_API_BASE}/${chainId}/balances/multiple/walletsAndTokens`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ tokens, wallets }),
      }
    );

    if (response.ok) {
      return response.json();
    } else {
      const errorText = await response.text();
      console.error("Multiple Wallets Balance API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Multiple Wallets Balance API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not fetch multiple wallets balances:", error);
    throw error;
  }
}

// Helper function to format wallet balances
function formatWalletBalances(
  balances: Record<string, string>,
  chainName: string,
  chainId: number,
  walletAddress: string,
  showOnlyNonZero: boolean = true
): string {
  let result = `💰 **Wallet Token Balances**\n\n`;
  result += `**Chain:** ${chainName} (${chainId})\n`;
  result += `**Wallet:** ${walletAddress}\n`;

  // Filter out zero balances if requested
  const filteredBalances = showOnlyNonZero
    ? Object.entries(balances).filter(([_, balance]) => parseFloat(balance) > 0)
    : Object.entries(balances);

  result += `**Tokens with Balance:** ${filteredBalances.length}\n`;
  result += `**Total Tokens Checked:** ${Object.keys(balances).length}\n\n`;

  if (filteredBalances.length === 0) {
    result += `📭 **No tokens with balance found.**\n\n`;
    result += `ℹ️ This wallet either has no tokens or all token balances are zero.`;
    return result;
  }

  // Sort by balance value (descending)
  filteredBalances.sort(([, a], [, b]) => parseFloat(b) - parseFloat(a));

  filteredBalances.forEach(([tokenAddress, balance], index) => {
    const tokenSymbol = getTokenSymbol(tokenAddress, chainId);
    const formattedBalance = formatBalance(balance);

    result += `**${index + 1}. ${tokenSymbol}**\n`;
    result += `   - **Address:** ${tokenAddress}\n`;
    result += `   - **Balance:** ${formattedBalance}\n`;
    result += `   - **Raw Balance:** ${balance}\n\n`;
  });

  result += `⏰ **Note:** Balances are real-time and may change with new transactions.`;
  return result;
}

// Helper function to format multiple wallets balances
function formatMultipleWalletsBalances(
  walletsBalances: Record<string, Record<string, string>>,
  chainName: string,
  chainId: number,
  showOnlyNonZero: boolean = true
): string {
  let result = `💰 **Multiple Wallets Token Balances**\n\n`;
  result += `**Chain:** ${chainName} (${chainId})\n`;
  result += `**Wallets Analyzed:** ${Object.keys(walletsBalances).length}\n\n`;

  for (const [walletAddress, balances] of Object.entries(walletsBalances)) {
    const filteredBalances = showOnlyNonZero
      ? Object.entries(balances).filter(
          ([_, balance]) => parseFloat(balance) > 0
        )
      : Object.entries(balances);

    result += `**Wallet:** ${walletAddress.slice(0, 6)}...${walletAddress.slice(
      -4
    )}\n`;
    result += `**Tokens with Balance:** ${filteredBalances.length}\n`;

    if (filteredBalances.length === 0) {
      result += `   📭 No tokens with balance\n\n`;
      continue;
    }

    // Sort by balance value (descending)
    filteredBalances.sort(([, a], [, b]) => parseFloat(b) - parseFloat(a));

    filteredBalances.forEach(([tokenAddress, balance]) => {
      const tokenSymbol = getTokenSymbol(tokenAddress, chainId);
      const formattedBalance = formatBalance(balance);

      result += `   **${tokenSymbol}:** ${formattedBalance}\n`;
    });

    result += `\n`;
  }

  result += `⏰ **Note:** Balances are real-time and may change with new transactions.`;
  return result;
}

// Create the balance tool
export const balanceTool = new DynamicStructuredTool({
  name: "token_balances",
  description:
    "Get token balances for wallet addresses using 1inch Balance API. Supports single wallet, custom tokens, or multiple wallets analysis.",
  schema: z.object({
    operation: z
      .enum(["all_balances", "custom_tokens", "multiple_wallets"])
      .describe(
        "Operation to perform: 'all_balances' for all tokens in a wallet, 'custom_tokens' for specific tokens in a wallet, 'multiple_wallets' for specific tokens across multiple wallets"
      ),
    walletAddress: z
      .string()
      .optional()
      .describe(
        "Wallet address to check balances (required for 'all_balances' and 'custom_tokens'). Must be a valid Ethereum address"
      ),
    wallets: z
      .array(z.string())
      .optional()
      .describe(
        "Array of wallet addresses (required for 'multiple_wallets'). Each must be a valid Ethereum address"
      ),
    tokens: z
      .array(z.string())
      .optional()
      .describe(
        "Array of token contract addresses (required for 'custom_tokens' and 'multiple_wallets'). Each must be a valid contract address"
      ),
    chain: z
      .string()
      .optional()
      .describe(
        "Blockchain network (ethereum, polygon, bsc, arbitrum, etc.). Defaults to ethereum"
      ),
    showZeroBalances: z
      .boolean()
      .optional()
      .describe(
        "Whether to show tokens with zero balances. Defaults to false (only non-zero balances shown)"
      ),
  }),
  func: async ({
    operation,
    walletAddress,
    wallets = [],
    tokens = [],
    chain = "ethereum",
    showZeroBalances = false,
  }) => {
    try {
      // Validate chain
      const chainId =
        BALANCE_SUPPORTED_CHAINS[
          chain.toLowerCase() as keyof typeof BALANCE_SUPPORTED_CHAINS
        ];
      if (!chainId) {
        return `Error: Unsupported chain "${chain}". Supported chains: ${Object.keys(
          BALANCE_SUPPORTED_CHAINS
        ).join(", ")}`;
      }

      const chainName = chain.charAt(0).toUpperCase() + chain.slice(1);

      switch (operation) {
        case "all_balances": {
          if (!walletAddress) {
            return "Error: Wallet address is required for getting all balances.";
          }

          // Validate wallet address format
          if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            return "Error: Invalid wallet address format. Must be a valid Ethereum address (0x followed by 40 hex characters).";
          }

          const balances = await getAllBalances(chainId, walletAddress);
          return formatWalletBalances(
            balances,
            chainName,
            chainId,
            walletAddress,
            !showZeroBalances
          );
        }

        case "custom_tokens": {
          if (!walletAddress) {
            return "Error: Wallet address is required for getting custom token balances.";
          }

          if (!tokens || tokens.length === 0) {
            return "Error: Tokens array is required for custom token balances. Please provide token contract addresses.";
          }

          // Validate wallet address format
          if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            return "Error: Invalid wallet address format. Must be a valid Ethereum address.";
          }

          // Validate token addresses
          const invalidTokens = tokens.filter(
            (token) => !/^0x[a-fA-F0-9]{40}$/.test(token)
          );
          if (invalidTokens.length > 0) {
            return `Error: Invalid token address(es): ${invalidTokens.join(
              ", "
            )}. All must be valid contract addresses.`;
          }

          const balances = await getCustomTokenBalances(
            chainId,
            walletAddress,
            tokens
          );
          return formatWalletBalances(
            balances,
            chainName,
            chainId,
            walletAddress,
            !showZeroBalances
          );
        }

        case "multiple_wallets": {
          if (!wallets || wallets.length === 0) {
            return "Error: Wallets array is required for multiple wallets analysis. Please provide wallet addresses.";
          }

          if (!tokens || tokens.length === 0) {
            return "Error: Tokens array is required for multiple wallets analysis. Please provide token contract addresses.";
          }

          // Validate wallet addresses
          const invalidWallets = wallets.filter(
            (wallet) => !/^0x[a-fA-F0-9]{40}$/.test(wallet)
          );
          if (invalidWallets.length > 0) {
            return `Error: Invalid wallet address(es): ${invalidWallets.join(
              ", "
            )}. All must be valid Ethereum addresses.`;
          }

          // Validate token addresses
          const invalidTokens = tokens.filter(
            (token) => !/^0x[a-fA-F0-9]{40}$/.test(token)
          );
          if (invalidTokens.length > 0) {
            return `Error: Invalid token address(es): ${invalidTokens.join(
              ", "
            )}. All must be valid contract addresses.`;
          }

          const walletsBalances = await getMultipleWalletsBalances(
            chainId,
            wallets,
            tokens
          );
          return formatMultipleWalletsBalances(
            walletsBalances,
            chainName,
            chainId,
            !showZeroBalances
          );
        }

        default:
          return "Error: Invalid operation. Use 'all_balances', 'custom_tokens', or 'multiple_wallets'";
      }
    } catch (error: any) {
      console.error("Balance tool error:", error);

      if (
        error.message.includes("Balance API error") ||
        error.message.includes("Custom Balance API error") ||
        error.message.includes("Multiple Wallets Balance API error")
      ) {
        return `Error: ${error.message}. Please check your API key and try again.`;
      }

      return `Error performing balance operation: ${error.message}`;
    }
  },
});
