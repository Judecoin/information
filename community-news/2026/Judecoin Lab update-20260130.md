# Judecoin Lab update #20260130

> **Date:** January 30, 2026  
> **Category:** News

## Cleaner Validation

This update provides cleaner validation that is faster and more reasonable.

There is no need to call `check_key` for every output public key in `check_tx_outputs` again.

The redundant call to `check_key` inside `check_tx_outputs` can be safely removed.

This change saves one unnecessary point decompression for every output public key since hard fork `v14`.

This provides a useful performance gain, in addition to the key image sanity check done for clarity and to prevent future mistakes.
