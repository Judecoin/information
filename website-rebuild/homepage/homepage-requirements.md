# Judecoin Homepage Requirements

This document defines the homepage content structure, navigation, section copy, card-based link behavior, Service Node network data requirements, supported wallet assets, footer direction, and overall design direction for the Judecoin official homepage.

The homepage presents Judecoin as a privacy-focused digital cash network, a Proof-of-Stake and Service Node ecosystem, and a broader infrastructure layer for wallets, atomic swaps, explorer tools, roadmap development, and future applications.

## Design Direction

The homepage should use a premium, modern, spacious, and future-facing visual style.

The design should support both dark and light themes, with the dark theme as the primary visual direction and the light theme following the same layout system.

The overall style should feel refined, elegant, privacy-focused, ecosystem-oriented, and easy to explore.

The design should emphasize:

- Dark and light theme switching
- Clear visual hierarchy
- Clean section separation
- High-end typography with a confident visual rhythm
- Rounded cards with subtle borders and soft glass-like surfaces
- Abstract network, privacy, and infrastructure visuals
- Clear separation between content, data, navigation, and linked cards
- Calm, powerful, refined, and future-facing technology presentation

## Homepage Interaction Model

The homepage uses a card-based interaction model.

Only the Hero section includes a visible primary button inside the homepage content.

Other homepage sections use linked headings, linked data cards, linked content cards, linked asset chips, or linked content panels.

The header includes the global `Download Wallet` action.

## Homepage Navigation

The homepage header includes the following main navigation items and right-side actions.

### Main Navigation

- Judecoin
- Stake
- Build
- Community

### Right Side

- Language Switch
- Theme Switch
- Download Wallet

### Navigation Links

#### Judecoin

- What is Judecoin? -> `what-is-judecoin.html`
- Why buy $JUDE? -> `why-buy-jude.html`
- Roadmap -> `roadmap.html`
- FAQ -> `faq.html`

#### Stake

- How do I stake $JUDE? -> `how-to-stake.html`
- Service Nodes -> `service-nodes.html`

#### Build

- What can be built? -> `what-can-be-built.html`
- Atomic Swaps -> `atomic-swaps.html`
- Blockchain Explorer -> `explorer.html`

#### Community

- Get Involved -> `get-involved.html`
- Who uses Judecoin? -> `who-uses-judecoin.html`
- Community News -> `community-news.html`
- Security Center -> `security.html`

#### Header Action

- Download Wallet -> `downloads.html`

## Homepage Sections

The homepage contains the following sections:

1. Hero Section
2. Hero Highlight Cards
3. Service Node Network
4. Privacy Tools Powered by the JUDE Network
5. Ecosystem Infrastructure
6. Roadmap
7. Wallet
8. Community and Contribution
9. Footer

## 1. Hero Section

### Purpose

Present Judecoin’s official identity and guide users to the main overview page.

### Content

JUDE is many things.

- A private cryptocurrency.
- A secure messaging platform.
- A network anonymity layer.
- A vision for a future where privacy is effortless.

### Primary Button

- Explore Judecoin

### Link Target

- Explore Judecoin -> `what-is-judecoin.html`

### Hero Visual Link

- Hero visual panel -> `what-is-judecoin.html`

## 2. Hero Highlight Cards

### Purpose

Provide fast homepage entry points for core Judecoin concepts.

### Cards

- 1M+  
  Privacy Tool Users

- Privacy First  
  Private digital cash by design

- Proof of Stake  
  Network participation model

- Service Nodes  
  Powering network infrastructure

### Card Link Targets

- 1M+ / Privacy Tool Users -> `who-uses-judecoin.html`
- Privacy First -> `what-is-judecoin.html`
- Proof of Stake -> `how-to-stake.html`
- Service Nodes -> `service-nodes.html`

## 3. Service Node Network

### Purpose

Display Service Node and Proof-of-Stake network participation data.

### Content

Judecoin Service Node Network

Powering the Judecoin Proof-of-Stake network.

### Data Cards

- Active Service Nodes  
  500

- Total JUDE Staked  
  11,800,000 JUDE

- Per Service Node  
  23,600 JUDE

