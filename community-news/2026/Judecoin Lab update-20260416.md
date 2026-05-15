# Judecoin Lab update #20260416

> **Date:** April 16, 2026  
> **Category:** News

## `quorum_cop`: Fix Bug in Missing Node Detection and Add Logging

Fixed a bug in missing node detection and added logging.

## Service Nodes: Add Quorum States to Database Storage

Added quorum states to database storage for Service Nodes.

## Make Transaction Type and Version Scoped Enums

This converts the transaction type and version to scoped enums, giving type safety and making transaction type assignment less error-prone.

There is no implicit conversion or comparison with raw integers that needs to be considered.

This converts uses of:

```text
cryptonote::transaction::type_xyz
```

to:

```text
cryptonote::transaction::txtype::xyz
```

For versions, names such as:

```text
transaction::version_v3
```

become:

```text
cryptonote::txversion::v3_tx_types
```

This also allows and includes various other simplifications related to, or enabled by, this change:

- Handle `is_standard_tx` dynamically in serialization code, setting `type::standard` or `type::state_change` rather than using a version-determined union.

- `get_type()` is no longer needed with the above change. It is now much simpler to directly access `type`, which will always have the correct value, even for v2 or v3 transaction types.

- Although there was an assertion on the enum value, `get_type()` was only used sporadically, and many places accessed `.type` directly.

- The old unscoped enum did not have a type but was assumed castable to and from `uint16_t`, which technically meant there was potential undefined behavior when deserializing any type values greater than or equal to `8`.

- Transaction type range checks were not being done in all serialization paths. They are now.

- Because `get_type()` was not used everywhere, and many places simply accessed `.type` directly, these issues might not have been caught before.

- `set_type()` is not needed. It was only being used in a single place, `wallet2.cpp`, and only for v3 transactions, so the version protection code was never doing anything.

- Added a `std::ostream <<` operator for the enum types so that they can be output with:

  ```cpp
  << tx_type <<
  ```

  rather than needing to wrap it everywhere in:

  ```cpp
  type_to_string(tx_type)
  ```

- For versions, the annotated version string is output, such as `v3_tx_types`, rather than just the number.
