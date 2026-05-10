# Judecoin Lab update #20251230

> **Date:** December 30, 2025  
> **Category:** News

## Use `shared_ptr` Storage for `service_node_info`

This converts the stored `service_node_info` value into a `shared_ptr` rather than a plain `service_node_info`.

This yields a huge performance benefit by significantly eliminating the vast majority of `service_node_info` construction, destruction, and copying.

Most of the time when a `service_node_info` is copied, nothing in it has changed, which means the same thing is being stored again.

This previously caused extra construction for every Service Node info on every block, and extra destruction when old stored history was culled.

By using a `shared_ptr`, the vast majority of those constructions and destructions are eliminated.

With the `shared_ptr` approach, a copy is only made when a change is actually needed, such as infrequent per-Service Node events including `state_change`, received reward, contribution, and similar changes.

The contained reference is deliberately `const` so that values are not changeable.

A new function performs an explicit copying duplication, returning the new non-const value and storing the const reference in the shared pointer.

Related to this is a small change and fix to how proof info and `public_ip` are stored.

Rather than storing the values in the `service_node_info` struct itself, they are now stored in a `shared_ptr` inside `service_node_info`, which is intentionally shared among all copies of the `service_node_info`.

In other words, a Service Node info copy deliberately copies the pointer rather than the values.

This also moves the IP values into the proof struct, since that is easier than maintaining a separate `shared_ptr` for each value.

Previously, because these values were stored directly in `service_node_info`, they would get rolled back in the event of a reorg.

That behavior is undesirable, because it could roll back to old values of the uptime proof and IP address.

Those values are not dependent on the blockchain and should not be affected by a reorg or rollback.

With this change, they are not affected, since there is only one actual proof stored.

Note that the shared storage here only applies to in-memory states.

States loaded from the database will still be duplicated.
