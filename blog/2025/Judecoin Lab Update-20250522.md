# Judecoin Lab update #20250522

> **Date:** May 22, 2025  
> **Category:** News

Adds two new mining options, available via RPC:

- `slow_mining`  
  This avoids the RandomJDX initialization. It is much slower, but for regtest with fixed difficulty of `1`, that is perfectly fine.

- `num_blocks`  
  Instructs the miner to mine for the given number of blocks, then stop. This can overmine if mining with multiple threads at a low difficulty, but that is fine.

Judecoin Team
