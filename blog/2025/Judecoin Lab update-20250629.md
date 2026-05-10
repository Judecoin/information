# Judecoin Lab update #20250629

> **Date:** June 29, 2025  
> **Category:** News

## Refactor `get_transfers`

Hoist down to `wallet2` and use it in `simplewallet` and `wallet_rpc`.

## Simplify Serialization Code and Drop Unsupported Versions

Judecoin started life with transfer details serialization version `12`, so earlier version handling can be dropped.

The previous code structure repeatedly called `initialize_transfer_details` many times, so it has been simplified and fixed.

## PoS Parameters

The specific parameters of PoS will be gradually disclosed in the coming weeks.
