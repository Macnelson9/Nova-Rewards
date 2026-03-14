# Requirements Document

## Introduction

NovaRewards is a decentralized loyalty rewards platform built on the Stellar blockchain. It enables businesses to issue blockchain-based reward tokens (NOVA) to customers for purchases or engagement. Customers truly own their rewards as Stellar-issued assets and can transfer or redeem them across multiple participating merchants. The platform consists of a Next.js frontend, a Node.js/Express backend, a PostgreSQL database, and a Stellar blockchain integration layer.

## Glossary

- **NOVA**: The Stellar-issued loyalty token asset used across the NovaRewards platform
- **Issuer_Account**: The Stellar account that creates and issues the NOVA asset
- **Distribution_Account**: The Stellar account used to send NOVA tokens to customer wallets
- **Merchant**: A business registered on NovaRewards that can issue and accept NOVA tokens
- **Customer**: A user who holds a Stellar wallet and participates in the loyalty program
- **Trustline**: A Stellar mechanism by which a customer account opts in to hold a specific asset
- **Freighter_Wallet**: A browser extension wallet for the Stellar network used for customer authentication and signing
- **Horizon_API**: The Stellar network's REST API used to query account balances and transaction history
- **Reward_Campaign**: A merchant-defined rule set specifying how NOVA tokens are distributed for qualifying actions
- **Redemption**: The process of a customer exchanging NOVA tokens with a merchant for discounts or benefits
- **Testnet**: The Stellar test network used during development, separate from the production Mainnet
- **Stellar_SDK**: The official JavaScript library for interacting with the Stellar network

## Requirements

### Requirement 1: NOVA Asset Issuance

**User Story:** As a platform administrator, I want to create and issue the NOVA asset on the Stellar network, so that it can be used as the loyalty token across all merchants and customers.

#### Acceptance Criteria

1. THE Issuer_Account SHALL create the NOVA asset on the Stellar Testnet using the Stellar_SDK
2. WHEN the NOVA asset is created, THE Distribution_Account SHALL establish a trustline to the NOVA asset before receiving tokens
3. WHEN the NOVA asset is created, THE Issuer_Account SHALL fund the Distribution_Account with an initial supply of NOVA tokens
4. IF the Issuer_Account has insufficient XLM for transaction fees, THEN THE Stellar_SDK SHALL return a descriptive error message
5. THE issueAsset script SHALL be idempotent, meaning running it multiple times SHALL NOT create duplicate assets or corrupt balances

---

### Requirement 2: Trustline Creation

**User Story:** As a customer, I want to create a trustline to the NOVA asset, so that my Stellar wallet can receive and hold NOVA tokens.

#### Acceptance Criteria

1. WHEN a customer initiates trustline creation, THE System SHALL construct a Stellar change_trust operation for the NOVA asset
2. WHEN a trustline transaction is submitted, THE Freighter_Wallet SHALL prompt the customer to sign the transaction
3. WHEN the signed transaction is submitted to the Stellar network, THE System SHALL confirm the trustline is active by querying the Horizon_API
4. IF a trustline already exists for the customer's account, THEN THE System SHALL return a status indicating the trustline is already established without submitting a duplicate transaction
5. IF the customer's account has insufficient XLM to meet the minimum balance requirement for a trustline, THEN THE System SHALL return a descriptive error message

---

### Requirement 3: Reward Distribution

**User Story:** As a merchant, I want to distribute NOVA tokens to a customer's wallet after a qualifying purchase or engagement, so that customers are rewarded for their activity.

#### Acceptance Criteria

1. WHEN a merchant triggers a reward distribution, THE System SHALL validate that the merchant is registered and the campaign is active
2. WHEN a reward distribution is triggered, THE System SHALL verify the customer has an active trustline to the NOVA asset before sending tokens
3. WHEN a valid reward distribution is requested, THE Distribution_Account SHALL send the specified amount of NOVA tokens to the customer's Stellar wallet via a Stellar payment operation
4. WHEN a reward transaction is submitted, THE System SHALL record the transaction hash, amount, merchant ID, customer wallet address, and timestamp in the PostgreSQL database
5. IF the Distribution_Account has insufficient NOVA tokens, THEN THE System SHALL return a descriptive error and halt the distribution
6. IF the customer does not have an active trustline, THEN THE System SHALL return an error indicating the customer must first create a trustline

---

### Requirement 4: Token Redemption

**User Story:** As a customer, I want to redeem my NOVA tokens with a participating merchant in exchange for discounts or benefits, so that my rewards have tangible value.

#### Acceptance Criteria

1. WHEN a customer initiates a redemption, THE System SHALL verify the customer holds sufficient NOVA tokens for the requested redemption amount
2. WHEN a redemption is initiated, THE Freighter_Wallet SHALL prompt the customer to sign a Stellar payment transaction sending NOVA tokens to the merchant's Stellar wallet
3. WHEN the redemption transaction is confirmed on the Stellar network, THE System SHALL record the redemption details including transaction hash, amount, merchant ID, and customer wallet address in the PostgreSQL database
4. WHEN a redemption is successfully recorded, THE System SHALL apply the corresponding discount or benefit as defined by the merchant's active Reward_Campaign
5. IF the customer has insufficient NOVA tokens for the redemption, THEN THE System SHALL reject the request and return a descriptive error message

---

### Requirement 5: Peer-to-Peer Token Transfers

**User Story:** As a customer, I want to transfer NOVA tokens to another customer's wallet, so that I can share my rewards with others.

#### Acceptance Criteria

