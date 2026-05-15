# Judecoin Lab update #20260313

> **Date:** March 13, 2026  
> **Category:** News

1. `quorum_cop`: added quorum cop and Service Node keys to `judecoind`.

2. Service Nodes: added quorum states to database storage.

3. `quorum_cop`: changed uptime proof prune timeout to `2 hours 10 minutes`.

4. Added `judecoin-sn-keys` SN key management tool.

This allows inspecting, generating, and restoring Ed25519 secret key files as needed by `judecoind`.

## Generate SN Key

```bash
$ ./judecoin-sn-keys generate key_ed25519
```

```text
Generated SN Ed25519 secret key in key_ed25519

Public key:      08791467164b3f41681cb650385ffedeab96345f509e87a9852e4389643c5611
X25519 pubkey:   ea7b652f1d215674441775e5e42ceaef31cf3ffad6cc3f0321031abf0935b86c
```

## Show SN Key

```bash
$ ./judecoin-sn-keys show key_ed25519
```

```text
key_ed25519 (Ed25519 SN keypair)

==========

Secret key:      08016220970441955b29b1797f2c4bee0d3237e50bfafdb7999264caea163ecc
Public key:      08791467164b3f41681cb650385ffedeab96345f509e87a9852e4389643c5611
X25519 pubkey:   ea7b652f1d215674441775e5e42ceaef31cf3ffad6cc3f0321031abf0935b86c
```

## Restore SN Key

```bash
$ ./judecoin-sn-keys restore key_ed25519-2
```

```text
Enter the Ed25519 secret key:

08016220970441955b29b1797f2c4bee0d3237e50bfafdb7999264caea163ecc

Public key:      08791467164b3f41681cb650385ffedeab96345f509e87a9852e4389643c5611
X25519 pubkey:   ea7b652f1d215674441775e5e42ceaef31cf3ffad6cc3f0321031abf0935b86c

Is this correct? Press Enter to continue, Ctrl-C to cancel.

Saved secret key to key_ed25519-2
```

5. Version `3.0.1` of the CLI wallet will be re-released once the upgrade is complete.
