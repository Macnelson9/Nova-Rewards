#!/usr/bin/env node
/**
 * NovaRewards Testnet Setup Script
 *
 * Generates fresh Issuer and Distribution keypairs (or uses existing ones from .env),
 * funds them via Friendbot, issues the NOVA asset, and prints all account details.
 *
 * Usage:
 *   node scripts/setup.js              # generate new keypairs
 *   node scripts/setup.js --use-env    # use keypairs already in .env
 *
 * Requirements: 1.1, 1.2, 1.3
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { Keypair } = require('stellar-sdk');
const path = require('path');

async function main() {
  const useEnv = process.argv.includes('--use-env');

  let issuerKeypair;
  let distributionKeypair;

  if (useEnv) {
    if (!process.env.ISSUER_SECRET || !process.env.DISTRIBUTION_SECRET) {
      console.error('ERROR: --use-env requires ISSUER_SECRET and DISTRIBUTION_SECRET in .env');
      process.exit(1);
    }
    issuerKeypair = Keypair.fromSecret(process.env.ISSUER_SECRET);
    distributionKeypair = Keypair.fromSecret(process.env.DISTRIBUTION_SECRET);
    console.log('Using keypairs from .env\n');
  } else {
    issuerKeypair = Keypair.random();
    distributionKeypair = Keypair.random();
    console.log('Generated new keypairs\n');
  }

  console.log('=== Account Details ===');
  console.log(`Issuer Public Key:        ${issuerKeypair.publicKey()}`);
  console.log(`Issuer Secret Key:        ${issuerKeypair.secret()}`);
  console.log(`Distribution Public Key:  ${distributionKeypair.publicKey()}`);
  console.log(`Distribution Secret Key:  ${distributionKeypair.secret()}`);

  if (!useEnv) {
    console.log('\n=== Add these to your .env file ===');
    console.log(`ISSUER_PUBLIC=${issuerKeypair.publicKey()}`);
    console.log(`ISSUER_SECRET=${issuerKeypair.secret()}`);
    console.log(`DISTRIBUTION_PUBLIC=${distributionKeypair.publicKey()}`);
    console.log(`DISTRIBUTION_SECRET=${distributionKeypair.secret()}`);
    console.log(`STELLAR_NETWORK=testnet`);
    console.log(`HORIZON_URL=https://horizon-testnet.stellar.org`);
    console.log('\nAfter updating .env, re-run with: node scripts/setup.js --use-env\n');
    return;
  }

  // Set env vars so issueAsset.js can read them
  process.env.ISSUER_PUBLIC = issuerKeypair.publicKey();
  process.env.ISSUER_SECRET = issuerKeypair.secret();
  process.env.DISTRIBUTION_PUBLIC = distributionKeypair.publicKey();
  process.env.DISTRIBUTION_SECRET = distributionKeypair.secret();
  process.env.STELLAR_NETWORK = process.env.STELLAR_NETWORK || 'testnet';
  process.env.HORIZON_URL = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org';

  console.log('\n=== Running Asset Issuance ===');
  const { issueAsset } = require('../blockchain/issueAsset');
  await issueAsset();

  console.log('\n=== Setup Complete ===');
  console.log('Your NovaRewards platform is ready on Stellar Testnet.');
  console.log(`NOVA asset issuer: ${issuerKeypair.publicKey()}`);
  console.log(`Distribution account: ${distributionKeypair.publicKey()}`);
  console.log('\nNext steps:');
  console.log('  1. Run database migrations: node database/migrate.js');
  console.log('  2. Start the backend:       cd backend && npm start');
  console.log('  3. Start the frontend:      cd frontend && npm run dev');
}

main().catch((err) => {
  console.error('\nSetup failed:', err.message);
  if (err.response?.data) {
    console.error('Stellar error:', JSON.stringify(err.response.data, null, 2));
  }
  process.exit(1);
});
