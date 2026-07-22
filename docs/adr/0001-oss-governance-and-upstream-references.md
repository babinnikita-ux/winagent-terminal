# ADR 0001: OSS governance and upstream references

## Status

Accepted — 2026-07-22.

## Context

WinAgent Terminal preserves a substantial wmux history. Bare issue numbers
could resolve to this repository after publication, incorrectly implying that
historical wmux issues belong to WinAgent.

## Decision

Community health documents live at the repository root and under `.github`.
Historical upstream issue and pull-request references in maintained release
documentation use full `https://github.com/amirlehmam/wmux/...` URLs. New
WinAgent decisions use ADRs rather than reusing upstream issue numbers.

## Consequences

Contributors can distinguish inherited work from new work. Existing Git history
is retained unchanged, so historical commit messages remain historical records.
