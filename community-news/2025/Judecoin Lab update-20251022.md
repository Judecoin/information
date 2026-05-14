# Judecoin Lab update #20251022

> **Date:** October 22, 2025  
> **Category:** News

## DRY Wallet Inactivity Timer

This replaces the callback wrapper that had to be called from each command callback to reset the inactivity timer.

The previous wrapper was randomly missing from some commands.

It is replaced with a generic one in the `console_handler`, allowing pre-callback and post-callback commands to be specified.

## Significantly Reduce CLI Wallet Sweep RPC Request Count

When the CLI wallet sweeps, it processes the transaction to show output and ring information.

Previously, this was done by making a separate `get_outputs.bin` RPC request for each input being spent.

For a large sweep, this added a large amount of latency, making the entire request take much longer than necessary.

This update optimizes the process by batching output requests into `5000` outputs per request, which will typically mean just one request.

Judecoin Team
