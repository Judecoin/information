# `judecoind` - Reference

## Overview

### Connects you to Judecoin network

The Judecoin daemon `judecoind` keeps your computer synced up with the Judecoin network.

It downloads and validates the blockchain from the P2P network.

### Not aware of your private keys

`judecoind` is entirely decoupled from your wallet.

`judecoind` does not access your private keys - it is not aware of your transactions and balance.

This allows you to run `judecoind` on a separate computer or in the cloud.

In fact, you can connect to a remote `judecoind` instance provided by a semi-trusted 3rd party. Such 3rd party will not be able to steal your funds. This is very handy for learning and experimentation.

However, there are privacy and reliability implications to using a remote, untrusted node. For any real business **you should be running your own full node**.

## Syntax

`./judecoind [options] [command]`

Options define how the daemon should be working. Their names follow the `--option-name` pattern.

Commands give access to specific services provided by the daemon. Commands are executed against the running daemon.
Their names follow the `command_name` pattern.

## Running

Go to directory where you unpacked Judecoin.

```
./judecoind --detach                           # run as a daemon in background
tail -f ~/.bitjudecoin/bitjudecoin.log       # watch the logs
./judecoind exit                               # ask daemon to exit gracefully
```

## Options

Options define how the daemon should be working. Their names follow the `--option-name` pattern.

The following groups are only to make reference easier to follow. The daemon itself does not group options in any way.

#### Help and version

| Option         | Description                                                  |
| -------------- | ------------------------------------------------------------ |
| `--help`       | Produce help message.                                        |
| `--version`    | Output version information. Example output: <br />`Judecoin 'Chamaeleo dilepis' (v3.1.2-release)` |
| `--os-version` | Show the OS for which this executable was compiled.          |

#### Pick network

| Option       | Description                                                  |
| ------------ | ------------------------------------------------------------ |
| (missing)    | By default, `judecoind` runs on mainnet.                     |
| `--testnet`  | Run on testnet. The wallet must also be launched with `--testnet`. |
| `--stagenet` | Run on stagenet. The wallet must also be launched with `--stagenet`. |
| `--regtest`  | Run in regression testing mode.                              |

#### Logging

| Option                | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| `--log-file`          | Full path to the log file. Example (mind file permissions): <br/>`./judecoind --log-file=/var/log/judecoin/mainnet/judecoind.log` |
| `--log-level`         | `0-4` with `0` being minimal logging and `4` being full tracing. Defaults to `0`. These are general presets and do not directly map to severity levels. For example, even with minimal `0`, you may see some most important `INFO` entries. Temporarily changing to `1` allows for much better understanding of how the full node operates. Example: <br />`./judecoind --log-level=1` |
| `--max-log-file-size` | Soft limit in bytes for the log file (=104850000 by default, which is just under 100MB). Once log file grows past that limit, `judecoind` creates the next log file with a UTC timestamp postfix `-YYYY-MM-DD-HH-MM-SS`.<br /><br />In production deployments, you would probably prefer to use established solutions like logrotate instead. In that case, set `--max-log-file-size=0` to prevent judecoind from managing the log files. |
| `--max-log-files`     | Limit on the number of log files (=50 by default). The oldest log files are removed. In production deployments, you would probably prefer to use established solutions like logrotate instead. |
| `--max-concurrency`   | Max number of threads to use for a parallel job. The default value `0` uses the number of CPU threads. |

#### Server

`judecoind` defaults are adjusted for running it occasionally on the same computer as your Judecoin wallet.

The following options will be helpful if you intend to have an always running node &mdash; most likely on a remote server or your own separate PC.

