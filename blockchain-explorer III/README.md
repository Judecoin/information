# Judecoin Blockchain Explorer III

Judecoin Blockchain Explorer III is an independent, privacy-preserving mainnet explorer for the Judecoin network.

As the third Judecoin blockchain explorer implementation, Explorer III provides an additional modern public interface for viewing verifiable Judecoin mainnet data. It complements the existing official and community explorers rather than replacing them.

## Main Features

- Real-time Judecoin mainnet status
- Current block height and latest blocks
- Block details and public transaction lookup
- Transaction details and transaction pool activity
- Service Node status and public registration information
- Active and deregistered Service Node data
- Proof-of-Stake network statistics
- Service Node testing quorum information
- Network health indicators
- Automatic live data refresh
- Responsive desktop and mobile interface

## Privacy-Preserving Design

Explorer III displays only information intended to be publicly available through Judecoin network interfaces.

It does not expose private keys, wallet balances, private transaction participants, confidential transfer amounts, private wallet information, or sensitive node credentials.

The explorer is read-only. It does not broadcast transactions and does not provide blockchain write operations.

## Live Mainnet Data

Explorer III retrieves current blockchain information from fixed, read-only Judecoin public network interfaces controlled by the backend. Browser users cannot submit arbitrary RPC hosts or execute arbitrary RPC methods.

Live information includes blocks, public transaction data, Service Nodes, staking statistics, quorum activity, transaction pool state, and network health information.

The explorer does not scrape third-party explorer HTML to create live chain data. If a required live source is unavailable or cannot be verified, the interface reports the data as unavailable instead of substituting fabricated values.

## Data Integrity

Explorer III follows a simple principle: **verified data takes priority over displaying a value**.

Historical deregistration information is kept separate from current live Service Node state, and its indexed blockchain height is presented as historical coverage rather than live RPC state.

## Local Development

Node.js 22.13 or newer and pnpm are required.

```bash
pnpm install
pnpm run dev
```

Open `http://localhost:3000`.

## Build Verification

```bash
pnpm run build
```

## Cloudflare Workers Deployment

The project includes a production `wrangler.jsonc` configuration for Cloudflare Workers.

```bash
pnpm install
pnpm run deploy
```

When deploying from a GitHub monorepo, set the Cloudflare project root directory to this Explorer III directory so builds and deployments run from the correct project.

## Security

Do not commit private keys, wallet credentials, private RPC endpoints, API secrets, deployment tokens, server credentials, or other confidential configuration to the public repository.

Production secrets should be managed through the deployment platform's secure environment-variable or secret-management system.

## About Judecoin

Judecoin is an open-source, privacy-focused cryptocurrency network incorporating Proof-of-Stake consensus and Service Node infrastructure.

Judecoin Blockchain Explorer III provides the Judecoin mainnet with a third independent public explorer interface while respecting the network's privacy-preserving architecture.

## License

Use, modification, and distribution of this project are subject to the applicable license and policies of the Judecoin project and repository.
