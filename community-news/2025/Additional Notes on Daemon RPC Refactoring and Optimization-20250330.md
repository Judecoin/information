# Additional Notes on Daemon RPC Refactoring and Optimization

> **Date:** March 30, 2025  
> **Category:** Notice

## 3. Replace epee HTTP Client with a curl-Based Client

The `epee` HTTP client support has been completely removed and replaced with `cpr`, a curl-based C++ wrapper.

`rpc/http_client.h` wraps `cpr` specifically for RPC requests, but it can also be used directly.

## 4. Remove Pay-for-RPC Use System

After the chain applies Proof of Stake, the RPC system based on computing power will no longer be applicable.

In the future, the community may explore other approaches.

Judecoin Team
