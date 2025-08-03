import * as dotenv from "dotenv";

// Configure dotenv as early as possible
dotenv.config();

// Export environment variables with validation
export const ENV = {
  DATABASE_URL: process.env.DATABASE_URL!,
  DIRECT_URL: process.env.DIRECT_URL!,
  FRONTEND_URL: process.env.FRONTEND_URL,
  PRIVY_APP_ID: process.env.PRIVY_APP_ID,
  PRIVY_APP_SECRET: process.env.PRIVY_APP_SECRET,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ONEINCH_API_KEY: process.env.ONEINCH_API_KEY,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  RPC_URL: process.env.RPC_URL,
} as const;

// Validate required environment variables
const requiredEnvVars = [
  "DATABASE_URL",
  "DIRECT_URL",
  "PRIVY_APP_ID",
  "PRIVY_APP_SECRET",
  "OPENAI_API_KEY",
  "ONEINCH_API_KEY",
];

// Optional environment variables for server-side swap execution
// If not provided, the system will work in "quotes-only" mode where users execute swaps through their wallets
const swapEnvVars = ["PRIVATE_KEY", "RPC_URL"];
const missingSwapVars = swapEnvVars.filter((varName) => !process.env[varName]);

if (missingSwapVars.length > 0) {
  console.info(
    `ℹ️  Missing optional swap environment variables: ${missingSwapVars.join(
      ", "
    )}. Running in quotes-only mode - users will execute swaps through their wallets.`
  );
}
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
}
