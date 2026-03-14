# Implementation Plan: NovaRewards

## Overview

Incremental implementation of the NovaRewards platform. Each task builds on the previous, starting with project scaffolding and core blockchain utilities, then the backend API, database layer, and finally the frontend. Tests are co-located as sub-tasks.

## Tasks

- [x] 1. Project scaffolding and environment setup
  - Create the monorepo directory structure: `novaRewards/frontend`, `novaRewards/backend`, `novaRewards/blockchain`, `novaRewards/database`, `novaRewards/scripts`
  - Initialize `package.json` in `backend/` with dependencies: `express`, `pg`, `stellar-sdk`, `dotenv`, `cors`, `uuid`
  - Initialize `package.json` in `frontend/` with Next.js, `@stellar/freighter-api`, `axios`
  - Add `jest` and `fast-check` as dev dependencies in `backend/`
  - Create `.env.example` with all required keys: `ISSUER_SECRET`, `DISTRIBUTION_SECRET`, `DISTRIBUTION_PUBLIC`, `ISSUER_PUBLIC`, `DATABASE_URL`, `STELLAR_NETWORK`, `HORIZON_URL`
  - Add `.env` and `node_modules` to `.gitignore`
  - _Requirements: 11.1, 11.2, 11.4_

- [ ] 2. Stellar service layer
  - [x] 2.1 Implement `blockchain/stellarService.js`
    - Export a configured `Horizon.Server` instance using `HORIZON_URL` from env
    - Export the `NOVA` asset definition: `new Asset('NOVA', process.env.ISSUER_PUBLIC)`
    - Export `isValidStellarAddress(address)` — returns true only for valid 56-char G-prefixed Stellar public keys
    - Export `getNOVABalance(walletAddress)` — queries Horizon for the NOVA asset balance on an account
    - _Requirements: 6.1, 8.3_

  - [x]* 2.2 Write property test for Stellar address validation
    - **Property 6: Stellar public key validation**
    - Generate arbitrary strings (random length, random chars) and assert `isValidStellarAddress` rejects them
    - Generate valid Stellar keypairs and assert `isValidStellarAddress` accepts the public key
    - **Validates: Requirements 5.1**

  - [x] 2.3 Implement `blockchain/trustline.js`
    - Export `buildTrustlineXDR(walletAddress)` — loads the account from Horizon, builds an unsigned `changeTrust` XDR for the NOVA asset, returns the XDR string
    - Export `verifyTrustline(walletAddress)` — queries Horizon account balances and returns `{ exists: boolean }`
    - _Requirements: 2.1, 2.3, 2.4_

  - [x]* 2.4 Write property test for trustline verification idempotence
    - **Property 2: Trustline verification is idempotent**
    - Mock Horizon responses; for any wallet address, call `verifyTrustline` multiple times and assert the result is identical each time
    - **Validates: Requirements 2.4**

  - [x] 2.5 Implement `blockchain/sendRewards.js`
    - Export `distributeRewards({ toWallet, amount })` — loads Distribution Account, builds a `payment` operation, signs with `DISTRIBUTION_SECRET`, submits to Horizon, returns `{ txHash, success }`
    - Before submitting, call `verifyTrustline` and throw if no trustline exists
    - _Requirements: 3.2, 3.3, 3.6_

  - [x] 2.6 Implement `blockchain/issueAsset.js`
    - Script that: funds Issuer and Distribution accounts via Friendbot (Testnet), establishes Distribution Account trustline to NOVA, sends initial supply from Issuer to Distribution Account
    - Check if trustline already exists before creating (idempotent)
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 3. Environment validation middleware
  - [x] 3.1 Implement `backend/middleware/validateEnv.js`
    - Export `validateEnv()` — checks all required env vars from a defined list; if any are missing, logs each missing key and throws an error to halt startup
    - Call `validateEnv()` at the top of `backend/server.js` before any routes are registered
    - _Requirements: 11.3_

  - [x]* 3.2 Write property test for environment validation
    - **Property 11: Missing environment variables halt startup**
    - Use fast-check to generate subsets of required env var names; for each subset, temporarily unset those vars and assert `validateEnv()` throws with a message identifying the missing keys
    - **Validates: Requirements 11.3**

