import dotenv from "dotenv";

// Configure dotenv as early as possible
dotenv.config();

// Export environment variables with validation
export const ENV = {
  DATABASE_URL: process.env.DATABASE_URL!,
  DIRECT_URL: process.env.DIRECT_URL!,
  FRONTEND_URL: process.env.FRONTEND_URL,
  PRIVY_APP_ID: process.env.PRIVY_APP_ID,
  PRIVY_APP_SECRET: process.env.PRIVY_APP_SECRET,
} as const;

// Validate required environment variables
const requiredEnvVars = ["DATABASE_URL", "DIRECT_URL"];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
}
