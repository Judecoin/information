# Judecoin Lab update #20251128

> **Date:** November 28, 2025  
> **Category:** News

1. Core: submit uptime proof immediately after registering.

2. Incorporate the Service Node IP address into uptime proofs and validate the IP address when receiving uptime proof.

3. Add a message on receipt of your own uptime proof from the network.

4. Relay proofs back to the source, but do not relay your own proof again.

Otherwise, a ping-pong situation can occur as follows:

```text
Node1 sends uptime ->

Node2 receives uptime and relays it back to Node1 for acknowledgement ->

Node1 receives it, handle_uptime_proof returns true to acknowledge ->

Node1 tries to resend to the same peers again
```

Instead, if we receive our own uptime proof, then acknowledge it but do not send it on.

If we are missing an uptime proof, it will have been submitted automatically by the daemon itself instead of using our own proof relayed by other nodes.