- [ ] 4. Database layer
  - [x] 4.1 Create database migration scripts in `database/`
    - `001_create_merchants.sql` — merchants table
    - `002_create_users.sql` — users table
    - `003_create_campaigns.sql` — campaigns table with CHECK constraints
    - `004_create_transactions.sql` — transactions table with tx_type CHECK constraint
    - _Requirements: 7.1, 7.2, 3.4_

  - [x] 4.2 Implement `backend/db/index.js`
    - Export a `pg.Pool` instance configured from `DATABASE_URL`
    - Export query helper: `query(text, params)`
    - _Requirements: 7.1_

  - [x] 4.3 Implement `backend/db/transactionRepository.js`
    - Export `recordTransaction({ txHash, txType, amount, fromWallet, toWallet, merchantId, campaignId, stellarLedger })`
    - Export `getTransactionByHash(txHash)` — returns the full transaction record
    - Export `getTransactionsByMerchant(merchantId)` — returns all transactions for a merchant
    - Export `getMerchantTotals(merchantId)` — returns `{ totalDistributed, totalRedeemed }` by summing transaction amounts by type
    - _Requirements: 3.4, 4.3, 5.4, 6.2, 10.2_

  - [ ]* 4.4 Write property test for transaction record round-trip
    - **Property 4: Transaction record round-trip**
    - Generate random transaction objects (all three tx_types, random amounts, random wallet addresses); insert via `recordTransaction`, query via `getTransactionByHash`, assert all fields match
    - **Validates: Requirements 3.4, 4.3, 5.4**

  - [ ]* 4.5 Write property test for merchant-scoped queries
    - **Property 9: Merchant transaction queries are scoped**
    - Generate two merchants with separate transaction sets; assert `getTransactionsByMerchant(id)` returns only records for the queried merchant
    - **Validates: Requirements 6.2, 10.1**

  - [ ]* 4.6 Write property test for merchant totals consistency
    - **Property 12: Merchant totals are consistent**
    - Generate a random set of distribution transactions for a merchant; assert `getMerchantTotals` returns a `totalDistributed` equal to the sum of those amounts
    - **Validates: Requirements 10.2**

- [ ] 5. Campaign management
  - [x] 5.1 Implement `backend/db/campaignRepository.js`
    - Export `validateCampaign({ rewardRate, startDate, endDate })` — returns `{ valid: boolean, errors: string[] }`; rejects rate ≤ 0 or endDate ≤ startDate
    - Export `createCampaign({ merchantId, name, rewardRate, startDate, endDate })`
    - Export `getCampaignsByMerchant(merchantId)`
    - Export `getActiveCampaign(campaignId)` — returns campaign only if `is_active = true` and `end_date >= today`
    - _Requirements: 7.2, 7.3, 7.4, 7.5_

  - [x]* 5.2 Write property test for campaign validation
    - **Property 3: Campaign validation rejects invalid inputs**
    - Generate campaigns with `rewardRate <= 0` and assert `validateCampaign` returns `valid: false`
    - Generate campaigns where `endDate <= startDate` and assert `validateCampaign` returns `valid: false`
    - Generate valid campaigns and assert `validateCampaign` returns `valid: true`
    - **Validates: Requirements 7.3**

- [ ] 6. Backend API routes
  - [x] 6.1 Implement merchant registration route
    - `POST /api/merchants/register` — validates body, inserts into merchants table, returns merchant record with generated `api_key`
    - _Requirements: 7.1_

  - [x] 6.2 Implement campaign routes
    - `POST /api/campaigns` — calls `validateCampaign`, then `createCampaign`; returns 400 with errors on invalid input
    - `GET /api/campaigns/:merchantId` — returns all campaigns for a merchant
    - _Requirements: 7.2, 7.3_

  - [x] 6.3 Implement reward distribution route
    - `POST /api/rewards/distribute` — validates merchant API key, calls `getActiveCampaign`, calls `verifyTrustline`, calls `distributeRewards`, calls `recordTransaction`; returns `{ success, txHash }`
    - Returns 400 with `{ error, message }` for inactive campaign, missing trustline, or insufficient balance
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.4, 7.5_

  - [ ]* 6.4 Write property test for distribution blocked without trustline
    - **Property 5: Operations blocked without trustline**
    - Mock `verifyTrustline` to return `{ exists: false }`; for any wallet address and amount, assert the distribution route returns an error and `distributeRewards` is never called
    - **Validates: Requirements 3.2, 3.6**

  - [ ]* 6.5 Write property test for expired campaign blocking distribution
    - **Property 7: Expired campaign blocks distribution**
    - Generate campaigns with `end_date` set to past dates; assert the distribution route returns an error without calling `distributeRewards`
    - **Validates: Requirements 7.5**

  - [x] 6.6 Implement transaction recording route
    - `POST /api/transactions/record` — accepts `{ txHash, txType, amount, fromWallet, toWallet, merchantId, campaignId }`; verifies tx on Horizon before recording; returns recorded transaction
    - _Requirements: 4.3, 5.4_

  - [x] 6.7 Implement transaction history route
    - `GET /api/transactions/:walletAddress` — queries Horizon for NOVA transactions; falls back to PostgreSQL if Horizon is unavailable; returns unified list
    - _Requirements: 6.1, 6.4, 6.5_

  - [x] 6.8 Implement trustline verification route
    - `POST /api/trustline/verify` — accepts `{ walletAddress }`; validates address format, calls `verifyTrustline`, returns `{ exists: boolean }`
    - _Requirements: 2.3, 2.4_

