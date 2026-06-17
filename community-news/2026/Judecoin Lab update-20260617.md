# Judecoin Lab update #20260617

Date: 2026-06-17

Category: News

- Fix service node winner incorrect error
If we are re-deriving states we still also need the historical quorums
such that we can process incoming blocks with state changes. Without it,
state changes will be ignored and skipped causing inconsistent state in
the service node list.

This mandates a rescan and stores the most recent in state_ts, and only
just quorums for states preceeding 10k intervals. We can no longer store
the 1st most recent state in the DB as that will be missing quorums as
well for similar reason when rederiving on start-up.

- Apple's system wallet and GUI wallet need to be redeveloped from the underlying code;
for the system wallet, the Mac version needs to be completed first before the mobile version can be completed.
