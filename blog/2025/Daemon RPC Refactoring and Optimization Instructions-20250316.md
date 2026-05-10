# Daemon RPC Refactoring and Optimization Instructions

> **Date:** March 16, 2025  
> **Category:** Notice

## 1. Reconstruct and Optimize RPC

The RPC layer has been redesigned and optimized to make it much easier to work with.

This refactoring decouples the RPC layer from the embedded HTTP server and moves the vast majority of RPC serialization and dispatch code out of a commonly included header.

## 2. Replace HTTP RPC Server with uWebSockets

The `epee` HTTP server has been replaced with an external C++ library called `uWebSockets`, as the previous HTTP server did not work well enough for this purpose.

A single thread is launched to handle HTTP RPC requests and response data.

This `uWebSockets` thread essentially runs an event loop. It does not handle application logic directly. Instead, it only passes data arriving in a request to another thread and later sends a reply back to the waiting connection.

Everything is asynchronous and non-blocking here.

The basic `uWebSockets` event loop operates when requests arrive, passes them off immediately, and then returns to waiting for the next request.

Judecoin Team