- [x] 7. Checkpoint — backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Frontend — wallet integration
  - [x] 8.1 Implement `frontend/lib/freighter.js`
    - Export `isFreighterInstalled()` — calls `@stellar/freighter-api` `isConnected()`
    - Export `connectWallet()` — calls `requestAccess()` then `getPublicKey()`; returns public key string
    - Export `signAndSubmit(xdr)` — calls `signTransaction(xdr, { networkPassphrase })` then submits signed XDR to Horizon; returns `{ txHash }`
    - _Requirements: 8.1, 8.2_

  - [x] 8.2 Implement `frontend/lib/horizonClient.js`
    - Export `getNOVABalance(walletAddress)` — fetches account from Horizon, extracts NOVA balance
    - Export `getTransactionHistory(walletAddress)` — fetches paginated NOVA transactions from Horizon, handles cursor-based pagination
    - _Requirements: 8.3, 6.1, 6.4_

  - [x] 8.3 Implement wallet context (`frontend/context/WalletContext.js`)
    - React context providing `{ publicKey, balance, connect, disconnect, refreshBalance }`
    - On connect: calls `connectWallet()`, stores public key, fetches balance
    - _Requirements: 8.2, 8.3_

- [ ] 9. Frontend — customer dashboard
  - [x] 9.1 Implement customer dashboard page (`frontend/pages/dashboard.js`)
    - Display NOVA balance from wallet context
    - Display transaction history list (type, amount, counterparty, timestamp)
    - Show "Install Freighter" prompt if extension not detected
    - _Requirements: 9.1, 9.2, 8.5_

  - [x] 9.2 Implement trustline creation component
    - Button that calls `buildTrustlineXDR` via backend, then `signAndSubmit`; shows success/error state
    - _Requirements: 2.1, 2.2_

  - [x] 9.3 Implement peer-to-peer transfer component
    - Form with recipient address and amount fields
    - Validates recipient address format client-side before submitting
    - Calls backend to verify recipient trustline, then builds payment XDR, calls `signAndSubmit`
    - _Requirements: 5.1, 5.2, 5.3, 5.6_

  - [ ]* 9.4 Write property test for frontend input validation
    - **Property 6 (frontend): Stellar public key validation**
    - Generate arbitrary strings and assert the address validation function rejects them; generate valid keypairs and assert acceptance
    - **Validates: Requirements 5.1**

  - [x] 9.5 Implement token redemption component
    - Form with merchant wallet address and redemption amount
    - Verifies sufficient balance client-side, builds payment XDR, calls `signAndSubmit`, posts to `/api/transactions/record`
    - _Requirements: 4.1, 4.2, 4.5_

- [ ] 10. Frontend — merchant dashboard
  - [x] 10.1 Implement merchant dashboard page (`frontend/pages/merchant.js`)
    - Display list of campaigns (active and past)
    - Display total distributed and redeemed summary
    - _Requirements: 10.1, 10.2_

  - [x] 10.2 Implement campaign creation form component
    - Fields: campaign name, reward rate, start date, end date
    - Client-side validation: rate > 0, end date > start date
    - Submits to `POST /api/campaigns`
    - _Requirements: 7.2, 7.3, 10.3_

  - [ ]* 10.3 Write property test for merchant dashboard input validation
    - **Property 3 (frontend): Campaign validation rejects invalid inputs**
    - Generate invalid campaign inputs (rate ≤ 0, end ≤ start) and assert the client-side validation function returns errors
    - **Validates: Requirements 7.3**

  - [x] 10.4 Implement reward issuance form component
    - Fields: customer wallet address, reward amount
    - Validates address format and positive amount before submitting to `POST /api/rewards/distribute`
    - Displays returned `txHash` on success
    - _Requirements: 10.4, 10.5, 3.1_

- [ ] 11. Blockchain scripts
  - [x] 11.1 Implement `scripts/setup.js`
    - Runnable script that calls `issueAsset.js` to set up Testnet accounts and initial NOVA supply
    - Logs all account public keys and transaction hashes for reference
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 12. Final checkpoint — all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use fast-check with `numRuns: 100` minimum
- Each property test references its design document property number and requirements clause
- All blockchain interactions on Stellar Testnet; switch `STELLAR_NETWORK` env var for Mainnet
- Freighter-signed transactions are built as unsigned XDR on the backend/frontend and signed client-side