1. WHEN a customer initiates a peer-to-peer transfer, THE System SHALL validate that the recipient's Stellar wallet address is a valid Stellar public key
2. WHEN a peer-to-peer transfer is initiated, THE System SHALL verify the recipient has an active trustline to the NOVA asset
3. WHEN a valid transfer is initiated, THE Freighter_Wallet SHALL prompt the sender to sign a Stellar payment transaction
4. WHEN the transfer transaction is confirmed on the Stellar network, THE System SHALL record the transfer details in the PostgreSQL database
5. IF the recipient does not have an active trustline, THEN THE System SHALL return an error instructing the sender that the recipient must first create a trustline
6. IF the sender has insufficient NOVA tokens, THEN THE System SHALL reject the transfer and return a descriptive error message

---

### Requirement 6: Transaction Tracking

**User Story:** As a customer or merchant, I want to view my NOVA token transaction history, so that I can track rewards earned, redeemed, and transferred.

#### Acceptance Criteria

1. WHEN a customer views their dashboard, THE System SHALL query the Horizon_API for all NOVA asset transactions associated with the customer's wallet address
2. WHEN a merchant views their dashboard, THE System SHALL display all reward distributions and redemptions associated with that merchant from the PostgreSQL database
3. WHEN transaction history is displayed, THE System SHALL show transaction type, amount, counterparty wallet address, and timestamp for each entry
4. WHEN the Horizon_API is queried, THE System SHALL handle pagination to retrieve the complete transaction history
5. IF the Horizon_API is unavailable, THEN THE System SHALL fall back to displaying transaction records stored in the PostgreSQL database

---

### Requirement 7: Merchant Registration and Management

**User Story:** As a business owner, I want to register as a merchant on NovaRewards and manage reward campaigns, so that I can offer loyalty rewards to my customers.

#### Acceptance Criteria

1. WHEN a merchant registers, THE System SHALL store the merchant's name, Stellar wallet address, business category, and registration timestamp in the PostgreSQL database
2. WHEN a merchant creates a Reward_Campaign, THE System SHALL store the campaign name, reward rate (NOVA tokens per unit of spend), start date, end date, and associated merchant ID in the PostgreSQL database
3. WHEN a merchant creates a Reward_Campaign, THE System SHALL validate that the reward rate is a positive number and the end date is after the start date
4. WHILE a Reward_Campaign is active, THE System SHALL allow the merchant to trigger reward distributions under that campaign
5. IF a merchant attempts to distribute rewards under an expired or inactive campaign, THEN THE System SHALL reject the request and return a descriptive error message

---

### Requirement 8: Customer Wallet Integration

**User Story:** As a customer, I want to connect my Freighter Wallet to the NovaRewards platform, so that I can view my balance and interact with the blockchain.

#### Acceptance Criteria

1. WHEN a customer visits the platform, THE System SHALL detect whether the Freighter_Wallet browser extension is installed
2. WHEN a customer clicks "Connect Wallet", THE Freighter_Wallet SHALL prompt the customer to authorize the connection and return the customer's public key
3. WHEN a wallet is connected, THE System SHALL query the Horizon_API to retrieve the customer's current NOVA token balance
4. WHEN a wallet is connected, THE System SHALL display the customer's NOVA balance and recent transaction history on the customer dashboard
5. IF the Freighter_Wallet extension is not installed, THEN THE System SHALL display a message directing the customer to install the Freighter_Wallet extension

---

### Requirement 9: Customer Dashboard

**User Story:** As a customer, I want a dashboard that shows my reward balance and activity, so that I can manage my NOVA tokens in one place.

#### Acceptance Criteria

1. WHEN a customer accesses the dashboard, THE System SHALL display the current NOVA token balance retrieved from the Horizon_API
2. WHEN a customer accesses the dashboard, THE System SHALL display a list of recent transactions including type, amount, and timestamp
3. THE Dashboard SHALL provide controls for initiating trustline creation, peer-to-peer transfers, and token redemptions
4. WHEN a transaction is completed, THE Dashboard SHALL refresh the balance and transaction history without requiring a full page reload

---

### Requirement 10: Merchant Dashboard

**User Story:** As a merchant, I want a dashboard to manage my reward campaigns and issue rewards to customers, so that I can run my loyalty program efficiently.

#### Acceptance Criteria

1. WHEN a merchant accesses the dashboard, THE System SHALL display all active and past Reward_Campaigns associated with that merchant
2. WHEN a merchant accesses the dashboard, THE System SHALL display a summary of total NOVA tokens distributed and redeemed
3. THE Merchant_Dashboard SHALL provide a form for creating new Reward_Campaigns with fields for campaign name, reward rate, start date, and end date
4. THE Merchant_Dashboard SHALL provide a form for issuing rewards to a customer by entering the customer's wallet address and reward amount
5. WHEN a reward is issued from the dashboard, THE System SHALL validate all inputs before submitting the distribution request to the backend

---

### Requirement 11: Secure Configuration and Environment Management

**User Story:** As a developer, I want all sensitive credentials and keys stored securely in environment variables, so that secrets are never exposed in source code.

#### Acceptance Criteria

1. THE System SHALL store the Issuer_Account secret key, Distribution_Account secret key, and database credentials exclusively in environment variables loaded from a `.env` file
2. THE System SHALL provide a `.env.example` file documenting all required environment variables without exposing actual values
3. IF a required environment variable is missing at startup, THEN THE System SHALL log a descriptive error and halt initialization
4. THE `.env` file SHALL be listed in `.gitignore` to prevent accidental commit of secrets
