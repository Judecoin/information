# Judecoin Lab update #20260122

> **Date:** January 22, 2026  
> **Category:** News

## Reject New Votes That Can Slip Through the Syncing Phase at Startup

If the daemon is not completely synced at startup, it can connect to peers that relay P2P votes from the tip of the chain before the daemon realizes it has blocks to sync.

This can cause the missing quorum state error to print erroneously.

This update rejects new votes that can slip through the syncing phase at startup.
