# `judecoind` - Reference

## Overview

### Connects you to Judecoin network

The Judecoin daemon `judecoind` keeps your computer synced up with the Judecoin network.

It downloads and validates the blockchain from the p2p network.

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
tail -f ~/.bitmonero/bitmonero.log           # watch the logs
./judecoind exit                               # ask daemon to exit gracefully
```

## Options

Options define how the daemon should be working. Their names follow the `--option-name` pattern.

The following groups are only to make reference easier to follow. The daemon itself does not group options in any way.

#### Help and version

| Option         | Description                                                  |
| -------------- | ------------------------------------------------------------ |
| `--help`       | Enlist available options.                                    |
| `--version`    | Show `judecoind` version to stdout. Example output: <br />`Judecoin 'Oxygen Orion' (v0.17.1.8-release)` |
| `--os-version` | Show build timestamp and target operating system. Example output:<br />`OS: Linux #65-Ubuntu SMP Thu Dec 10 12:01:51 UTC 2020 5.4.0-59-generic`. |

#### Pick network

| Option    | Description                                         |
| --------- | --------------------------------------------------- |
| (missing) | By default judecoind assumes [mainnet](./networks). |

#### Logging

| Option                | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| `--log-file`          | Full path to the log file. Example (mind file permissions): <br/>`./judecoind --log-file=/var/log/judecoin/mainnet/judecoind.log` |
| `--log-level`         | `0-4` with `0` being minimal logging and `4` being full tracing. Defaults to `0`. These are general presets and do not directly map to severity levels. For example, even with minimal `0`, you may see some most important `INFO` entries. Temporarily changing to `1` allows for much better understanding of how the full node operates. Example: <br />`./judecoind --log-level=1` |
| `--max-log-file-size` | Soft limit in bytes for the log file (=104850000 by default, which is just under 100MB). Once log file grows past that limit, `judecoind` creates the next log file with a UTC timestamp postfix `-YYYY-MM-DD-HH-MM-SS`.<br /><br />In production deployments, you would probably prefer to use established solutions like logrotate instead. In that case, set `--max-log-file-size=0` to prevent judecoind from managing the log files. |
| `--max-log-files`     | Limit on the number of log files (=50 by default). The oldest log files are removed. In production deployments, you would probably prefer to use established solutions like logrotate instead. |

#### Server

`judecoind` defaults are adjusted for running it occasionally on the same computer as your Judecoin wallet.

The following options will be helpful if you intend to have an always running node &mdash; most likely on a remote server or your own separate PC.

