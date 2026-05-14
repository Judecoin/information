# Regarding the Release and Adjustment of Announcement Content and Technical Dynamics

> **Date:** May 9, 2025  
> **Category:** Notice

In the future, the official website will release content in two parts: one is the on-chain version upgrade announcement and the on-chain application ecosystem announcement, and the other is the technical code update and upgrade details.

1. Cleaned up `node_rpc_proxy` return values: there was an inconsistent mix of ways to return errors and how the returned strings were handled. Instead, this cleans it up to return a pair, which, with C++17, can be transparently captured as:

   ```cpp
   auto [success, val] = node.whatever(req);
   ```

   This drops the failure message string, but it was almost always set to something fairly useless. If needed, it could be restored by changing the first element to a custom type with a bool operator for success and an `error` attribute containing some error string, but for the most part the current code was not doing much useful with the failure string.

2. Added the `--regtest` flag to the wallet so that it can talk to a daemon in `--regtest` mode.

Judecoin Team
