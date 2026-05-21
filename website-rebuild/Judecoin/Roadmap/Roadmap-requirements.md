# Judecoin Roadmap Page Requirements

## 1. Page Purpose

The Roadmap page presents Judecoin’s development direction in a clear and structured way.

This page defines the Roadmap content, year logic, status display, and expand / collapse interaction.

Global header navigation and footer follow the homepage structure.

## 2. Page Structure

The Roadmap page contains the following sections:

1. Hero Section
2. Status Navigation
3. Current Year Roadmap
4. Future Plans
5. Completed Foundations

## 3. Hero Section

### Title

```text
Judecoin Roadmap
```

### Text

```text
The goal of Judecoin is to become sound money that is usable by everyone in the world.

This roadmap gives technical teams a shared direction for advancing Judecoin.
```

## 4. Roadmap Logic

### 4.1 Current Year Logic

The Current Year section always represents the latest year.

```text
Current Year = latest year
```

The position currently used by 2026 functions as the dynamic current-year section.

```text
If the current year is 2026:
The Current Year section displays 2026 and shows the 2026 Roadmap items.

If the current year is 2027:
The Current Year section displays 2027 and shows the 2027 Roadmap items.
```

### 4.2 Completed Foundations Logic

All years before the current year are displayed under Completed Foundations.

```text
Completed Foundations = previous year and earlier years
```

```text
If the current year is 2026:
Completed Foundations includes 2025, 2024, 2023, 2022, 2021, and 2020.

If the current year is 2027:
Completed Foundations includes 2026, 2025, 2024, 2023, 2022, 2021, and 2020.
```

### 4.3 Future Plans Logic

Future Plans contains planned Roadmap items that are not assigned to the current year.

```text
Future Plans = planned items not assigned to the current year
```

Future Plans is displayed separately from both the Current Year Roadmap and Completed Foundations.

## 5. Status Display Logic

The Roadmap page uses three status types:

```text
Done
In Progress
Planned
```

All Roadmap items display their real development status.

```text
A current-year item can be Done or In Progress.
A future item is Planned.
A completed historical item is Done.
```

Each Roadmap item clearly displays its status.

## 6. Default Display Logic

The Roadmap page displays the most relevant content first.

Default open / closed behavior:

```text
Current Year -> Open
Future Plans -> Open
Previous year -> Open
Two years before current year -> Open
Earlier years -> Closed
```

For the current 2026 page:

```text
2026 -> Open
Future -> Open
2025 -> Open
2024 -> Open
2023 -> Closed
2022 -> Closed
2021 -> Closed
2020 -> Closed
```

When the current year becomes 2027:

```text
2027 -> Open
Future -> Open
2026 -> Open
2025 -> Open
2024 -> Closed
2023 -> Closed
2022 -> Closed
2021 -> Closed
2020 -> Closed
```

## 7. Expand / Collapse Behavior

The Roadmap page uses in-page expand / collapse interaction.

The following sections are expandable and collapsible:

```text
Current Year Roadmap
Future Plans
Each Completed Foundations year card
```

Interaction behavior:

```text
Click section header -> expand / collapse section content
```

Display behavior:

- Expanded sections show their Roadmap items.
- Collapsed sections hide their Roadmap items.
- Section headers remain visible when collapsed.
- Cards use in-page expand / collapse interaction only.
- The expand / collapse behavior works in both light and dark themes.
- The visual style remains consistent across all Roadmap cards.

## 8. Status Navigation

The page includes a status navigation area with three buttons:

```text
Done
In Progress
Planned
```

Button links:

```text
Done -> #completed-foundations
In Progress -> #current-year
Planned -> #future-plans
```

Interaction behavior:

- Clicking a status button smoothly scrolls to the matching section.
- The active section button is highlighted while scrolling.

## 9. Current Year Roadmap

### Section ID

```text
#current-year
```

### Current 2026 Display

```text
2026

6 roadmap items
```

### Roadmap Items

```text
Complete PoW + PoS
Proof of Stake
Instant Transactions
Judecoin <-> Ethereum atomic swaps
Wallet synchronization across nodes written in different development languages
Logarithmic-size linkable ring signature application
```

### Status Mapping

```text
Complete PoW + PoS -> Done
Proof of Stake -> In Progress
Instant Transactions -> In Progress
Judecoin <-> Ethereum atomic swaps -> In Progress
Wallet synchronization across nodes written in different development languages -> In Progress
Logarithmic-size linkable ring signature application -> In Progress
```

### Display Behavior

- The Current Year section is open by default.
- The Current Year card supports expand / collapse.
- Official Roadmap item text remains unchanged.

## 10. Future Plans

### Section ID

```text
#future-plans
```

### Display Text

```text
Future

8 planned items
```

### Roadmap Items

```text
On-chain ecosystem infrastructure
Federated address application
Open-source hardware wallet
Second-layer solutions for speed and scalability
Atomic exchange between different algorithms
Layer 2 solutions
Judecoin 2.0 ecological applications
Return address mechanism
```

### Status Mapping

```text
All Future Plans items -> Planned
```

### Display Behavior

- Future Plans is open by default.
- Future Plans supports expand / collapse.
- Future Plans is displayed as a single-column list.
- Official Roadmap item text remains unchanged.

## 11. Completed Foundations

### Section ID

```text
#completed-foundations
```

For the current 2026 page, Completed Foundations includes:

```text
2025
2024
2023
2022
2021
2020
```

Default display for the current 2026 page:

```text
2025 -> Open
2024 -> Open
2023 -> Closed
2022 -> Closed
2021 -> Closed
2020 -> Closed
```

Each completed year is displayed as an expandable Roadmap card.

## 12. Completed Year Content

### 2025

```text
Verification node deployment
JIP-3 protocol
Increased ring size
```

Status:

```text
All items -> Done
```

### 2024

```text
Blockchain Explorer II
CLI wallet
Block validator
```

Status:

```text
All items -> Done
```

### 2023

```text
GUI wallet lists ETH
Judecoin <-> Bitcoin atomic swaps
Zero-knowledge proof compatibility
Wallet mining started
More mining pool modes specified as trusted
```

Status:

```text
All items -> Done
```

### 2022

```text
Mobile decentralized wallet
Russian localization
GUI wallet lists BTC
Spanish localization
iOS wallet
Cross-chain gateway function tested
```

Status:

```text
All items -> Done
```

### 2021

```text
Test network parameter adjustment and trading link testing
Chinese localization
Blockchain browser launched
German localization
Linux wallet released
Japanese localization
Network upgrade to adjust the block size ratio
Korean localization
RingCT trading test initiated
Mainnet mining program tested
Official mining started
Windows 64-bit wallet open sourced
Full-node wallet testing
Full-node wallet launched in November 2021
Italian localization
```

Status:

```text
All items -> Done
```

### 2020

```text
Release version 0.010
Wolframwarp Tangent Release 0.01.11
Network upgrade to adjust the block size ratio
0.010.2 release; patched bug
```

Status:

```text
All items -> Done
```

## 13. Completed Year Card Behavior

- Each completed year is displayed as an expandable card.
- Clicking the year card header expands or collapses that year’s Roadmap items.
- Year card headers remain visible when collapsed.
- Official Roadmap item text remains unchanged.