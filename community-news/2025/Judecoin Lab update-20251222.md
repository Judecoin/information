# Judecoin Lab update #20251222

> **Date:** December 22, 2025  
> **Category:** News

## Add Locks Around the Refresh Thread

Wallet API is really messy with threads.

The refresh thread can run at any time and change internal wallet state, which breaks almost everything.

This puts all non-trivial wallet access from `wallet_api` behind a lock of the refresh thread to lock it out from refresh while other operations are underway.

## Do Not Relay Service Node Votes or Uptime Proof If Synchronising

When trying to sync the chain, nodes are constantly bombarded with voting information and uptime proofs.

Service Node votes and uptime proofs are not relayed during synchronization to reduce the bombardment of P2P data.
