# Judecoin Lab update #20260111

> **Date:** January 11, 2026  
> **Category:** News

## Do Not Relay Expired Votes; Add Vote Tolerance Before Disconnection

This update changes the way votes are relayed to fix superfluous P2P disconnections.

The update includes:

- Checking that votes are not older than `VOTE_LIFETIME` before relaying.

- Adding a `5-block` buffer to incoming vote tolerance handling.

Votes that are too new or too old should not be accepted.

However, a disconnection should not be triggered if the vote is within `5 blocks` of the acceptable range, so that relays from slightly out-of-sync peers do not trigger P2P disconnections.
