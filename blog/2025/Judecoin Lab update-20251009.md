# Judecoin Lab update #20251009

> **Date:** October 9, 2025  
> **Category:** News

## `console_handler`: Log Errors Properly and Gracefully Shut Down Wallet

- In `simplewallet`, invalid or missing commands were not reported to the CLI because errors were thrown and caught silently.

- Now errors are always logged to the user unless they are thrown by something other than the wallet.

- Added an `invalid_command` exception to distinguish between an error thrown by the `console_handler`, such as a missing or empty command, and an actual `std::out_of_range` thrown by wallet code.

- Previously, this could incorrectly report `Unknown command ...` even when it was a known command.

- Exceptions thrown through commands sent by RPC over the terminal are now caught, allowing the wallet to shut down properly.

- In `console_handler`, `cmd_handler` failure is no longer treated as an invalid command. Previously, if a command failed, it would assume an invalid command and log or try the next branch, which was detecting application exit.

## Wallet and Simplewallet

Dropped support for the mine-to-use RPC system.