- Last Updated  
  3 min ago

### Data Requirements

The Service Node data shown in this homepage section should be based on Judecoin network status data.

The following items should be dynamically updated:

- Active Service Nodes
- Total JUDE Staked
- Last Updated

`Per Service Node` may remain fixed at 23,600 JUDE if the staking requirement remains unchanged.

### Linked Areas

- Judecoin Service Node Network heading -> `service-nodes.html`
- Active Service Nodes card -> `explorer.html`
- Total JUDE Staked card -> `service-nodes.html`
- Per Service Node card -> `how-to-stake.html`
- Last Updated card -> `explorer.html`

### Future Link Option

If a dedicated Service Node explorer page is created later, the following links can be updated:

- Active Service Nodes card -> `explorer-service-nodes.html`
- Last Updated card -> `explorer-service-nodes.html`

## 4. Privacy Tools Powered by the JUDE Network

### Purpose

Present Judecoin as a privacy-focused tool and service network.

### Content

Privacy tools powered by the JUDE network.

Judecoin provides privacy-focused tools and services that help people use decentralized networks with stronger privacy, security, and control in daily digital life.

### Cards

- Tools and Services  
  A suite of privacy-focused tools built around the JUDE network.

- Everyday Privacy  
  Designed to support private and secure digital activity across everyday use cases.

- Already in Use  
  Judecoin’s privacy tools already reach over one million people.

### Bottom Statement

This is not only a future vision.

Judecoin’s privacy tools already exist and are already in use.

### Linked Areas

- Section heading -> `what-is-judecoin.html`
- Tools and Services card -> `what-is-judecoin.html`
- Everyday Privacy card -> `security.html`
- Already in Use card -> `who-uses-judecoin.html`
- Bottom statement panel -> `what-is-judecoin.html`

## 5. Ecosystem Infrastructure

### Purpose

Present Judecoin as a broader privacy ecosystem and infrastructure network.

### Content

Built for a broader privacy ecosystem.

Judecoin provides a foundation for wallets, Service Node infrastructure, atomic swaps, cross-chain tools, explorer services, developer documentation, and future decentralized applications.

### Cards

- Wallet Infrastructure  
  Wallet access for storing, sending, receiving, and managing JUDE.

- Service Node Infrastructure  
  Tools and systems for staking, monitoring, uptime, and Service Node operation.

- Atomic Swaps  
  Cross-chain value movement without relying entirely on centralized intermediaries.

- Explorer and Developer Tools  
  Network visibility, RPC references, documentation, and integration resources.

### Linked Areas

- Section heading -> `what-can-be-built.html`
- Wallet Infrastructure card -> `downloads.html`
- Service Node Infrastructure card -> `service-nodes.html`
- Atomic Swaps card -> `atomic-swaps.html`
- Explorer and Developer Tools card -> `explorer.html`

## 6. Roadmap

### Purpose

Provide a homepage preview of Judecoin’s long-term technical direction.

### Content

Roadmap

Follow Judecoin’s technical direction across Proof of Stake, instant transactions, atomic swaps, wallet infrastructure, and future ecosystem applications.

### Cards

- Completed Foundations  
  - CLI Wallet
  - Block Validator
  - JIP-3 Protocol
  - Complete POW+POS

- In Progress  
  - Proof of Stake
  - Instant Transactions
  - Judecoin ↔ Ethereum Atomic Swaps
  - Wallet Synchronization Across Multi-Language Nodes

- Future Plans  
  - On-chain Ecosystem Infrastructure
  - Federated Address Application
  - Open Source Hardware Wallet
  - Layer 2 Solutions

### Linked Areas

- Roadmap heading -> `roadmap.html`
- Completed Foundations card -> `roadmap.html`
- In Progress card -> `roadmap.html`
- Future Plans card -> `roadmap.html`

## 7. Wallet

### Purpose

Present Judecoin Wallet as a multi-asset wallet entry point for JUDE and major digital assets.

### Content

Wallet

Multi-asset wallet support for JUDE and major digital assets.

### Supported Assets

The wallet section displays supported assets with small asset logos and full asset names.

