/**
 * Required environment variables for the NovaRewards backend.
 * Requirements: 11.1, 11.3
 */
const REQUIRED_ENV_VARS = [
  'ISSUER_PUBLIC',
  'ISSUER_SECRET',
  'DISTRIBUTION_PUBLIC',
  'DISTRIBUTION_SECRET',
  'STELLAR_NETWORK',
  'HORIZON_URL',
  'DATABASE_URL',
];

/**
 * Validates that all required environment variables are set.
 * Logs each missing key and throws an error to halt server initialization.
 * Requirements: 11.3
 *
 * @throws {Error} if any required env vars are missing
 */
function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    missing.forEach((key) => {
      console.error(`[validateEnv] Missing required environment variable: ${key}`);
    });
    throw new Error(
      `Server startup aborted. Missing environment variables: ${missing.join(', ')}`
    );
  }
}

module.exports = { validateEnv, REQUIRED_ENV_VARS };
