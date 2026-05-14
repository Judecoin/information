# Judecoin Lab update #20250826

> **Date:** August 26, 2025  
> **Category:** News

## Annotate and Split Up Ring Signature Code

`generate_ring_signature` and `check_ring_signature` were used somewhat inappropriately to sign and check a signature of a single key image.

While this works, the full ring signature algorithm adds quite a bit of complexity that is not needed, and does not run, for the key image proof included in stake transactions and exported key images from the wallet.

This update splits it up, makes the key image interface considerably simpler, and adds annotation comments throughout it.

It also adds comments into the main signature code.

This is a necessary step toward getting stake transactions and key image exports working with Ledger, without implementing the full ring signature, because that is quite involved and not needed for most of these cases.

## Remove Macro and `goto` Code in `wallet2::import_outputs`

This replaces a confusing code section and replaces an odd macro / `goto` combination with a more reasonable `if` statement.
