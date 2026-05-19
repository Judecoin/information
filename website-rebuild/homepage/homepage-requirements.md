# Homepage Requirements

This document defines the homepage content structure, navigation, section copy, action targets, Service Node network data requirements, supported wallet assets, footer direction, and design direction for the new Judecoin official homepage.

The homepage is intended to present Judecoin as a privacy-focused digital cash network, a Proof-of-Stake and Service Node ecosystem, and a broader infrastructure layer for wallets, atomic swaps, explorer tools, roadmap development, and future applications.

## Homepage Framework Note

Homepage framework diagrams are attached separately as layout references.

These diagrams show the homepage structure, section order, content placement, and general layout direction.

Final visual design prototypes may continue to be updated separately as the homepage design, visual style, and implementation details are refined.

## Design Direction

The homepage should use a premium, modern, spacious, and future-facing visual style.

The design should support both dark and light themes, with the dark theme as the primary visual direction and the light theme following the same layout system.

The overall style should feel refined, elegant, privacy-focused, ecosystem-oriented, and easy to explore.

The design should emphasize:

- Dark and light theme switching
- Spacious layout and clear visual hierarchy
- Large whitespace and clear section separation
- High-end typography with a confident visual rhythm
- Rounded cards with subtle borders and soft glass-like surfaces
- Abstract network, privacy, and infrastructure visuals
- Clear separation between content, actions, data, and navigation
- Calm, powerful, refined, and future-facing technology presentation

---

## Homepage Navigation

The homepage header should include the following main navigation items and right-side actions.

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

- What is Judecoin? -> `/what-is-judecoin`
- Why buy $JUDE? -> `/why-buy-jude`
- Roadmap -> `/roadmap`
- FAQ -> `/faq`

#### Stake

- How do I stake $JUDE? -> `/how-to-stake`
- Service Nodes -> `/service-nodes`

#### Build

- What can be built? -> `/what-can-be-built`
- Atomic Swaps -> `/atomic-swaps`
- Blockchain Explorer -> `/explorer`

#### Community

- Get Involved -> `/get-involved`
- Who uses Judecoin? -> `/who-uses-judecoin`
- Community News -> `/community-news`
- Security Center -> `/security`

#### Wallet

- Download Wallet -> `/downloads`

---

## Homepage Sections

The homepage contains the following sections:

1. Hero Section
2. Service Node Network
3. Privacy Tools Powered by the JUDE Network
4. Ecosystem Infrastructure
5. Roadmap
6. Judecoin Wallet
7. Community and Contribution
8. Footer

---

## 1. Hero Section

### Purpose

Present Judecoin’s official identity and guide users to the main overview page.

### Content

JUDE is many things.

- A private cryptocurrency.
- A secure messaging platform.
- A network anonymity layer.
- A vision for a future where privacy is effortless.

### Primary Action

- Explore Judecoin

### Link Target

- Explore Judecoin -> `/what-is-judecoin`

### Key Highlights

- 1M+  
  Privacy Tool Users

- Privacy First  
  Private digital cash by design

- Proof of Stake  
  Network participation model

- Service Nodes  
  Powering network infrastructure

---

## 2. Service Node Network

### Purpose

Display live Service Node and Proof-of-Stake network participation data.

This section shows real network participation and connects users to staking and Service Node information.

### Content

Judecoin Service Node Network

Powering the Judecoin Proof-of-Stake network.

### Data Items

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

These values should be presented as network status data and synchronized with the official Judecoin network data source when implementation is available.

### Actions

- View Live Nodes
- Start Staking

### Link Targets

- View Live Nodes -> Blockchain Explorer Service Nodes page
- Start Staking -> `/how-to-stake`

---

## 3. Privacy Tools Powered by the JUDE Network

### Purpose

Expand the official Judecoin overview and present Judecoin as a privacy-focused tool and service network.

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

### Action

- Learn more about Judecoin

### Link Target

- Learn more about Judecoin -> `/what-is-judecoin`

---

