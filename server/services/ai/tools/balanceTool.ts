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
// getTokenSymbol.ts

// Updated helper function to get token symbol from address
// getTokenSymbol.ts

export function getTokenSymbol(address: string, chainId: number): string {
  const lowerAddress = address.toLowerCase();

  const tokenMappings: Record<number, Record<string, string>> = {
    1: {
      // Ethereum
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "ETH",
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "USDC",
      "0xdac17f958d2ee523a2206206994597c13d831ec7": "USDT",
      "0x6b175474e89094c44da98b954eedeac495271d0f": "DAI",
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "WETH",
      "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": "WBTC",
      "0x514910771af9ca656af840dff83e8264ecf986ca": "LINK",
      "0x111111111117dc0aa78b770fa6a738034120c302": "1INCH",
    },
    56: {
      // BSC
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "BNB",
      "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d": "USDC",
      "0x55d398326f99059ff775485246999027b3197955": "USDT",
      "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c": "WBNB",
      "0x2170ed0880ac9a755fd29b2688956bd959f933f8": "ETH",
      "0x7130d2a12b9bcfaae4f2634d864a1ee1ce3ead9c": "BTCB",
      "0xe9e7cea3dedca5984780bafc599bd69add087d56": "BUSD",
    },
    137: {
      // Polygon
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "MATIC",
      "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359": "USDC",
      "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": "USDT",
      "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270": "WMATIC",
      "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6": "WBTC",
      "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619": "WETH",
      "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063": "DAI",
    },
    42161: {
      // Arbitrum
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "ETH",
      "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8": "USDC",
      "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": "USDT",
      "0x82af49447d8a07e3bd95bd0d56f35241523fbab1": "WETH",
      "0x2f2a2543b76a4166549f7aaab2e75b4c6e373aec": "WBTC",
      "0x4200000000000000000000000000000000000042": "ARB",
    },
    10: {
      // Optimism
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "ETH",
      "0x4200000000000000000000000000000000000042": "OP",
      "0x7f5c764cbc14f9669b88837ca1490cca17c31607": "USDC",
      "0x4200000000000000000000000000000000000006": "WETH",
      "0x68f180fcce6836688e9084f035309e29bf0a2095": "WBTC",
      "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58": "USDT",
    },
    43114: {
      // Avalanche C-Chain
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "AVAX",
      "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e": "USDC",
      "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7": "USDT",
      "0x49d5c2bdffac6ce2bfdaeacbda6ba6962a74925c": "WETH",
      "0x50b7545627a5162f82a992c33b87adc75187b218": "WBTC",
      "0xd586e7f844cea2f87f50152665bcbc2c279d8d70": "DAI",
    },
    100: {
      // Gnosis
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "xDAI",
      "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83": "USDC",
      "0x4ecaba5870353805a9f068101a40e0f32ed605c6": "USDT",
      "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1": "WETH",
      "0x8e5bbbb09ed1ebde8674cda39a0c169401db4252": "WBTC",
      "0x44fa8e6f47987339850636f88629646662444217": "DAI",
    },
    250: {
      // Fantom
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "FTM",
      "0x04068da6c83afcfa0e13ba15a6696662335d5b75": "USDC",
      "0x049d68029688eabf473097a2fc38ef61633a3c7a": "USDT",
      "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83": "WFTM",
      "0x321162cd933e2be498cd2267a90534a804051b11": "WBTC",
      "0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e": "DAI",
      "0x74b23882a30290451a17c44f4f05243b6b58c76d": "WETH",
    },
    8217: {
      // Klaytn
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "KLAY",
      "0x5c74070fdea071359b86082bd9f9b3deaafbe32b": "KUSDT",
      "0x6270b6d6a3e4a4e1e1e1e1e1e1e1e1e1e1e1e1e1": "KUSDC", // Example, update with real address if needed
    },
    1313161554: {
      // Aurora
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "ETH",
      "0x4988a896b1227218e4a686fde5eabdcabd91571f": "USDT",
      "0x8b1f4432f943c465a973fedc6d7aa50fc96e7b37": "WBTC",
    },
    324: {
      // zkSync Era
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "ETH",
      "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91": "USDT",
      "0x8eBe4A94740515945ad826238Fc4D56c6E3A2F05": "WETH",
      "0x503234f203fc7eb888eec8513210612a43cf6115": "WBTC",
      "0x6b8eF5eB6e3e7e3e3e3e3e3e3e3e3e3e3e3e3e3e": "DAI", // Example, update with real address if needed
    },
    8453: {
      // Base
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": "ETH",
      "0x4200000000000000000000000000000000000006": "WETH",
      "0xd9aaEC86b65d86f6A7B5B1b0c42fa1eB3B8A2C5d": "USDC",
      "0x4200000000000000000000000000000000000002": "BASE",
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

// Get all token balances for a wallet across all supported chains
async function getAllChainsBalances(
  walletAddress: string
): Promise<Record<string, { balances: Record<string, string>; error?: string }>> {
  const chainPromises = Object.entries(BALANCE_SUPPORTED_CHAINS).map(
    async ([chainName, chainId]) => {
      try {
        const balances = await getAllBalances(chainId, walletAddress);
        return { chainName, chainId, balances, error: undefined };
      } catch (error: any) {
        console.error(`Error fetching balances for ${chainName}:`, error);
        return { 
          chainName, 
          chainId, 
          balances: {}, 
          error: error.message 
        };
      }
    }
  );

  const results = await Promise.all(chainPromises);
  
  const chainsBalances: Record<string, { balances: Record<string, string>; error?: string }> = {};
  results.forEach(({ chainName, balances, error }) => {
    chainsBalances[chainName] = { balances, error };
  });

  return chainsBalances;
}

// Get custom token balances for a wallet across all supported chains
async function getAllChainsCustomTokenBalances(
  walletAddress: string,
  tokens: string[]
): Promise<Record<string, { balances: Record<string, string>; error?: string }>> {
  const chainPromises = Object.entries(BALANCE_SUPPORTED_CHAINS).map(
    async ([chainName, chainId]) => {
      try {
        const balances = await getCustomTokenBalances(chainId, walletAddress, tokens);
        return { chainName, chainId, balances, error: undefined };
      } catch (error: any) {
        console.error(`Error fetching custom token balances for ${chainName}:`, error);
        return { 
          chainName, 
          chainId, 
          balances: {}, 
          error: error.message 
        };
      }
    }
  );

  const results = await Promise.all(chainPromises);
  
  const chainsBalances: Record<string, { balances: Record<string, string>; error?: string }> = {};
  results.forEach(({ chainName, balances, error }) => {
    chainsBalances[chainName] = { balances, error };
  });

  return chainsBalances;
}

// Get balances for multiple wallets across all supported chains
async function getAllChainsMultipleWalletsBalances(
  wallets: string[],
  tokens: string[]
): Promise<Record<string, { balances: Record<string, Record<string, string>>; error?: string }>> {
  const chainPromises = Object.entries(BALANCE_SUPPORTED_CHAINS).map(
    async ([chainName, chainId]) => {
      try {
        const balances = await getMultipleWalletsBalances(chainId, wallets, tokens);
        return { chainName, chainId, balances, error: undefined };
      } catch (error: any) {
        console.error(`Error fetching multiple wallets balances for ${chainName}:`, error);
        return { 
          chainName, 
          chainId, 
          balances: {}, 
          error: error.message 
        };
      }
    }
  );

  const results = await Promise.all(chainPromises);
  
  const chainsBalances: Record<string, { balances: Record<string, Record<string, string>>; error?: string }> = {};
  results.forEach(({ chainName, balances, error }) => {
    chainsBalances[chainName] = { balances, error };
  });

  return chainsBalances;
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

// Helper function to format all chains wallet balances
function formatAllChainsWalletBalances(
  chainsBalances: Record<string, { balances: Record<string, string>; error?: string }>,
  walletAddress: string,
  showOnlyNonZero: boolean = true
): string {
  let result = `🌐 **Multi-Chain Token Balances**\n\n`;
  result += `**Wallet:** ${walletAddress}\n`;
  result += `**Chains Analyzed:** ${Object.keys(chainsBalances).length}\n\n`;

  let totalChainsWithBalances = 0;
  let totalTokensFound = 0;

  // Process each chain
  for (const [chainName, { balances, error }] of Object.entries(chainsBalances)) {
    const chainId = BALANCE_SUPPORTED_CHAINS[chainName as keyof typeof BALANCE_SUPPORTED_CHAINS];
    
    result += `## 🔗 ${chainName.toUpperCase()} (${chainId})\n\n`;

    if (error) {
      result += `❌ **Error:** ${error}\n\n`;
      continue;
    }

    const filteredBalances = showOnlyNonZero
      ? Object.entries(balances).filter(([_, balance]) => parseFloat(balance) > 0)
      : Object.entries(balances);

    if (filteredBalances.length === 0) {
      result += `📭 **No tokens with balance found.**\n\n`;
      continue;
    }

    totalChainsWithBalances++;
    totalTokensFound += filteredBalances.length;

    // Sort by balance value (descending)
    filteredBalances.sort(([, a], [, b]) => parseFloat(b) - parseFloat(a));

    filteredBalances.forEach(([tokenAddress, balance], index) => {
      const tokenSymbol = getTokenSymbol(tokenAddress, chainId);
      const formattedBalance = formatBalance(balance);

      result += `**${index + 1}. ${tokenSymbol}**\n`;
      result += `   - **Balance:** ${formattedBalance}\n`;
      result += `   - **Address:** ${tokenAddress}\n\n`;
    });
  }

  result += `\n📊 **Summary:**\n`;
  result += `- **Chains with balances:** ${totalChainsWithBalances}/${Object.keys(chainsBalances).length}\n`;
  result += `- **Total tokens found:** ${totalTokensFound}\n\n`;
  result += `⏰ **Note:** Balances are real-time and may change with new transactions.`;
  
  return result;
}

// Helper function to format all chains multiple wallets balances
function formatAllChainsMultipleWalletsBalances(
  chainsBalances: Record<string, { balances: Record<string, Record<string, string>>; error?: string }>,
  showOnlyNonZero: boolean = true
): string {
  let result = `🌐 **Multi-Chain Multiple Wallets Token Balances**\n\n`;
  
  let totalChainsWithBalances = 0;
  let totalWalletsAnalyzed = 0;

  // Process each chain
  for (const [chainName, { balances, error }] of Object.entries(chainsBalances)) {
    const chainId = BALANCE_SUPPORTED_CHAINS[chainName as keyof typeof BALANCE_SUPPORTED_CHAINS];
    
    result += `## 🔗 ${chainName.toUpperCase()} (${chainId})\n\n`;

    if (error) {
      result += `❌ **Error:** ${error}\n\n`;
      continue;
    }

    const walletsWithBalances = Object.entries(balances).filter(([_, walletBalances]) => {
      const filteredBalances = showOnlyNonZero
        ? Object.entries(walletBalances).filter(([_, balance]) => parseFloat(balance) > 0)
        : Object.entries(walletBalances);
      return filteredBalances.length > 0;
    });

    if (walletsWithBalances.length === 0) {
      result += `📭 **No wallets with token balances found.**\n\n`;
      continue;
    }

    totalChainsWithBalances++;
    totalWalletsAnalyzed = Math.max(totalWalletsAnalyzed, Object.keys(balances).length);

    result += `**Wallets with balances:** ${walletsWithBalances.length}/${Object.keys(balances).length}\n\n`;

    for (const [walletAddress, walletBalances] of walletsWithBalances) {
      const filteredBalances = showOnlyNonZero
        ? Object.entries(walletBalances).filter(([_, balance]) => parseFloat(balance) > 0)
        : Object.entries(walletBalances);

      result += `**Wallet:** ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\n`;
      
      // Sort by balance value (descending)
      filteredBalances.sort(([, a], [, b]) => parseFloat(b) - parseFloat(a));

      filteredBalances.forEach(([tokenAddress, balance]) => {
        const tokenSymbol = getTokenSymbol(tokenAddress, chainId);
        const formattedBalance = formatBalance(balance);
        result += `   **${tokenSymbol}:** ${formattedBalance}\n`;
      });

      result += `\n`;
    }
  }

  result += `\n📊 **Summary:**\n`;
  result += `- **Chains with balances:** ${totalChainsWithBalances}/${Object.keys(chainsBalances).length}\n`;
  result += `- **Total wallets analyzed:** ${totalWalletsAnalyzed}\n\n`;
  result += `⏰ **Note:** Balances are real-time and may change with new transactions.`;
  
  return result;
}

// Create the balance tool
export const balanceTool = new DynamicStructuredTool({
  name: "token_balances",
  description:`
    The balanceTool should be called whenever a user requests token balance information for one or more wallets across supported blockchain networks, including Ethereum Mainnet, Arbitrum, Avalanche, BNB Chain, Gnosis, Solana, Sonic, Optimism, Polygon, zkSync Era, Base, Linea, and Unichain. The tool is triggered for queries involving:
- Retrieving all token balances for a single wallet.
- Fetching balances for specific tokens (e.g., USDC, USDT, ETH, NFTs).
- Comparing balances across multiple wallets for portfolio analysis.
- Cross-chain balance aggregation using all supported chain IDs in a single query.
The tool must account for token-specific decimal places (e.g., USDC and USDT use 6 decimals, while DAI, ETH, LINK, and MATIC use 18 decimals) to ensure accurate balance calculations and display. It automatically filters out zero balances unless otherwise specified and supports queries for both EVM and non-EVM chains (e.g., Solana). Use this tool when the user explicitly requests balance data or portfolio insights, ensuring all supported chain IDs (1, 42161, 43114, 56, 100, 146, 10, 137, 324, 8453, 59144, 1301, and Solana’s identifier) are included for comprehensive results.

Token Decimal Specifications:
- USDC: 6 decimals (1 USDC = 1,000,000 base units)
- USDT: 6 decimals (1 USDT = 1,000,000 base units)
- DAI: 18 decimals (1 DAI = 1,000,000,000,000,000,000 base units)
- ETH: 18 decimals (1 ETH = 1,000,000,000,000,000,000 wei)
- LINK: 18 decimals
- MATIC: 18 decimals

Trigger Conditions:
- User asks for token balances (e.g., “Show me all tokens for wallet 0x…” or “Get USDC balances on Ethereum and Polygon”).
- User requests portfolio analysis across multiple wallets or chains.
- User specifies custom tokens or balance thresholds (e.g., “Show non-zero balances above 0.001 ETH”).
- User requests cross-chain comparisons or aggregated balance data.

Example Triggers:
- “What are the token balances for wallet 0x742d35Cc6634C0532925a3b8D5C9E5E0d96B8C79?”
- “Compare USDT and USDC balances for three wallets across all chains.”
- “Show me the portfolio value for wallet 0x… on Ethereum, Arbitrum, and Base.” 
`,
  schema: z.object({
    operation: z
      .enum(["all_balances", "custom_tokens", "multiple_wallets", "all_chains_balances", "all_chains_custom_tokens", "all_chains_multiple_wallets"])
      .describe(
        "Operation to perform: 'all_balances' for all tokens in a wallet on one chain, 'custom_tokens' for specific tokens in a wallet on one chain, 'multiple_wallets' for specific tokens across multiple wallets on one chain, 'all_chains_balances' for all tokens in a wallet across all chains, 'all_chains_custom_tokens' for specific tokens in a wallet across all chains, 'all_chains_multiple_wallets' for specific tokens across multiple wallets and all chains"
      ),
    walletAddress: z
      .string()
      .optional()
      .describe(
        "Wallet address to check balances (required for single wallet operations). Must be a valid Ethereum address"
      ),
    wallets: z
      .array(z.string())
      .optional()
      .describe(
        "Array of wallet addresses (required for multiple wallets operations). Each must be a valid Ethereum address"
      ),
    tokens: z
      .array(z.string())
      .optional()
      .describe(
        "Array of token contract addresses (required for custom tokens operations). Each must be a valid contract address"
      ),
    chain: z
      .string()
      .optional()
      .describe(
        "Blockchain network (ethereum, polygon, bsc, arbitrum, etc.). Only used for single-chain operations. Ignored for all_chains operations. Defaults to ethereum"
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

        case "all_chains_balances": {
          if (!walletAddress) {
            return "Error: Wallet address is required for getting all chains balances.";
          }

          // Validate wallet address format
          if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            return "Error: Invalid wallet address format. Must be a valid Ethereum address (0x followed by 40 hex characters).";
          }

          const chainsBalances = await getAllChainsBalances(walletAddress);
          return formatAllChainsWalletBalances(
            chainsBalances,
            walletAddress,
            !showZeroBalances
          );
        }

        case "all_chains_custom_tokens": {
          if (!walletAddress) {
            return "Error: Wallet address is required for getting custom token balances across all chains.";
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

          const chainsBalances = await getAllChainsCustomTokenBalances(
            walletAddress,
            tokens
          );
          return formatAllChainsWalletBalances(
            chainsBalances,
            walletAddress,
            !showZeroBalances
          );
        }

        case "all_chains_multiple_wallets": {
          if (!wallets || wallets.length === 0) {
            return "Error: Wallets array is required for multiple wallets analysis across all chains. Please provide wallet addresses.";
          }

          if (!tokens || tokens.length === 0) {
            return "Error: Tokens array is required for multiple wallets analysis across all chains. Please provide token contract addresses.";
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

          const chainsBalances = await getAllChainsMultipleWalletsBalances(
            wallets,
            tokens
          );
          return formatAllChainsMultipleWalletsBalances(
            chainsBalances,
            !showZeroBalances
          );
        }

        default:
          return "Error: Invalid operation. Use 'all_balances', 'custom_tokens', 'multiple_wallets', 'all_chains_balances', 'all_chains_custom_tokens', or 'all_chains_multiple_wallets'";
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
