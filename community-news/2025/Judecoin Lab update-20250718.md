# Judecoin Lab update #20250718

> **Date:** July 18, 2025  
> **Category:** News

## Remove `POD_CLASS` Macro and Pointless Pack Pragmas

`POD_CLASS` is always just `struct`.

The pack pragmas here do nothing because every type defined inside them only has `char` array members, which are already guaranteed by C++ alignment rules to have byte alignment.

## DRY Transaction Fetching

`wallet2` does nearly identical transaction fetching in several places.

This update DRYs out the code a bit.