| Option                | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| `--config-file`       | Full path to the [configuration file](./judecoin-config-file). By default `judecoind` looks for `bitjudecoin.conf` in Judecoin [data directory](./overview/#data-directory). |
| `--data-dir`          | Full path to data directory. This is where the blockchain, log files, and p2p network memory are stored. For defaults and details see [data directory](./overview/#data-directory). |
| `--pidfile`           | Full path to the PID file. Works only with `--detach`. Example: <br />`./judecoind --detach --pidfile=/run/judecoin/judecoind.pid` |
| `--detach`            | Go to background (decouple from the terminal). This is useful for long-running / server scenarios. Typically, you will also want to manage `judecoind` daemon with systemd or similar. By default `judecoind` runs in a foreground. |
| `--non-interactive`   | Do not require tty in a foreground mode. Helpful when running in a container. By default `judecoind` runs in a foreground and opens stdin for reading. This breaks containerization because no tty gets assigned and `judecoind` process crashes. You can make it run in a background with `--detach` but this is inconvenient in a containerized environment because the canonical usage is that the container waits on the main process to exist (forking makes things more complicated). |
| `--no-zmq`            | Disable ZMQ RPC server. You **should** use this option to limit attack surface and number of unnecessarily open ports (the ZMQ server is unfinished thing and you are unlikely to ever use it). |
| `--no-igd`            | Disable UPnP port mapping on the router ("Internet Gateway Device"). Add this option to improve security if you are **not** behind a NAT (you can bind directly to public IP or you run through Tor). |
| `--max-txpool-weight` | Set maximum transactions pool size in bytes. By default 648000000 (~618MB). These are transactions pending for confirmations (not included in any block). |

#### P2P network

The following options define how your node participates in Judecoin peer-to-peer network.
This is for node-to-node communication. The following options do **not** affect [wallet-to-node](#node-rpc-api) interface.

The node and peer words are used interchangeably.

| Option                    | Description                                                  |
| ------------------------- | ------------------------------------------------------------ |
| `--p2p-bind-ip`           | IPv4 network interface to bind to for p2p network protocol. Default value `0.0.0.0` binds to all network interfaces. This is typically what you want. <br /><br />You must change this if you want to constrain binding, for example to force working through Tor via torsocks: <br />`DNS_PUBLIC=tcp://1.1.1.1 TORSOCKS_ALLOW_INBOUND=1 torsocks ./judecoind --p2p-bind-ip 127.0.0.1  --no-igd  --hide-my-port` |
| `--p2p-bind-port`         | TCP port to listen for p2p network connections. Defaults to `16060` for mainnet, `26060` for testnet, and `36060` for stagenet. You normally wouldn't change that. This is helpful to run several nodes on your machine to simulate private Judecoin p2p network (likely using private Testnet). Example: <br/>`./judecoind --p2p-bind-port=46060` |
| `--p2p-external-port`     | TCP port to listen for p2p network connections on your router. Relevant if you are behind a NAT and still want to accept incoming connections. You must then set this to relevant port on your router. This is to let `judecoind` know what to advertise on the network. Default is `0`. |
| `--p2p-use-ipv6`          | Enable IPv6 for p2p (disabled by default).                   |
| `--p2p-bind-ipv6-address` | IPv6 network interface to bind to for p2p network protocol. Default value `::` binds to all network interfaces. |
| `--p2p-bind-port-ipv6`    | TCP port to listen for p2p network connections. By default same as IPv4 port for given nettype. |
| `--p2p-ignore-ipv4`       | Ignore unsuccessful IPv4 bind for p2p. Useful if you only want to use IPv6. |
| `--igd`                   | Set UPnP port mapping on the router ("Internet Gateway Device"). One of: `disabled` \| `enabled` \| `delayed` (=`delayed` by default). Relevant if you are behind NAT and want to accept incoming P2P network connections. The `delayed` value means it will wait for incoming connections in hope UPnP may not be necessary. After a while w/o incoming connections found it will attempt to map ports with UPnP. If you know you need UPnP change it to `enabled` to fast track the process. |
| `--hide-my-port`          | `judecoind` will still open and listen on the p2p port. However, it will not announce itself as a peer list candidate. Technically, it will return port `0` in a response to p2p handshake (`node_data.my_port = 0` in `get_local_node_data` function). In effect nodes you connect to won't spread your IP to other nodes. To sum up, it is not really hiding, it is more like "do not advertise". |
| `--seed-node`             | Connect to a node to retrieve other nodes' addresses, and disconnect. If not specified, `judecoind` will use hardcoded seed nodes on the first run, and peers cached on disk on subsequent runs. |
| `--add-peer`              | Manually add node to local peer list, `host:port`. Syntax supports IP addresses, domain names, onion and i2p hosts. |
| `--add-priority-node`     | Specify list of nodes to connect to and then attempt to keep the connection open. <br /><br />To add multiple nodes use the option several times. Example: <br />`./judecoind --add-priority-node=178.128.192.138:16061 --add-priority-node=144.76.202.167:16061` |
| `--add-exclusive-node`    | Specify list of nodes to connect to only. If this option is given the options `--add-priority-node` and `--seed-node` are ignored. <br /><br />To add multiple nodes use the option several times. Example: <br />`./judecoind --add-exclusive-node=178.128.192.138:16061 --add-exclusive-node=144.76.202.167:16061` |
| `--out-peers`             | Set max number of outgoing connections to other nodes. By default 12. Value `-1` represents the code default. |
| `--in-peers`              | Set max number of incoming connections (nodes actively connecting to you). By default unlimited. Value `-1` represents the code default. |
| `--limit-rate-up`         | Set outgoing data transfer limit [kB/s]. By default 2048 kB/s. Value `-1` represents the code default. |
| `--limit-rate-down`       | Set incoming data transfer limit [kB/s]. By default 8192 kB/s. Value `-1` represents the code default. |
| `--limit-rate`            | Set the same limit value for incoming and outgoing data transfer. By default (`-1`) the individual up/down default limits will be used. It is better to use `--limit-rate-up` and `--limit-rate-down` instead to avoid confusion. |
| `--offline`               | Do not listen for peers, nor connect to any. Useful for working with a local, archival blockchain. |
| `--allow-local-ip`        | Allow adding local IP to peer list. Useful mostly for debug purposes when you may want to have multiple nodes on a single machine. |

#### 

#### Node RPC API

`judecoind` node offers powerful API. It serves 3 purposes:

* provides network data (stats, blocks, transactions, ...)
* provides local node information (peer list, hash rate if mining, ...)
* provides interface for wallets (send transactions, ...)

This API is typically referred to as "RPC" because it is mostly based on JSON/RPC standard.

The following options define how the API behaves.


| Option                               | Description                                                  |
| ------------------------------------ | ------------------------------------------------------------ |
| `--public-node`                      | Advertise to other users they can use this node as a remote one for connecting their wallets. Requires `--restricted-rpc`, `--rpc-bind-ip` and `--confirm-external-bind`. Without `--public-node` the node can still be public (assuming other relevant options are set) but won't be advertised as such on the P2P network. This option will allow wallets to auto-discover public nodes (instead of requiring user to manually find one). |
| `--rpc-bind-ip`                      | IP to listen on. By default `127.0.0.1` because API gives full administrative capabilities over the node. Set it to `0.0.0.0` to listen on all interfaces - but only in connection with one of `*-restricted-*` options **and**  `--confirm-external-bind`. |
| `--rpc-bind-port`                    | TCP port to listen on. By default `16061` (mainnet), `26061` (testnet), `36061` (stagenet). |
| `--rpc-bind-ipv6-address`            | IPv6 to listen on. By default `::1` (localhost). All remarks for `--rpc-bind-ip` are applicable here as well. |
| `--rpc-use-ipv6`                     | Enable IPv6 for RPC server (disabled by default).            |
| `--rpc-ignore-ipv4`                  | Ignore unsuccessful IPv4 bind for RPC. Useful if you only want to use IPv6. |
| `--rpc-restricted-bind-ip`           | IP to listen on with the limited version of API. The limited API can be made public to create an Open Node. By default `127.0.0.1`, set it to `0.0.0.0` to listen on all interfaces. |
| `--rpc-restricted-bind-ipv6-address` | IPv6 to listen on with the limited version of API. The limited API can be made public to create an Open Node. By default `::1` (localhost). Set it to `::` to listen on all interfaces. |
| `--rpc-restricted-bind-port`         | TCP port to listen on with the limited version of API. To be used in combination with `--rpc-restricted-bind-ip`. |
| `--confirm-external-bind`            | Confirm you consciously set `--rpc-bind-ip` to non-localhost IP and you understand the consequences. |
| `--restricted-rpc`                   | Restrict API to view only commands and do not return privacy sensitive data. Note this does not make sense with `--rpc-restricted-bind-port` because you would end up with two restricted APIs. |
| `--rpc-ssl`                          | Enable TLS on RPC connections. One of: `enabled` \| `disabled` \| `autodetect` (`=autodetect` by default). You **should** enable this if you connect a remote wallet. |
| `--rpc-ssl-private-key`              | Path to server's private key in PEM format. Generate it with `judecoin-gen-ssl-cert` tool. This is to facilitate server authentication to client. |
| `--rpc-ssl-certificate`              | Path to server's certificate in PEM format. Generate it with `judecoin-gen-ssl-cert` tool. This is to facilitate server authentication to client. |
| `--rpc-ssl-allowed-fingerprints`     | List of certificate fingerprints to accept. This is a way to authenticate clients. |
| `--rpc-ssl-allow-any-cert`           | Allow any certificate of connecting client.                  |
| `--rpc-ssl-ca-certificates`          | Path to file containing concatenated PEM format certificate(s) to replace system CA(s). |
| `--rpc-ssl-allow-chained`            | Allow user chained certificates. This is only applicable if user has a "real" CA issued certificate. |
| `--rpc-login`                        | Specify `username[:password]` required to connect to API.    |
| `--rpc-access-control-origins`       | Specify a comma separated list of origins to allow cross origin resource sharing. This is useful if you want to use `judecoind` API directly from a web browser via JavaScript (say in a pure-fronted web appp scenario). With this option `judecoind` will put proper HTTP CORS headers to its responses. You will also need to set `--rpc-login` if you use this option. Normally though, the API is used by backend app and this option isn't necessary. |
| `--disable-rpc-ban`                  | Do not ban hosts on RPC errors. May help to prevent judecoind from banning traffic originating from the Tor daemon. |


#### Accepting Judecoin

These are network notifications offered by `judecoind`. There are also wallet notifications like `--tx-notify` offered by `judecoin-wallet-rpc`.

| Option                      | Description                                                  |
| --------------------------- | ------------------------------------------------------------ |
| `--block-notify <arg>`      | Run a program for each new block. The `<arg>` must be a **full path**. If the `<arg>` contains `%s` it will be replaced by the block hash. Example: <br />`./judecoind --block-notify="/usr/bin/echo %s"`<br /><br />Block notifications are good for immediate reaction. However, you should always assume you will miss some block notifications and you should independently poll the API to cover this up. <br /><br />Mind blockchain reorganizations. Block notifications can revert to same and past heights. Small reorganizations are natural and happen every day. |
| `--block-rate-notify <arg>` | Run a program when the number of blocks received in the recent past deviates significantly from the expectation. The `<arg>` must be a **full path**. The `<arg`> can contain any of `%t`, `%b`, `%e` symbols to interpolate: <br /><br >`%t`: the number of minutes in the observation window<br /><br >`%b`: the number of blocks observed in that window<br /><br >`%e`: the ideal number of blocks expected in that window<br /><br > The option will let you know if the network hash rate drops by a lot. This may be indicative of a large section of the network miners moving off to mine a private chain, to be later released to the network. Note that if this event triggers, it is not incontrovertible proof that this is happening. It might just be chance. The longer the window (the %t parameter), and the larger the distance between actual and expected number of blocks, the more indicative it is of a possible chain reorg double-spend attack being prepared.<br /><br />**Recommendation:** unless you run economically significant Judecoin exchange or operation, do **not** act on this data. It is hard to calibrate and easy to misinterpret. If this is a real attack, it will target high-liquidity entities and not small merchants. |
| `--reorg-notify <arg>`      | Run a program when reorganization happens (ie, at least one block is removed from the top of the blockchain). The `<arg>` must be a **full path**. The `<arg`> can contain any of `%s`, `%h`, `%n` symbols to interpolate: <br /><br >`%s`: the height at which the split occurs <br /><br />`%h`: the height of the new blockchain<br /><br />`%d`: the number of blocks discarded from the old chain <br /><br />`%n`: the number of blocks being added <br /><br /> The option will let you know when a block is removed from the chain to be replaced by other blocks. This happens when a 51% attack occurs, but small reorgs also happen in the normal course of things. The `%d` parameter will be set to the number of blocks discarded from the old chain (so if this is higher than the number of confirmations you wait to act upon an incoming payment, that payment might have been cancelled). The `%n` parameter wil be set to the number of blocks in the new chain (so if this is higher than the number of confirmations you wait to act upon an incoming payment, any incoming payment in the first block will be automatically acted upon by your platform). <br /><br />**Recommendation**: unless you run economically significant Judecoin exchange or operation, you do **not** need to bother with this option. Simply account for reorganizations by requiring at least 10 confirmations before shipping valuable goods. |

#### Performance

These are advanced options that allow you to optimize performance of your `judecoind` node, sometimes at the expense of reliability.

| Option                       | Description                                                  |
| ---------------------------- | ------------------------------------------------------------ |
| `--prune-blockchain`         | Pruning saves 2/3 of disk space w/o degrading functionality. For maximum effect this should be used already **on the first sync**. If you add this option later the past data will only be pruned logically w/o shrinking the file size and the gain will be delayed. <br /><br />If you already have unpruned blockchain, see the `judecoin-blockchain-prune` tool. <br /><br />The drawback is that you will contribute less to Judecoin P2P network in terms of helping new nodes to sync up (up to 1/8 of normal contribution). You will still be useful regarding relaying new transactions and blocks though. |
| `--sync-pruned-blocks`       | Accept pruned blocks instead of pruning yourself. It should save network transfer when used with `--prune-blockchain`. See the [commit](https://github.com/judecoin-project/judecoin/commit/8330e772f1ed680a54833d25c4d17d09a99ab8d6) and [comments](https://web.getmonero.org/2019/09/08/logs-for-the-dev-meeting-held-on-2019-09-08.html). |
| `--db-sync-mode`             | Specify sync option, using format:<br />`[safe|fast|fastest]:[sync|async]:[<nblocks_per_sync>[blocks]|<nbytes_per_sync>[bytes]]`<br /><br />The default is `fast:async:250000000bytes`.<br /><br />The `fast:async:*` can corrupt blockchain database in case of a system crash. It should not corrupt if just `judecoind` crashes. If you are concerned with system crashes use `safe:sync`. |
| `--max-concurrency`          | Max number of threads to use for parallel jobs. The default value `0` uses the number of CPU threads. |
| `--prep-blocks-threads`      | Max number of threads to use when computing block hashes (PoW) in groups. Defaults to 4. Decrease this if you don't want `judecoind` hog your computer when syncing. |
| `--fast-block-sync`          | Sync up most of the way by using embedded, "known" block hashes. Pass `1` to turn on and `0` to turn off. This is on (`1`) by default. Normally, for every block the full node must calculate the block hash to verify miner's proof of work. Because the CryptoNight PoW used in Judecoin is very expensive (even for verification), `judecoind` offers skipping these calculations for old blocks. In other words, it's a mechanism to trust `judecoind` binary regarding old blocks' PoW validity, to sync up faster. |
| `--block-sync-size`          | How many blocks are processed in a single batch during chain synchronization. By default this is 20 blocks for newer history and 100 blocks for older history ("pre v4"). Default behavior is represented by value `0`. Intuitively, the more resources you have, the bigger batch size you may want to try out. Example:<br />`./judecoind --block-sync-size=500` |
| `--bootstrap-daemon-address` | The host:port of a "bootstrap" remote open node that the connected wallets can use while this node is still not fully synced. Example:<br/>`./judecoind --bootstrap-daemon-address=opennode.xmr-tw.org:16069`. The node will forward selected RPC calls to the bootstrap node. The wallet will handle this automatically and transparently. Obviously, such bootstraping phase has privacy implications similar to directly using a remote node. |
| `--bootstrap-daemon-login`   | Specify username:password for the bootstrap daemon login (if required). This considers the RPC interface used by the wallet. Normally, open nodes do not require any credentials. |

#### Testing Judecoin itself

These options are useful for Judecoin project developers and testers. Normal users shouldn't be concerned with these.

| Option                        | Description                                                  |
| ----------------------------- | ------------------------------------------------------------ |
| `--keep-alt-blocks`           | Keep alternative blocks on restart. May help with researching reorgs etc. |
| `--test-drop-download`        | For net tests: in download, discard ALL blocks instead checking/saving them (very fast). |
| `--test-drop-download-height` | Like test-drop-download but discards only after around certain height. By default `0`. |
| `--regtest`                   | Run in a regression testing mode.                            |
| `--keep-fakechain`            | Don't delete any existing database when in fakechain mode.   |
| `--fixed-difficulty`          | Fixed difficulty used for testing. By default `0`.           |
| `--test-dbg-lock-sleep`       | Sleep time in ms, defaults to 0 (off), used to debug before/after locking mutex. Values 100 to 1000 are good for tests. |
| `--save-graph`                | Save data for dr Judecoin.                                   |

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
| `--db-type`              | Specify database type. The default and only available: `lmdb`. |

## Commands

Commands give access to specific services provided by the daemon.
Commands are executed against the running daemon.
Their names follow the `command_name` pattern.

The following groups are only to make reference easier to follow.
The daemon itself does not group commands in any way.

See [running](#running) for example usage.
You can also type commands directly in the console of the running `judecoind` (if not detached).

#### Help, version, status

| Option             | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| `help [<command>]` | Show help for `<command>`.                                   |
| `version`          | Show version information.                                    |
| `status`           | Show status. Example output:<br />`Height: 186754/186754 (100.0%) on stagenet, not mining, net hash 317 H/s, v9, up to date, 8(out)+0(in) connections, uptime 0d 3h 48m 47s` |

#### P2P network

| Option                   | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| `print_pl`               | Show the full peer list.                                     |
| `print_pl_stats`         | Show the full peer list statistics (white vs gray peers). White peers are online and reachable. Grey peers are offline but your `judecoind` remembers them from past sessions. |
| `print_cn`               | Show connected peers with connection initiative (incoming/outgoing) and other stats. |
| `ban <IP> [<seconds>]`   | Ban a given `<IP>` for a given amount of `<seconds>`. By default the ban is for 24h. Example:<br />`./judecoind ban 187.63.135.161`. |
| `unban <IP>`             | Unban a given `<IP>`.                                        |
| `bans`                   | Show the currently banned IPs. Example output:<br />`187.63.135.161 banned for 86397 seconds`. |
| `in_peers <max_number>`  | Set the <max_number> of incoming connections from other peers. |
| `out_peers <max_number>` | Set the <max_number> of outgoing connections to other peers. |
| `limit [<kB/s>]`         | Get or set the download and upload limit.                    |
| `limit_down [<kB/s>]`    | Get or set the download limit.                               |
| `limit_up [<kB/s>]`      | Get or set the upload limit.                                 |

#### Transaction pool

| Option                  | Description                                                  |
| ----------------------- | ------------------------------------------------------------ |
| `flush_txpool [<txid>]` | Flush specified transaction from transactions pool, or flush the whole transactions pool if <txid> was not provided. |
| `print_pool`            | Print the transaction pool using a verbose format.           |
| `print_pool_sh`         | Print the transaction pool using a short format.             |
| `print_pool_stats`      | Print the transaction pool's statistics (number of transactions, memory size, fees, double spend attempts etc). |

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
| `print_bc <begin_height> [<end_height>]`    | Show blocks in range `<begin_height>`..`<end_height>`. The information will include block id, height, timestamp, version, size, weight, number of non-coinbase transactions, difficulty, nonce, and reward. |
| `print_block <block_hash> | <block_height>` | Show detailed data of specified block.                       |
| `hard_fork_info`                            | Show current consensus version and future hard fork block height, if any. |
| `is_key_image_spent <key_image>`            | Check if specified [key image](/cryptography/asymmetric/key-image/) is spent. Key image is a hash. |

#### Manage daemon

| Option                               | Description                                                  |
| ------------------------------------ | ------------------------------------------------------------ |
| `exit`, `stop_daemon`                | Ask daemon to exit gracefully. The `exit` and `stop_daemon` are identical (one is alias of the other). |
| `set_log <level>|<{+,-,}categories>` | Set the current log level/categories where `<level>` is a number 0-4. |
| `print_status`                       | Show if daemon is running.                                   |

#### Testing Judecoin itself

| Option             | Description                        |
| ------------------ | ---------------------------------- |
| `start_save_graph` | Start saving data for dr Judecoin. |
| `stop_save_graph`  | Stop saving data for dr Judecoin.  |

#### Legacy

| Option | Description                                                  |
| ------ | ------------------------------------------------------------ |
| `save` | Flush blockchain data to disk. This is normally no longer necessary as `judecoind` saves the blockchain automatically on exit. |

