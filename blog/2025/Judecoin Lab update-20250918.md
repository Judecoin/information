# Judecoin Lab update #20250918

> **Date:** September 18, 2025  
> **Category:** News

## Add `grace_blocks` to `is_synced()`

Add a `grace_blocks` parameter, defaulting to `0`, to `is_synced()`.

This replaces the previous check for being fully in sync with a check for being close to synced.

The wallet can occasionally become out of sync when a new block is added, making it one block behind the chain height.

This can result in unnecessary wallet errors, because if the user immediately calls the function again after it fails, it will succeed.

## Fix Fork Earliest Height Caching in `node_rpc_proxy`

There was a problem caused by combining two states, `earliest_height` and `enabled`, into a single cached value.

While `earliest_height` does not change on the fork, `enabled` does.

If the call is made when `enabled = false`, meaning before the fork, the wallet will never apply the rules for that fork until the wallet is restarted and the cache is cleared.

## Mobile Wallet Optimization

The mobile wallet will optimize the desktop image, wallet full name, and shared node staking function.
