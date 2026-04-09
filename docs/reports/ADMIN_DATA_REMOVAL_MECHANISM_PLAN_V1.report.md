# ADMIN_DATA_REMOVAL_MECHANISM_PLAN_V1.report

## What The Narrowed Plan Keeps

The narrowed plan keeps four positions:

- ordinary safe delete remains as-is;
- delete stays strict;
- published test graph teardown is the real next blocked case;
- mixed graph refusal remains explicit.

## What Was Removed From The Broader Version

Removed from the immediate next slice:

- general retire/deactivate for ordinary published entities;
- broader archive expansion;
- general removal/lifecycle framing for the whole product;
- broader treatment of “published but obsolete product truth”;
- any suggestion that the next step should solve all removal scenarios at once.

## What The Narrowed Plan Now Covers

Only one next execution slice:

1. explicit test marking extended to test `Page` creation flows;
2. graph evaluation from a test-marked root;
3. graph preview / dry-run before destruction;
4. strict refusal for mixed graphs;
5. teardown-only published-truth deactivation for pure test-marked graph members;
6. safe dependency-aware delete after deactivation.

## What Ordinary Delete Should Still Handle

Ordinary delete should continue handling:

- safe draft cleanup;
- isolated non-live junk;
- agent-test rows that never became protected live truth.

It should continue refusing published and referenced truth.

## Recommendation

The next move should be implementation planning or direct execution for the teardown slice above, not another broader removal-model round.
