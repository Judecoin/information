# Judecoin Configuration File

## Applicability

By default Judecoin looks for `bitjudecoin.conf` in Judecoin [data directory](/interacting/overview/#data-directory).

To use a specific config file add `--config-file` option:

`./judecoind --config-file=/etc/judecoind.conf`

The `--config-file` option is available for: 

* `judecoind`
* `judecoin-wallet-rpc`

## Syntax

* `option-name=value`
* `valueless-option-name=1` for options that don't expect value
* `# comment`
* whitespace is ignored

## Reference

All configuration options are the same as command line options for the binary.

* [judecoind reference](./judecoind-reference)
* [judecoin-wallet-rpc reference](./judecoin-wallet-rpc-reference)

Skip the `--` from `--option-name`.

Example:

`./judecoind --log-level=4 --stagenet`

translates to:

    log-level=4
    stagenet=1     # use value "1" to enable the value-less options like --stagenet 

## Examples

### `judecoind.conf`

This config is tailored for production server usage.

    # /etc/judecoin/judecoind.conf
    
    # Data directory (blockchain db and indices)
    data-dir=/home/judecoin/.judecoin  # Remember to create the judecoin user first
    
    # Log file
    log-file=/var/log/judecoin/judecoind.log
    max-log-file-size=0            # Prevent judecoind from managing the log files; we want logrotate to take care of that
    
    # P2P full node
    p2p-bind-ip=0.0.0.0            # Bind to all interfaces (the default)
    p2p-bind-port=16060            # Bind to default port
    
    # RPC open node
    rpc-bind-ip=0.0.0.0            # Bind to all interfaces
    rpc-bind-port=16061            # Bind on default port
    confirm-external-bind=1        # Open node (confirm)
    restricted-rpc=1               # Prevent unsafe RPC calls
    no-igd=1                       # Disable UPnP port mapping
    
    # Slow but reliable db writes
    db-sync-mode=safe
    
    
    out-peers=64              # This will enable much faster sync and tx awareness; the default 8 is suboptimal nowadays
    in-peers=1024             # The default is unlimited; we prefer to put a cap on this
    
    limit-rate-up=1048576     # 1048576 kB/s == 1GB/s; a raise from default 2048 kB/s; contribute more to p2p network
    limit-rate-down=1048576   # 1048576 kB/s == 1GB/s; a raise from default 8192 kB/s; allow for faster initial sync

