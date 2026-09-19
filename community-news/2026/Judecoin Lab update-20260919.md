# Judecoin Lab Update #20260919

Date: September 19, 2026

Category: News

- Block Producer: The Service Node responsible for generating a block.

- Block Leader: The Service Node at the top of the Service Node List queue. By default, the Block Leader serves as the Block Producer during Pulse round 0. If that round fails, the Block Producer is changed through multi-block seeding.
   
- Provide two signatures for signed block messages.

Submitting only one signature creates a vulnerability: a quorum member that receives and relays the message could tamper with its contents—for example, by changing the round to an invalid value. This could cause other quorum members to reject the message, incorrectly record that the Service Node did not participate in the round, and bias the network toward decommissioning that node.

Instead of taking the shortcut of providing only one signature, we use the same approach applied to other messages:

a. The first signature covers the contents of the message. This proves that the message originated from the claimed Service Node and prevents its contents from being altered.

b. The second signature signs the final block and is included in the block as it propagates through the network.
	
- Make active Service Node information available for Pulse to query, allowing Pulse quorums to be generated outside of the Service Node List.
  
- Add Service Node checkpointing for PoS.
