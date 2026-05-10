# Judecoin Lab update #20250602

> **Date:** June 2, 2025  
> **Category:** News

Fix expired `string_view` in non-JSONRPC requests.

Non-JSONRPC HTTP requests do the body parsing, either binary or JSON, in the worker thread. However, by then the `string_view` from `uWebSockets` is no longer valid.

This is fixed by making `rpc_request` able to hold an owned `std::string` and using that for HTTP non-JSONRPC requests.
