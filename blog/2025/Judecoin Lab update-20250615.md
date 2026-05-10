# Judecoin Lab update #20250615

> **Date:** June 15, 2025  
> **Category:** News

Remove redundant RPC invocation arguments.

Replace `invoke_http_{bin,json,json_rpc}` with `invoke_http`, where `T` is the RPC type from which binary, JSON, JSON RPC, or light wallet RPC can be determined, and thus the URL can also be determined.

Also remove superfluous arguments: neither the `timeout` nor `http_method` arguments ever actually differ, so they are eliminated.