| Option                | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| `--config-file`       | Full path to the [configuration file](./judecoin-config-file.md). By default `judecoind` looks for `bitjudecoin.conf` in Judecoin [data directory](./README.md#data-directory). |
| `--data-dir`          | Full path to data directory. This is where the blockchain, log files, and P2P network memory are stored. For defaults and details see [data directory](./README.md#data-directory). |
| `--pidfile`           | Full path to the PID file. Works only with `--detach`. Example: <br />`./judecoind --detach --pidfile=/run/judecoin/judecoind.pid` |
| `--detach`            | Go to background (decouple from the terminal). This is useful for long-running / server scenarios. Typically, you will also want to manage `judecoind` daemon with systemd or similar. By default `judecoind` runs in a foreground. |
| `--non-interactive`   | Do not require tty in a foreground mode. Helpful when running in a container. By default `judecoind` runs in a foreground and opens stdin for reading. |
| `--no-zmq`            | Disable ZMQ RPC server. Deprecated option. |
| `--no-igd`            | Disable UPnP port mapping on the router ("Internet Gateway Device"). Add this option to improve security if you are **not** behind a NAT. |
| `--max-txpool-weight` | Set maximum txpool weight in bytes. By default 648000000. |
| `--db-salvage`        | Try to salvage a blockchain database if it seems corrupted. |
| `--install-service`   | Install Windows service. |
| `--uninstall-service` | Uninstall Windows service. |
| `--start-service`     | Start Windows service. |
| `--stop-service`      | Stop Windows service. |

#### P2P network

The following options define how your node participates in the Judecoin peer-to-peer network.
This is for node-to-node communication. The following options do **not** affect [wallet-to-node](#node-rpc-api) interface.

The node and peer words are used interchangeably.

| Option                    | Description                                                  |
| ------------------------- | ------------------------------------------------------------ |
| `--p2p-bind-ip`           | IPv4 network interface to bind to for P2P network protocol. Default value `0.0.0.0` binds to all network interfaces. This is typically what you want. <br /><br />You must change this if you want to constrain binding, for example to force working through Tor via torsocks: <br />`DNS_PUBLIC=tcp://1.1.1.1 TORSOCKS_ALLOW_INBOUND=1 torsocks ./judecoind --p2p-bind-ip 127.0.0.1  --no-igd  --hide-my-port` |
| `--p2p-bind-port`         | TCP port to listen for P2P network connections. Defaults to `16060` for mainnet, `26060` for testnet, and `36060` for stagenet. You normally wouldn't change that. This is helpful to run several nodes on your machine to simulate private Judecoin P2P network (likely using private Testnet). Example: <br/>`./judecoind --p2p-bind-port=46060` |
| `--p2p-external-port`     | TCP port to listen for P2P network connections on your router. Relevant if you are behind a NAT and still want to accept incoming connections. You must then set this to relevant port on your router. This is to let `judecoind` know what to advertise on the network. Default is `0`. |
| `--p2p-use-ipv6`          | Enable IPv6 for P2P (disabled by default).                   |
| `--p2p-bind-ipv6-address` | IPv6 network interface to bind to for P2P network protocol. Default value `::` binds to all network interfaces. |
| `--p2p-bind-port-ipv6`    | TCP port to listen for P2P network connections. By default same as IPv4 port for given nettype. |
| `--p2p-ignore-ipv4`       | Ignore unsuccessful IPv4 bind for P2P. Useful if you only want to use IPv6. |
| `--igd`                   | Set UPnP port mapping on the router ("Internet Gateway Device"). One of: `disabled` \| `enabled` \| `delayed` (=`delayed` by default). Relevant if you are behind NAT and want to accept incoming P2P network connections. The `delayed` value means it will wait for incoming connections in hope UPnP may not be necessary. After a while w/o incoming connections found it will attempt to map ports with UPnP. If you know you need UPnP change it to `enabled` to fast track the process. |
| `--hide-my-port`          | `judecoind` will still open and listen on the P2P port. However, it will not announce itself as a peer list candidate. Technically, it will return port `0` in a response to P2P handshake (`node_data.my_port = 0` in `get_local_node_data` function). In effect nodes you connect to won't spread your IP to other nodes. To sum up, it is not really hiding, it is more like "do not advertise". |
| `--no-sync`               | Do not synchronize the blockchain with other peers. |
| `--seed-node`             | Connect to a node to retrieve other nodes' addresses, and disconnect. If not specified, `judecoind` will use hardcoded seed nodes on the first run, and peers cached on disk on subsequent runs. |
| `--tx-proxy`              | Send local transactions through a proxy, for example `tor,127.0.0.1:9050,100,disable_noise`. |
| `--anonymous-inbound`     | Configure anonymous inbound connections using a hidden service address and local bind address. |
| `--add-peer`              | Manually add node to local peer list, `host:port`. Syntax supports IP addresses, domain names, onion and i2p hosts. |
| `--add-priority-node`     | Specify list of nodes to connect to and then attempt to keep the connection open. <br /><br />To add multiple nodes use the option several times. Example: <br />`./judecoind --add-priority-node=178.128.192.138:16060 --add-priority-node=144.76.202.167:16060` |
| `--add-exclusive-node`    | Specify list of nodes to connect to only. If this option is given the options `--add-priority-node` and `--seed-node` are ignored. <br /><br />To add multiple nodes use the option several times. Example: <br />`./judecoind --add-exclusive-node=178.128.192.138:16060 --add-exclusive-node=144.76.202.167:16060` |
| `--out-peers`             | Set max number of outgoing connections to other nodes. By default 12. Value `-1` represents the code default. |
| `--in-peers`              | Set max number of incoming connections (nodes actively connecting to you). By default unlimited. Value `-1` represents the code default. |
| `--limit-rate-up`         | Set outgoing data transfer limit [kB/s]. By default 2048 kB/s. Value `-1` represents the code default. |
| `--limit-rate-down`       | Set incoming data transfer limit [kB/s]. By default 8192 kB/s. Value `-1` represents the code default. |
| `--limit-rate`            | Set the same limit value for incoming and outgoing data transfer. By default (`-1`) the individual up/down default limits will be used. It is better to use `--limit-rate-up` and `--limit-rate-down` instead to avoid confusion. |
| `--tos-flag`              | Set the TOS flag. |
| `--pad-transactions`      | Pad relayed transactions to help defend against traffic volume analysis. |
| `--offline`               | Do not listen for peers, nor connect to any. Useful for working with a local, archival blockchain. |
| `--allow-local-ip`        | Allow adding local IP to peer list. Useful mostly for debug purposes when you may want to have multiple nodes on a single machine. |

#### Node RPC API

`judecoind` node offers powerful API. It serves 3 purposes:

* provides network data (stats, blocks, transactions, ...)
* provides local node information (peer list, hash rate if mining, ...)
* provides interface for wallets (send transactions, ...)

This API is typically referred to as "RPC" because it is mostly based on JSON/RPC standard.

The following options define how the API behaves.

| Option                               | Description                                                  |
| ------------------------------------ | ------------------------------------------------------------ |
| `--rpc-bind-ip`                      | Specify IP to bind RPC server. By default `127.0.0.1`. |
| `--rpc-bind-ipv6-address`            | Specify IPv6 address to bind RPC server. By default `::1`. |
| `--rpc-use-ipv6`                     | Allow IPv6 for RPC. |
| `--rpc-ignore-ipv4`                  | Ignore unsuccessful IPv4 bind for RPC. |
| `--rpc-login`                        | Specify `username[:password]` required for RPC server. |
| `--confirm-external-bind`            | Confirm rpc-bind-ip value is NOT a loopback (local) IP. |
| `--rpc-access-control-origins`       | Specify a comma separated list of origins to allow cross origin resource sharing. |
| `--rpc-public`                       | Specify an IP:PORT to listen on for public restricted RPC requests; can be specified multiple times. |
| `--rpc-admin`                        | Specify an IP:PORT to listen on for admin unrestricted RPC requests; can be specified multiple times. Specify `none` to disable. |

#### JudeMQ RPC

JudeMQ provides additional RPC listener options for public, encrypted, admin, user, and local-control connections.

| Option                    | Description                                                  |
| ------------------------- | ------------------------------------------------------------ |
| `--jmq-public`            | Add a public, unencrypted JudeMQ RPC listener with restricted capabilities. |
| `--jmq-curve-public`      | Add a curve-encrypted JudeMQ RPC listener that accepts restricted RPC commands from any client that knows the server's public x25519 key. |
| `--jmq-curve`             | Add a curve-encrypted JudeMQ RPC listener that accepts only whitelisted client x25519 public keys. |
| `--jmq-admin`             | Add an x25519 public key for a client permitted to connect with unrestricted admin capabilities. |
| `--jmq-user`              | Add an x25519 public key for a client permitted to connect with restricted capabilities. |
| `--jmq-local-control`     | Add an unencrypted JudeMQ RPC listener with full unrestricted capabilities and no authentication. Do not use this on a publicly accessible address. |
| `--jmq-public-quorumnet`  | Allow the curve-enabled quorumnet address of a Service Node to be used for public RPC commands. |

#### Service Node

These options are used when running `judecoind` as a Judecoin Service Node.

| Option                     | Description                                                  |
| -------------------------- | ------------------------------------------------------------ |
| `--service-node`           | Run as a Service Node. The `--service-node-public-ip` option must be set. |
| `--service-node-public-ip` | Public IP address on which this Service Node's services are accessible. This IP address is advertised to the network via Service Node uptime proofs. |
| `--quorumnet-port`         | Port used by the Service Node for direct connections from other Service Nodes for quorum messages. Defaults to `16063` on mainnet. |
| `--store-quorum-history`   | Store Service Node quorum history for the last N blocks to allow historical quorum lookups, for example by a block explorer. |

#### Mining

These options are used to start and configure mining from `judecoind`.

| Option                          | Description                                                  |
| ------------------------------- | ------------------------------------------------------------ |
| `--start-mining`                | Specify wallet address to mine for. |
| `--mining-threads`              | Specify mining threads count. |
| `--bg-mining-enable`            | Enable background mining. |
| `--bg-mining-ignore-battery`    | If true, assume plugged in when unable to query system power status. |
| `--bg-mining-min-idle-interval` | Specify minimum lookback interval in seconds for determining idle state. |
| `--bg-mining-idle-threshold`    | Specify minimum average idle percentage over the lookback interval. |
| `--bg-mining-miner-target`      | Specify maximum percentage CPU use by miners. |

#### Accepting Judecoin

These are network notifications offered by `judecoind`. There are also wallet notifications like `--tx-notify` offered by `judecoin-wallet-rpc`.

| Option                      | Description                                                  |
| --------------------------- | ------------------------------------------------------------ |
| `--block-notify <arg>`      | Run a program for each new block. The `<arg>` must be a **full path**. If the `<arg>` contains `%s` it will be replaced by the block hash. Example: <br />`./judecoind --block-notify="/usr/bin/echo %s"`<br /><br />Block notifications are good for immediate reaction. However, you should always assume you will miss some block notifications and you should independently poll the API to cover this up. <br /><br />Mind blockchain reorganizations. Block notifications can revert to same and past heights. Small reorganizations are natural and happen every day. |
| `--block-rate-notify <arg>` | Run a program when the number of blocks received in the recent past deviates significantly from the expectation. The `<arg>` must be a **full path**. The `<arg>` can contain any of `%t`, `%b`, `%e` symbols to interpolate: <br /><br />`%t`: the number of minutes in the observation window<br /><br />`%b`: the number of blocks observed in that window<br /><br />`%e`: the ideal number of blocks expected in that window<br /><br /> The option will let you know if the network hash rate drops by a lot. This may be indicative of a large section of the network miners moving off to mine a private chain, to be later released to the network. Note that if this event triggers, it is not incontrovertible proof that this is happening. It might just be chance. The longer the window (the %t parameter), and the larger the distance between actual and expected number of blocks, the more indicative it is of a possible chain reorg double-spend attack being prepared.<br /><br />**Recommendation:** unless you run economically significant Judecoin exchange or operation, do **not** act on this data. It is hard to calibrate and easy to misinterpret. If this is a real attack, it will target high-liquidity entities and not small merchants. |
| `--reorg-notify <arg>`      | Run a program when reorganization happens (ie, at least one block is removed from the top of the blockchain). The `<arg>` must be a **full path**. The `<arg>` can contain any of `%s`, `%h`, `%n` symbols to interpolate: <br /><br />`%s`: the height at which the split occurs <br /><br />`%h`: the height of the new blockchain<br /><br />`%d`: the number of blocks discarded from the old chain <br /><br />`%n`: the number of blocks being added <br /><br /> The option will let you know when a block is removed from the chain to be replaced by other blocks. This happens when a 51% attack occurs, but small reorgs also happen in the normal course of things. The `%d` parameter will be set to the number of blocks discarded from the old chain (so if this is higher than the number of confirmations you wait to act upon an incoming payment, that payment might have been cancelled). The `%n` parameter will be set to the number of blocks in the new chain (so if this is higher than the number of confirmations you wait to act upon an incoming payment, any incoming payment in the first block will be automatically acted upon by your platform). <br /><br />**Recommendation**: unless you run economically significant Judecoin exchange or operation, you do **not** need to bother with this option. Simply account for reorganizations by requiring at least 10 confirmations before shipping valuable goods. |

#### Performance

These are advanced options that allow you to optimize performance of your `judecoind` node, sometimes at the expense of reliability.

| Option                       | Description                                                  |
| ---------------------------- | ------------------------------------------------------------ |
| `--prune-blockchain`         | Pruning saves 2/3 of disk space w/o degrading functionality. For maximum effect this should be used already **on the first sync**. If you add this option later the past data will only be pruned logically w/o shrinking the file size and the gain will be delayed. <br /><br />If you already have unpruned blockchain, see the `judecoin-blockchain-prune` tool. <br /><br />The drawback is that you will contribute less to Judecoin P2P network in terms of helping new nodes to sync up (up to 1/8 of normal contribution). You will still be useful regarding relaying new transactions and blocks though. |
| `--sync-pruned-blocks`       | Accept pruned blocks instead of pruning yourself. It should save network transfer when used with `--prune-blockchain`. See the [commit](https://github.com/Judecoin/judecoin/commit/8330e772f1ed680a54833d25c4d17d09a99ab8d6). |
| `--db-sync-mode`             | Specify sync option, using format:<br />`[safe|fast|fastest]:[sync|async]:[<nblocks_per_sync>[blocks]|<nbytes_per_sync>[bytes]]`<br /><br />The default is `fast:async:250000000bytes`.<br /><br />The `fast:async:*` can corrupt blockchain database in case of a system crash. It should not corrupt if just `judecoind` crashes. If you are concerned with system crashes use `safe:sync`. |
| `--prep-blocks-threads`      | Max number of threads to use when computing block hashes (PoW) in groups. Defaults to 4. Decrease this if you don't want `judecoind` hog your computer when syncing. |
| `--fast-block-sync`          | Sync up most of the way by using embedded, "known" block hashes. Pass `1` to turn on and `0` to turn off. This is on (`1`) by default. Normally, for every block the full node must calculate the block hash to verify miner's proof of work. Because the CryptoNight PoW used in Judecoin is very expensive (even for verification), `judecoind` offers skipping these calculations for old blocks. In other words, it's a mechanism to trust `judecoind` binary regarding old blocks' PoW validity, to sync up faster. |
| `--block-sync-size`          | How many blocks are processed in a single batch during chain synchronization. By default this is 20 blocks for newer history and 100 blocks for older history ("pre v4"). Default behavior is represented by value `0`. Intuitively, the more resources you have, the bigger batch size you may want to try out. Example:<br />`./judecoind --block-sync-size=500` |
| `--bootstrap-daemon-address` | The host:port of a "bootstrap" remote open node that the connected wallets can use while this node is still not fully synced. Example:<br/>`./judecoind --bootstrap-daemon-address=host:port`. The node will forward selected RPC calls to the bootstrap node. The wallet will handle this automatically and transparently. Obviously, such bootstrapping phase has privacy implications similar to directly using a remote node. |
| `--bootstrap-daemon-login`   | Specify username:password for the bootstrap daemon login (if required). This considers the RPC interface used by the wallet. Normally, open nodes do not require any credentials. |

#### Testing Judecoin itself

These options are useful for Judecoin project developers and testers. Normal users shouldn't be concerned with these.

| Option                        | Description                                                  |
| ----------------------------- | ------------------------------------------------------------ |
| `--keep-alt-blocks`           | Keep alternative blocks on restart. May help with researching reorgs etc. |
| `--test-drop-download`        | For net tests: in download, discard ALL blocks instead checking/saving them (very fast). |
| `--test-drop-download-height` | Like test-drop-download but discards only after around certain height. By default `0`. |
| `--keep-fakechain`            | Don't delete any existing database when in fakechain mode.   |
| `--fixed-difficulty`          | Fixed difficulty used for testing. By default `0`.           |
| `--test-dbg-lock-sleep`       | Sleep time in ms, defaults to 0 (off), used to debug before/after locking mutex. Values 100 to 1000 are good for tests. |

#### Legacy

These options should no longer be necessary. They are still present in `judecoind` for backwards compatibility.

| Option                   | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| `--ban-list`             | Specify ban list file, one IP address per line. Example: <br />`./judecoind --ban-list=block.txt`.<br /><br />It is **not recommended** to statically ban any IP addresses unless you absolutely need to. Banning IPs often excludes the most vulnerable users who are forced to operate entirely behind Tor or other anonymity networks. |
| `--enable-dns-blocklist` | Similar to `--ban-list` but instead of a static file uses dynamic IP blocklist available as DNS TXT entries. The DNS blocklist is centrally managed by Judecoin contributors. It is **not recommended** unless in emergency situations. |
| `--fluffy-blocks`        | Relay compact blocks. Default. Compact block is just a header and a list of transaction IDs. |
| `--no-fluffy-blocks`     | Relay classic full blocks. Classic block contains all transactions. |
| `--show-time-stats`      | Official docs say "Show time-stats when processing blocks/txs and disk synchronization" but it does not seem to produce any output during usual blockchain synchronization. |
| `--zmq-rpc-bind-ip`      | IP for ZMQ RPC server to listen on. By default `127.0.0.1`. This is not yet widely used as ZMQ interface currently does not provide meaningful advantage over classic JSON-RPC interface. |
| `--zmq-rpc-bind-port`    | Port for ZMQ RPC server to listen on. By default `16062` for mainnet |
| `--zmq-pub`              | Address for ZMQ pub - `tcp://ip:port` or `ipc://path`        |

## Commands

Commands give access to specific services provided by the daemon.
Commands are executed against the running daemon.
Their names follow the `command_name` pattern.

The following groups are only to make reference easier to follow.
The daemon itself does not group commands in any way.

See [running](#running) for example usage.
You can also type commands directly in the console of the running `judecoind` (if not detached).

#### Help, version, status

| Option                         | Description                                                  |
| ------------------------------ | ------------------------------------------------------------ |
| `help [<command>]`             | Show help for `<command>`.                                   |
| `apropos <keyword> [<keyword> ...]` | Search commands by keyword.                              |
| `version`                      | Show version information.                                    |
| `status`                       | Show daemon status.                                          |
| `print_status`                 | Show if daemon is running.                                   |
| `diff`                         | Show current network difficulty.                             |
| `mining_status`                | Show mining status.                                          |

#### P2P network

| Option                   | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| `print_pl [white] [gray] [pruned] [publicrpc] [<limit>]` | Show the peer list, optionally filtered by peer type. |
| `print_pl_stats`         | Show the peer list statistics. |
| `print_cn`               | Show connected peers with connection initiative and other stats. |
| `print_net_stats`        | Show network statistics. |
| `ban [<IP>\|@<filename>] [<seconds>]` | Ban a given IP address, or ban IPs listed in a file, for a given number of seconds. |
| `banned <address>`       | Show whether an address is currently banned. |
| `unban <address>`        | Unban a given address. |
| `bans`                   | Show the currently banned addresses. |
| `in_peers <max_number>`  | Set the maximum number of incoming connections from other peers. |
| `out_peers <max_number>` | Set the maximum number of outgoing connections to other peers. |
| `limit [<kB/s>]`         | Get or set the download and upload limit. |
| `limit_down [<kB/s>]`    | Get or set the download limit. |
| `limit_up [<kB/s>]`      | Get or set the upload limit. |
| `hide_hr`                | Stop showing hash rate information. |
| `show_hr`                | Start showing hash rate information. |

#### Transaction pool

| Option                  | Description                                                  |
| ----------------------- | ------------------------------------------------------------ |
| `flush_txpool [<txid>]` | Flush the specified transaction from the transaction pool, or flush the whole transaction pool if `<txid>` is not provided. |
| `flush_cache [bad-txs] [bad-blocks]` | Flush cached bad transactions and/or bad blocks. |
| `print_pool`            | Print the transaction pool using a verbose format.           |
| `print_pool_sh`         | Print the transaction pool using a short format.             |
| `print_pool_stats`      | Print the transaction pool's statistics, including number of transactions, memory size, fees, and double-spend attempts. |

#### Transactions

| Option                                                 | Description                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------ |
| `print_coinbase_tx_sum <start_height> [<block_count>]` | Show a sum of all emitted coins and paid fees within specified range. Example:<br />`./judecoind print_coinbase_tx_sum 0 1000000000` |
| `print_tx <transaction_hash> [+hex] [+json]`           | Show specified transaction as JSON and/or HEX.               |
| `relay_tx <txid>`                                      | Force relaying the transaction. Useful if you want to rebroadcast the transaction for any reason or if transaction was previously created with "do_not_relay":true. |

#### Blockchain

| Option                                      | Description                                                  |
| ------------------------------------------- | ------------------------------------------------------------ |
| `print_height`                              | Show local blockchain height.                                |
| `sync_info`                                 | Show blockchain sync progress and connected peers along with download / upload stats. |
| `print_bc <begin_height> [<end_height>]`    | Show blocks in range `<begin_height>`..`<end_height>`. The information includes block id, height, timestamp, version, size, weight, number of non-coinbase transactions, difficulty, nonce, and reward. |
| `print_block <block_hash> \| <block_height>` | Show detailed data of specified block.                       |
| `alt_chain_info [blockhash]`                | Show alternate chain information, optionally for a specific block hash. |
| `bc_dyn_stats <last_block_count>`           | Show blockchain dynamic statistics for the last specified number of blocks. |
| `check_blockchain_pruning`                  | Check blockchain pruning status.                             |
| `print_checkpoints [+json] [start height] [end height]` | Print checkpoints, optionally as JSON and within a height range. |
| `hard_fork_info`                            | Show current consensus version and future hard fork block height, if any. |
| `is_key_image_spent <key_image>`            | Check if specified [key image](/cryptography/asymmetric/key-image/) is spent. Key image is a hash. |
| `output_histogram [@<amount>] <min_count> [<max_count>]` | Show output histogram data for amounts and count ranges. |
| `pop_blocks <nblocks>`                      | Remove the specified number of blocks from the blockchain.   |
| `print_sr <height>`                         | Print Service Node reward information for a given height.    |

#### Manage daemon

| Option                               | Description                                                  |
| ------------------------------------ | ------------------------------------------------------------ |
| `exit`, `stop_daemon`                | Ask daemon to exit gracefully. The `exit` and `stop_daemon` are identical; one is an alias of the other. |
| `set_log <level>\|<{+,-,}categories>` | Set the current log level or logging categories, where `<level>` is a number from 0 to 4. |
| `set_bootstrap_daemon (auto \| none \| host[:port] [username] [password])` | Set or disable the bootstrap daemon. |

#### Service Node

| Option                                             | Description                                                  |
| -------------------------------------------------- | ------------------------------------------------------------ |
| `prepare_registration [+force]`                    | Prepare Service Node registration information.               |
| `print_sn [<pubkey> [...]] [+json\|+detail]`       | Print Service Node information, optionally filtered by public key. |
| `print_sn_key`                                     | Print this node's Service Node key.                          |
| `print_sn_status [+json\|+detail]`                 | Print this node's Service Node status.                       |
| `print_quorum_state [start height] [end height]`   | Print Service Node quorum state for a height range.          |
| `print_sn_state_changes <start_height> [end height]` | Print Service Node state changes for a height range.       |
| `test_trigger_uptime_proof`                        | Trigger a Service Node uptime proof for testing.             |

#### Mining

| Option                                                                 | Description                                                  |
| ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| `start_mining <addr> [<threads>\|auto] [num_blocks] [do_background_mining] [ignore_battery]` | Start mining to the specified address. |
| `stop_mining`                                                          | Stop mining.                                                 |

#### Legacy

| Option | Description                                                  |
| ------ | ------------------------------------------------------------ |
| `save` | Flush blockchain data to disk. This is normally no longer necessary as `judecoind` saves the blockchain automatically on exit. |

