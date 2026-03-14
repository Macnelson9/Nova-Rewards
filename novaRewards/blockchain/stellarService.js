require('dotenv').config();
const { Horizon, Asset, StrKey } = require('stellar-sdk');

// Shared Horizon server instance
const server = new Horizon.Server(
  process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org'
);

// NOVA asset definition — issued by the Issuer Account
const NOVA = new Asset('NOVA', process.env.ISSUER_PUBLIC);

/**
 * Validates that a string is a valid Stellar public key.
 * Must be a 56-character G-prefixed Ed25519 public key.
 * Requirements: 5.1
 *
 * @param {string} address
 * @returns {boolean}
 */
function isValidStellarAddress(address) {
  if (typeof address !== 'string') return false;
  try {
    return StrKey.isValidEd25519PublicKey(address);
  } catch {
    return false;
  }
}

/**
 * Queries Horizon for the account's current NOVA token balance.
 * Returns '0' if the account has no trustline for NOVA.
 * Requirements: 6.1, 8.3
 *
 * @param {string} walletAddress - Stellar public key
 * @returns {Promise<string>} NOVA balance as a string (e.g. "100.0000000")
 */
async function getNOVABalance(walletAddress) {
  const account = await server.loadAccount(walletAddress);
  const novaBalance = account.balances.find(
    (b) =>
      b.asset_type !== 'native' &&
      b.asset_code === 'NOVA' &&
      b.asset_issuer === process.env.ISSUER_PUBLIC
  );
  return novaBalance ? novaBalance.balance : '0';
}

module.exports = { server, NOVA, isValidStellarAddress, getNOVABalance };
