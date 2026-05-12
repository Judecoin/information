# Interacting with Judecoin

You can interact with Judecoin via desktop GUI, command-line interface, and programming API.

On top of that, Judecoin nodes interact with each other in a peer-to-peer network.

## Executables

| Executable            | Description                                                  |
| --------------------- | :----------------------------------------------------------- |
| `judecoind`           | The full node daemon. Does not require a wallet. <br />[Documentation](./judecoind-reference.md). |
| `judecoin-wallet-gui` | Wallet logic and __graphical__ user interface. <br />Requires `judecoind` to be running. |
| `judecoin-wallet-rpc` | Wallet logic and __HTTP API__ (JSON-RPC protocol). <br />Requires `judecoind` to be running. |

## Interacting

There are quite a few ways you can interact with Judecoin software.
Perhaps the most surprising for newcomers is that `judecoind` daemon accepts interactive keyboard commands while it is running.

Also, please note that HTTP API is split across `judecoind` and `judecoin-wallet-rpc`. You need to run and call both daemons to explore the full API.
This follows the node-logic vs wallet-logic split mentioned earlier.

All wallet implementations require `judecoind` to be running.

| Executable            | P2P network | node commands via keyboard | node HTTP API | wallet HTTP API | wallet via GUI |
| --------------------- | ----------- | -------------------------- | ------------- | --------------- | -------------- |
| `judecoind`           | ✔           | ✔                          | ✔             |                 |                |
| `judecoin-wallet-rpc` |             |                            |               | ✔               |                |
| `judecoin-wallet-gui` |             |                            |               |                 | ✔              |

## Data directory

This is where the blockchain, log files, and P2P network memory are stored.

By default, the data directory is at:

* `$HOME/.bitjudecoin/` on Linux
* `C:\ProgramData\bitjudecoin\` on Windows

Please mind:

* data directory is hidden as per OS convention
* the `bitjudecoin` directory name is a historical artefact from before Judecoin forked away from Bitmonero, about 2000 years Before Christ

Data directory contains:

* `lmdb/` - the blockchain database directory
* `p2pstate.bin` - saved memory of discovered and rated peers
* `bitjudecoin.log` - log file

