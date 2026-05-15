# Judecoin Lab update #20251110

> **Date:** November 10, 2025  
> **Category:** News

## 1. Add `--service-node` Option to Daemon

By using this option, Judecoin can run in Service Node mode.

## 2. Add New Interactive Daemon Command `prepare_registration`

A new interactive daemon command, `prepare_registration`, has been added to generate a registration command.

This also allows users to use:

```bash
judecoind prepare_registration
```

to generate a registration command via RPC commands to `judecoind`.

This is particularly useful when `judecoind` is running in non-interactive mode.

## Example

```text
judecoind prepare_registration

2025-07-09 11:49:17.879 I Judecoin 'Chamaeleo dilepis' (v3.0.0-391e7e6a8)

Judecoin Service Node Registration

------------------------------

Service Node Pubkey: 8dc0d93a5f9ce759448e38bf9bbbd1f439a09d0c853e0b91626e50f6f07390f3

Staking requirement: 23600.000000000 jude from up to 9 contributors

Enter the JUDE address of the Service Node operator (C/Cancel):

J6jRMfcZBUNCoc3iacrJgh79UiuoQgW4KDe4aLh5Dww2N6B8iWhuzB1StgCEWjpt4YNVzfrQLRB82XfgjcYgcnHWSf1LKxo

The operator must stake between 5900.000000000 jude and 23600.000000000 jude.

How much JUDE does the operator want to stake? (B/Back/C/Cancel/max/min) [max]: 8000

This Service Node requires an additional stake of 15600.000000000 jude.

To add a reserved contribution spot enter the contributor's JUDE address now.

Leave this blank to leave the remaining stake open to public contributors. (B/Back/C/Cancel):

JBAo6emU36qSJU12Mdp6Pc1ioAFyRUiHbDDqbuoPRgSn6z6tnnsUzEHgRZ4axJb73Neb7DJjnfEHrQdjgUTvD7ZhF8hZnDj

The next contributor must stake between 1950.000000000 jude and 15600.000000000 jude.

How much JUDE does contributor 1 want to stake? (B/Back/C/Cancel/max/min) [max]: 5000

This Service Node requires an additional stake of 10600.000000000 jude.

To add a reserved contribution spot enter the contributor's JUDE address now.

Leave this blank to leave the remaining stake open to public contributors. (B/Back/C/Cancel):

This Service Node has multiple contributors and thus requires an operator fee percentage. This percentage is removed from the block reward and assigned to the operator, then the remaining reward is split among contributors, including the operator, proportionally to their contribution.

Enter the operator fee as a percentage [0.00-100.00] (B/Back/C/Cancel): 5.67

Total reserved contributions: 13000.000000000 jude.

The total reserved amount (13000.000000000 jude) is less than the required full stake (23600.000000000 jude).

The remaining stake (10600.000000000 jude) will be open to contribution from 1-7 public contributors.

The Service Node will not activate until the entire stake has been contributed.

Is this acceptable? (Y/Yes/N/No/B/Back/C/Cancel): Y

Registration Summary:

Service Node Pubkey: 8dc0d93a5f9ce759448e38bf9bbbd1f439a09d0c853e0b91626e50f6f07390f3

Operator fee (as % of Service Node rewards): 5.67%

 Contributor        Address            Contribution                     Contr. %

_____________    _____________      _________________            ________

   Operator      J6jRMfcZB..xo       8000.000000000              33.90%

Contributor 1   JBAo6emU3..Dj       5000.000000000              21.19%

    (open)          (any)            >=1514.285714286            >=6.42%

    (open)          (any)

    (open)          (any)

    (open)          (any)

    (open)          (any)

    (open)          (any)

    (open)          (any)

Is the staking information above correct? (Y/Yes/N/No/B/Back/C/Cancel): Y
```