- Judecoin
- Bitcoin
- Ethereum
- Cardano
- Ripple
- Dogecoin
- Solana
- Litecoin
- Avalanche
- BinanceCoin
- Polkadot
- TRON

### Supported Asset Link Target

Each supported asset chip links to:

- `downloads.html`

### Wallet Note

Each supported asset has its own seed phrase and recovery flow.

### Wallet Cards

- CLI Wallet  
  Command-line tools for advanced users, wallet recovery, staking workflows, and asset management.

- GUI Wallet  
  A user-friendly wallet for storing, sending, receiving, and managing JUDE and supported digital assets.

- Palm Wallet  
  An integrated wallet based on the Judecoin mainnet PoS ecosystem.

### Linked Areas

- Wallet heading -> `downloads.html`
- Supported asset chips -> `downloads.html`
- CLI Wallet card -> `wallet-cli-wallet.html`
- GUI Wallet card -> `wallet-guide.html`
- Palm Wallet card -> `downloads.html`

## 8. Community and Contribution

### Purpose

Provide a community and contribution entry point for users, contributors, and community members.

### Content

Join the Judecoin ecosystem.

Follow official updates, contribute to documentation, support ecosystem development, and take part in the next stage of Judecoin’s Proof-of-Stake network.

### Linked Area

- Join the Judecoin ecosystem panel -> `get-involved.html`

## 9. Footer

### Purpose

Provide a minimal footer with copyright information and official social icons.

### Footer Text

Copyright © 2026, All Rights Reserved jude.org

### Footer Icon Links

- Facebook icon -> `https://www.facebook.com/`
- X icon -> `https://x.com/judecoin_`
- Instagram icon -> `https://www.instagram.com/`
- GitHub icon -> `https://github.com/judecoin`

## Link Map

### Header Navigation

- Logo / Judecoin brand -> `index.html`
- Judecoin -> `what-is-judecoin.html`
- Stake -> `how-to-stake.html`
- Build -> `what-can-be-built.html`
- Community -> `get-involved.html`
- Download Wallet -> `downloads.html`

### Homepage Primary Button

- Explore Judecoin -> `what-is-judecoin.html`

### Homepage Card / Area Links

#### Hero

- Hero visual panel -> `what-is-judecoin.html`
- 1M+ / Privacy Tool Users -> `who-uses-judecoin.html`
- Privacy First -> `what-is-judecoin.html`
- Proof of Stake -> `how-to-stake.html`
- Service Nodes -> `service-nodes.html`

#### Service Node Network

- Judecoin Service Node Network heading -> `service-nodes.html`
- Active Service Nodes -> `explorer.html`
- Total JUDE Staked -> `service-nodes.html`
- Per Service Node -> `how-to-stake.html`
- Last Updated -> `explorer.html`

#### Privacy Tools

- Privacy tools powered by the JUDE network heading -> `what-is-judecoin.html`
- Tools and Services -> `what-is-judecoin.html`
- Everyday Privacy -> `security.html`
- Already in Use -> `who-uses-judecoin.html`
- Bottom statement panel -> `what-is-judecoin.html`

#### Ecosystem Infrastructure

- Built for a broader privacy ecosystem heading -> `what-can-be-built.html`
- Wallet Infrastructure -> `downloads.html`
- Service Node Infrastructure -> `service-nodes.html`
- Atomic Swaps -> `atomic-swaps.html`
- Explorer and Developer Tools -> `explorer.html`

#### Roadmap

- Roadmap heading -> `roadmap.html`
- Completed Foundations -> `roadmap.html`
- In Progress -> `roadmap.html`
- Future Plans -> `roadmap.html`

#### Wallet

- Wallet heading -> `downloads.html`
- Supported asset chips -> `downloads.html`
- CLI Wallet -> `wallet-cli-wallet.html`
- GUI Wallet -> `wallet-guide.html`
- Palm Wallet -> `downloads.html`

#### Community

- Join the Judecoin ecosystem panel -> `get-involved.html`

#### Footer

- Facebook icon -> `https://www.facebook.com/`
- X icon -> `https://x.com/judecoin_`
- Instagram icon -> `https://www.instagram.com/`
- GitHub icon -> `https://github.com/judecoin`
