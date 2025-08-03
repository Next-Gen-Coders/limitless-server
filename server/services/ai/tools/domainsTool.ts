import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ENV } from "../../../config/env";

// 1inch Domains API base URL
const ONEINCH_DOMAINS_API_BASE = "https://api.1inch.dev/domains/v2.0";

// Interface for provider response with avatar
interface ProviderResponseWithAvatar {
  protocol: string;
  domain: string;
  address: string;
  avatar: string;
}

interface AvatarsResponse {
  result: ProviderResponseWithAvatar[];
}

// Interface for reverse lookup response
interface ProviderReverseResponse {
  protocol: string;
  domain: string;
  checkUrl: string;
}

interface ReverseLookupResponse {
  [address: string]: ProviderReverseResponse[];
}

// Get provider data with avatar for address or domain
async function getProviderDataWithAvatar(
  addressOrDomain: string
): Promise<AvatarsResponse> {
  try {
    const url = `${ONEINCH_DOMAINS_API_BASE}/get-providers-data-with-avatar`;

    const response = await fetch(
      `${url}?${new URLSearchParams({ addressOrDomain })}`,
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
      console.error("Domains API error (get-providers-data-with-avatar):", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Domains API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not fetch provider data with avatar:", error);
    throw error;
  }
}

// Reverse lookup domains for addresses
async function reverseLookupBatch(
  addresses: string[]
): Promise<ReverseLookupResponse> {
  try {
    const url = `${ONEINCH_DOMAINS_API_BASE}/reverse-lookup-batch`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(addresses),
    });

    if (response.ok) {
      return response.json();
    } else {
      const errorText = await response.text();
      console.error("Domains API error (reverse-lookup-batch):", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Domains API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not perform reverse lookup:", error);
    throw error;
  }
}

// Helper function to validate Ethereum address
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Helper function to validate domain name
function isValidDomain(domain: string): boolean {
  // Basic domain validation (can be improved)
  return (
    /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/.test(domain) ||
    /^[a-zA-Z0-9][a-zA-Z0-9-]*\.eth$/.test(domain)
  );
}

// Helper function to format address (return full address)
function formatAddress(address: string): string {
  return address;
}

// Create the domains tool
export const domainsTool = new DynamicStructuredTool({
  name: "domain_operations",
  description:
    "Get domain information, avatars, and reverse lookup domains for addresses using 1inch Domains API. Supports ENS and other domain protocols.",
  schema: z.object({
    operation: z
      .enum(["get_provider_data", "reverse_lookup"])
      .describe(
        "Operation type: 'get_provider_data' to get domain/avatar info for address or domain, 'reverse_lookup' to find domains for addresses"
      ),
    addressOrDomain: z
      .string()
      .optional()
      .describe(
        "Address or domain for get_provider_data operation (e.g., 'vitalik.eth' or '0x...')"
      ),
    addresses: z
      .array(z.string())
      .optional()
      .describe(
        "Array of addresses for reverse_lookup operation (e.g., ['0x...', '0x...'])"
      ),
  }),
  func: async ({ operation, addressOrDomain, addresses }) => {
    try {
      console.log("Domains tool called with:", {
        operation,
        addressOrDomain,
        addresses,
      });

      if (operation === "get_provider_data") {
        // Validate required parameter
        if (!addressOrDomain) {
          return "Error: addressOrDomain parameter is required for get_provider_data operation";
        }

        // Validate address or domain format
        if (
          !isValidAddress(addressOrDomain) &&
          !isValidDomain(addressOrDomain)
        ) {
          return `Error: Invalid address or domain format: ${addressOrDomain}. Must be a valid Ethereum address (0x...) or domain name (e.g., vitalik.eth)`;
        }

        console.log("Calling getProviderDataWithAvatar for:", addressOrDomain);
        const result = await getProviderDataWithAvatar(addressOrDomain);
        console.log("getProviderDataWithAvatar result:", result);

        if (!result.result || result.result.length === 0) {
          return `📝 **No Domain Data Found**\n\nNo domain information found for: ${addressOrDomain}\n\nThis address/domain may not have any associated domain registrations or avatars.`;
        }

        let response = `🌐 **Domain Information Retrieved**\n\n`;
        response += `**Query:** ${addressOrDomain}\n`;
        response += `**Results Found:** ${result.result.length}\n\n`;

        result.result.forEach((provider, index) => {
          response += `**${index + 1}. ${provider.protocol} Domain**\n`;
          response += `• **Domain:** ${provider.domain}\n`;
          response += `• **Address:** ${formatAddress(provider.address)}\n`;
          response += `• **Protocol:** ${provider.protocol}\n`;
          if (provider.avatar) {
            response += `• **Avatar:** ${provider.avatar}\n`;
          }
          response += `\n`;
        });

        console.log("Domains tool returning response:", response);
        return response;
      } else if (operation === "reverse_lookup") {
        // Validate required parameter
        if (!addresses || addresses.length === 0) {
          return "Error: addresses parameter is required for reverse_lookup operation and must contain at least one address";
        }

        // Validate all addresses
        const invalidAddresses = addresses.filter(
          (addr) => !isValidAddress(addr)
        );
        if (invalidAddresses.length > 0) {
          return `Error: Invalid address format(s): ${invalidAddresses.join(
            ", "
          )}. All addresses must be valid Ethereum addresses (0x...)`;
        }

        if (addresses.length > 100) {
          return "Error: Maximum 100 addresses allowed per batch lookup";
        }

        const result = await reverseLookupBatch(addresses);

        let response = `🔍 **Reverse Domain Lookup Results**\n\n`;
        response += `**Addresses Queried:** ${addresses.length}\n\n`;

        let foundResults = 0;
        addresses.forEach((address) => {
          const domains = result[address];

          if (domains && domains.length > 0) {
            foundResults++;
            response += `**${formatAddress(address)}**\n`;
            domains.forEach((domain, index) => {
              response += `  ${index + 1}. **${domain.domain}** (${
                domain.protocol
              })\n`;
              if (domain.checkUrl) {
                response += `     • Check URL: ${domain.checkUrl}\n`;
              }
            });
            response += `\n`;
          }
        });

        if (foundResults === 0) {
          response += `❌ **No Domains Found**\n\nNone of the provided addresses have associated domain names.\n`;
          response += `**Addresses Checked:**\n`;
          addresses.forEach((addr) => {
            response += `• ${formatAddress(addr)}\n`;
          });
        } else {
          response += `✅ **Summary:** Found domains for ${foundResults} out of ${addresses.length} addresses`;
        }

        return response;
      } else {
        return "Error: Invalid operation. Use 'get_provider_data' or 'reverse_lookup'";
      }
    } catch (error: any) {
      console.error("Domains tool error:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        operation,
        addressOrDomain,
        addresses,
      });

      if (error.message.includes("Domains API error")) {
        return `${error.message}. Please check your API key and try again.`;
      }

      return `Error performing domain operation: ${error.message}`;
    }
  },
});
