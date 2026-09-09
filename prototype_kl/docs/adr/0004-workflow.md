# ADR 0004: One commit per feature, tests before commit

**Status:** Accepted  
**Date:** 2026-04-18  
**Context:** The calculator is being built incrementally and the workflow must
stay reviewable and safe.

**Decision:** Each feature is developed as a single commit and pushed only after
`go test ./...` passes. Commands, state, and docs are added alongside tests for
the feature they support.

**Consequences:** History reads as a changelog; regressions are bisectable;
every commit is independently buildable and green.
