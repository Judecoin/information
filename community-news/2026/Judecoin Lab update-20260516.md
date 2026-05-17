# Judecoin Lab update #20260516

Date: 2026-05-16  
Category: News

Cleanup on block adding failure.

If a block adding operation fails and triggers the following error message:

`Block added hook signalled failure`

the service node list does not get reset correctly. This can immediately lead to an incorrect service node winner, because the winner has already been incremented but not removed from the list.

This update fixes the issue by calling the blockchain detached hooks to perform the required cleanup.

The old version of the website will no longer be available. The new version will be gradually added to the information repository for community reference.

More APIs will be opened in the future, and more versions of blockchain explorers will be included.
