# Judecoin Lab Update #20260919

Date: September 19, 2026

Category: News

- Block Producer: The Service Node reponsible for generating the block.

  Block Leader: The Service Node that is at the top of the Service Node List queue.They are also by default on pulse round 0, the block producer.
  If that round fails, then the block producer is changed via multi-block seeding.
   
- On signed block message, provide 2 signatures.
The fact that we submit only one signature means that when someone in the quorum receives and relays themessage, they can tamper the message and make it invalid (by changing the round to something invalid for example) and cause other nodes in the quorum to reject it, eventually, recording that the Service Node didn't participate in the round and bias Service Nodes to decommissioning.
Instead of taking the shortcut and providing only 1 signature, we do the same thing we do with all the other messages,
a. We signed the contents of the message- this proves that the message originated from the Service Node it claims to have come from (preventing any tampering).
b. The 2nd signature actually is the signature that signs the final block and is included in the block for propagation in the network.
	
- Make active snods info public for Pulse to query the list to allow Pulse quorums to be generated outside of the Service Node List.
  
- Add Service Node Checkpointing For POS.