## 4. Ecosystem Infrastructure

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

### Action

- Explore What Can Be Built

### Link Target

- Explore What Can Be Built -> `/what-can-be-built`

---

## 5. Roadmap

### Purpose

Provide a homepage preview of Judecoin’s long-term technical direction.

The homepage roadmap should be concise and should display four items under each category.

### Content

Judecoin Roadmap

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
  - Judecoin <-> Ethereum Atomic Swaps
  - Wallet Synchronization Across Multi-Language Nodes

- Future Plans  
  - On-chain Ecosystem Infrastructure
  - Federated Address Application
  - Open Source Hardware Wallet
  - Layer 2 Solutions

### Action

- View Roadmap

### Link Target

- View Roadmap -> `/roadmap`

---

## 6. Judecoin Wallet

### Purpose

Present Judecoin Wallet as a multi-asset wallet entry point for JUDE and major digital assets.

This section focuses on wallet access, supported assets, seed phrase model, and wallet download entry.

### Content

Judecoin Wallet

Multi-asset wallet support for JUDE and major digital assets.

### Supported Assets

The wallet section should display small asset logos for the following supported assets.

The homepage display should use the full asset names.

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

### Supported Assets Display

Supported assets should be displayed as a compact logo grid.

Recommended layout:

- Desktop: 2 rows × 6 assets
- Mobile: 3 rows × 4 assets

Each asset item should include:

- Asset logo
- Full asset name

The asset logos should be small, clean, visually consistent, premium, and compact.

### Wallet Note

Each supported asset has its own seed phrase and recovery flow.

This note should be included because each supported asset in Judecoin Wallet is managed through its own wallet environment, with separate seed phrase generation, backup, and recovery flow.

### Cards

- GUI Wallet  
  A user-friendly wallet for storing, sending, receiving, and managing JUDE and supported digital assets.

- Palm Wallet  
  An integrated wallet based on the Judecoin mainnet PoS ecosystem.

- CLI Wallet  
  Command-line tools for advanced users, wallet recovery, staking workflows, and asset management.

### Action

- Download Wallet

### Link Target

- Download Wallet -> `/downloads`

### Card Link Suggestions

- GUI Wallet -> `/downloads`
- Palm Wallet -> `/downloads`
- CLI Wallet -> `/wallet/cli-wallet`

---

## 7. Community and Contribution

### Purpose

Provide a final call to action for users, contributors, and community members.

### Content

Join the Judecoin ecosystem.

Follow official updates, contribute to documentation, support ecosystem development, and take part in the next stage of Judecoin’s Proof-of-Stake network.

### Actions

- Get Involved
- View Updates

### Link Targets

- Get Involved -> `/get-involved`
- View Updates -> `/community-news`

---

## 8. Footer

### Purpose

Provide a minimal footer with copyright information and official community or social icons.

### Footer Text

Copyright © 2026, All Rights Reserved jude.org

### Footer Icons

The footer should include official social or community icons on the right side.

Suggested icon positions may include:

- GitHub
- X
- Telegram
- YouTube

Footer links may be added later if needed, but the current homepage design should use a minimal footer.

---

## Link Map

### Header Navigation

- Judecoin -> `/what-is-judecoin`
- Stake -> `/how-to-stake`
- Build -> `/what-can-be-built`
- Community -> `/community-news`
- Security Center -> `/security`
- Download Wallet -> `/downloads`

### Homepage Actions

- Explore Judecoin -> `/what-is-judecoin`
- View Live Nodes -> Blockchain Explorer Service Nodes page
- Start Staking -> `/how-to-stake`
- Learn more about Judecoin -> `/what-is-judecoin`
- Explore What Can Be Built -> `/what-can-be-built`
- View Roadmap -> `/roadmap`
- Download Wallet -> `/downloads`
- Get Involved -> `/get-involved`
- View Updates -> `/community-news`

---

## Notes

This homepage requirements document may be updated as the homepage framework diagrams, visual prototypes, page structure, official links, and implementation details are refined.
