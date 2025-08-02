import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ENV } from "../../../config/env";

// 1inch NFT API base URL
const ONEINCH_NFT_API_BASE = "https://api.1inch.dev/nft/v2";

// Supported chains for NFT API
export const NFT_SUPPORTED_CHAINS = {
  ethereum: 1,
  polygon: 137,
  arbitrum: 42161,
  avalanche: 43114,
  gnosis: 100,
  klaytn: 8217,
  optimism: 10,
  base: 8453,
} as const;

// NFT Providers
export const NFT_PROVIDERS = {
  opensea: "OPENSEA",
  rarible: "RARIBLE",
  poap: "POAP",
} as const;

// Get supported chains for NFT API
async function getSupportedChains(): Promise<number[]> {
  try {
    const response = await fetch(`${ONEINCH_NFT_API_BASE}/supportedchains`, {
      headers: {
        Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
        accept: "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data; // Should return array of chain IDs
    } else {
      console.warn(
        `Supported chains fetch failed: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    console.warn("Could not fetch supported chains:", error);
  }
  return [];
}

// Get NFTs by address
async function getNFTsByAddress(params: {
  chainIds: number[];
  address: string;
  limit?: number;
  offset?: number;
  openseaNextToken?: string;
}) {
  try {
    const searchParams = new URLSearchParams();

    // Add chain IDs as separate parameters
    params.chainIds.forEach((chainId) => {
      searchParams.append("chainIds", chainId.toString());
    });

    searchParams.append("address", params.address);

    if (params.limit) {
      searchParams.append("limit", params.limit.toString());
    }
    if (params.offset) {
      searchParams.append("offset", params.offset.toString());
    }
    if (params.openseaNextToken) {
      searchParams.append("openseaNextToken", params.openseaNextToken);
    }

    const response = await fetch(
      `${ONEINCH_NFT_API_BASE}/byaddress?${searchParams}`,
      {
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
      console.error("NFT fetch error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `NFT API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not fetch NFTs:", error);
    throw error;
  }
}

// Get single NFT details
async function getNFTDetails(params: {
  chainId: number;
  contract: string;
  id: string;
  provider: string;
}) {
  try {
    const searchParams = new URLSearchParams({
      chainId: params.chainId.toString(),
      contract: params.contract,
      id: params.id,
      provider: params.provider,
    });

    const response = await fetch(
      `${ONEINCH_NFT_API_BASE}/contract?${searchParams}`,
      {
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
      console.error("NFT details fetch error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `NFT API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not fetch NFT details:", error);
    throw error;
  }
}

// Helper function to format NFT list
function formatNFTList(nfts: any[], address: string, chains: string[]): string {
  if (!nfts || nfts.length === 0) {
    return `No NFTs found for address ${address} on chains: ${chains.join(
      ", "
    )}`;
  }

  const total = nfts.length;
  const preview = nfts.slice(0, 5); // Show first 5 NFTs

  let result = `🖼️ **NFT Collection for ${address}**\n\n`;
  result += `**Total NFTs found:** ${total}\n`;
  result += `**Chains searched:** ${chains.join(", ")}\n\n`;

  preview.forEach((nft, index) => {
    const chainName =
      Object.keys(NFT_SUPPORTED_CHAINS).find(
        (key) =>
          NFT_SUPPORTED_CHAINS[key as keyof typeof NFT_SUPPORTED_CHAINS] ===
          nft.chainId
      ) || `Chain ${nft.chainId}`;

    result += `**${index + 1}. ${nft.name || "Unnamed NFT"}**\n`;
    result += `   - **Token ID:** ${nft.token_id}\n`;
    result += `   - **Chain:** ${chainName} (${nft.chainId})\n`;
    result += `   - **Contract:** ${nft.asset_contract?.address || "N/A"}\n`;
    result += `   - **Provider:** ${nft.provider}\n`;
    if (nft.image_url) {
      result += `   - **Image:** ${nft.image_url}\n`;
    }
    result += `\n`;
  });

  if (total > 5) {
    result += `... and ${total - 5} more NFTs\n\n`;
  }

  result += `💡 **Tip:** Use the NFT details tool to get more information about a specific NFT.`;

  return result;
}

// Helper function to format single NFT details
function formatNFTDetails(nft: any): string {
  let result = `🖼️ **NFT Details**\n\n`;

  result += `**Name:** ${nft.name || "Unnamed NFT"}\n`;
  result += `**Token ID:** ${nft.token_id}\n`;
  result += `**Chain:** ${
    Object.keys(NFT_SUPPORTED_CHAINS).find(
      (key) =>
        NFT_SUPPORTED_CHAINS[key as keyof typeof NFT_SUPPORTED_CHAINS] ===
        nft.chainId
    ) || `Chain ${nft.chainId}`
  } (${nft.chainId})\n`;
  result += `**Provider:** ${nft.provider}\n`;

  if (nft.description) {
    result += `**Description:** ${nft.description}\n`;
  }

  if (nft.asset_contract) {
    result += `**Contract Address:** ${nft.asset_contract.address}\n`;
    result += `**Contract Type:** ${nft.asset_contract.schema_name}\n`;
  }

  if (nft.collection) {
    result += `\n**Collection:**\n`;
    result += `   - **Name:** ${nft.collection.name}\n`;
    if (nft.collection.description) {
      result += `   - **Description:** ${nft.collection.description}\n`;
    }
  }

  if (nft.creator) {
    result += `\n**Creator:**\n`;
    result += `   - **Address:** ${nft.creator.address}\n`;
    if (nft.creator.profile_img_url) {
      result += `   - **Profile Image:** ${nft.creator.profile_img_url}\n`;
    }
  }

  if (nft.traits && nft.traits.length > 0) {
    result += `\n**Traits:**\n`;
    nft.traits.slice(0, 10).forEach((trait: any) => {
      result += `   - ${trait.trait_type || "Property"}: ${trait.value}\n`;
    });
    if (nft.traits.length > 10) {
      result += `   ... and ${nft.traits.length - 10} more traits\n`;
    }
  }

  if (nft.image_url) {
    result += `\n**Image:** ${nft.image_url}\n`;
  }

  if (nft.permalink) {
    result += `**Permalink:** ${nft.permalink}\n`;
  }

  return result;
}

// Create the NFT tool with multiple operations
export const nftTool = new DynamicStructuredTool({
  name: "nft_operations",
  description:
    "Get NFT information including supported chains, NFT collections by address, and detailed NFT information across multiple blockchains",
  schema: z.object({
    operation: z
      .enum(["supported_chains", "get_nfts", "nft_details"])
      .describe(
        "Operation to perform: 'supported_chains' for available chains, 'get_nfts' for NFTs by address, 'nft_details' for specific NFT info"
      ),
    address: z
      .string()
      .optional()
      .describe(
        "Wallet address to get NFTs for (required for 'get_nfts' operation)"
      ),
    chains: z
      .array(z.string())
      .optional()
      .describe(
        "Array of chain names to search (ethereum, polygon, arbitrum, etc.). Defaults to ['ethereum']"
      ),
    limit: z
      .number()
      .optional()
      .describe("Maximum number of NFTs to return (for 'get_nfts')"),
    offset: z
      .number()
      .optional()
      .describe("Offset for pagination (for 'get_nfts')"),
    contract: z
      .string()
      .optional()
      .describe("Contract address of the NFT (required for 'nft_details')"),
    tokenId: z
      .string()
      .optional()
      .describe("Token ID of the NFT (required for 'nft_details')"),
    provider: z
      .enum(["opensea", "rarible", "poap"])
      .optional()
      .describe("NFT provider for detailed info (required for 'nft_details')"),
    chainId: z
      .number()
      .optional()
      .describe(
        "Specific chain ID for NFT details (required for 'nft_details')"
      ),
  }),
  func: async ({
    operation,
    address,
    chains = ["ethereum"],
    limit = 10,
    offset = 0,
    contract,
    tokenId,
    provider = "opensea",
    chainId,
  }) => {
    try {
      switch (operation) {
        case "supported_chains": {
          const supportedChains = await getSupportedChains();
          const chainNames = supportedChains.map((id) => {
            const chainName = Object.keys(NFT_SUPPORTED_CHAINS).find(
              (key) =>
                NFT_SUPPORTED_CHAINS[
                  key as keyof typeof NFT_SUPPORTED_CHAINS
                ] === id
            );
            return `${chainName || "Unknown"} (${id})`;
          });

          return `🔗 **Supported Chains for NFT API**\n\n${chainNames.join(
            "\n"
          )}\n\n**Total:** ${supportedChains.length} chains supported`;
        }

        case "get_nfts": {
          if (!address) {
            return "Error: Address is required for getting NFTs";
          }

          // Validate wallet address
          if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
            return `Error: Invalid wallet address format "${address}"`;
          }

          // Convert chain names to IDs
          const chainIds: number[] = [];
          for (const chain of chains) {
            const chainId =
              NFT_SUPPORTED_CHAINS[
                chain.toLowerCase() as keyof typeof NFT_SUPPORTED_CHAINS
              ];
            if (chainId) {
              chainIds.push(chainId);
            } else {
              return `Error: Unsupported chain "${chain}". Supported chains: ${Object.keys(
                NFT_SUPPORTED_CHAINS
              ).join(", ")}`;
            }
          }

          const nftData = await getNFTsByAddress({
            chainIds,
            address,
            limit,
            offset,
          });

          // Extract NFTs from response (handle different response structures)
          const nfts = Array.isArray(nftData)
            ? nftData
            : nftData.assets
            ? nftData.assets
            : nftData[0]?.assets
            ? nftData[0].assets
            : [];

          return formatNFTList(nfts, address, chains);
        }

        case "nft_details": {
          if (!contract || !tokenId || !chainId) {
            return "Error: Contract address, token ID, and chain ID are required for NFT details";
          }

          // Validate chain ID
          const isValidChain = (
            Object.values(NFT_SUPPORTED_CHAINS) as number[]
          ).includes(chainId);
          if (!isValidChain) {
            return `Error: Unsupported chain ID "${chainId}". Supported chains: ${Object.keys(
              NFT_SUPPORTED_CHAINS
            ).join(", ")}`;
          }

          // Validate contract address
          if (!contract.match(/^0x[a-fA-F0-9]{40}$/)) {
            return `Error: Invalid contract address format "${contract}"`;
          }

          const providerValue =
            NFT_PROVIDERS[provider as keyof typeof NFT_PROVIDERS];

          const nftDetails = await getNFTDetails({
            chainId,
            contract,
            id: tokenId,
            provider: providerValue,
          });

          return formatNFTDetails(nftDetails);
        }

        default:
          return "Error: Invalid operation. Use 'supported_chains', 'get_nfts', or 'nft_details'";
      }
    } catch (error: any) {
      console.error("NFT operation error:", error);

      if (error.message.includes("NFT API error")) {
        return `Error: ${error.message}. Please check your API key and try again.`;
      }

      return `Error performing NFT operation: ${error.message}`;
    }
  },
});
