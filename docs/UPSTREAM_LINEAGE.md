# Upstream lineage

## Inherited from wmux

WinAgent Terminal began as a derivative of
[amirlehmam/wmux](https://github.com/amirlehmam/wmux), including the Electron
terminal multiplexer, pane/workspace model, browser surface, local pipe
protocol, shell integration and the historical Git commit graph up to merge
base `68118b4021e9fd9e88d438b3c7483bb7d959091f`.

## WinAgent Terminal changes

The WinAgent history adds product identity, isolated application state,
security and architecture documentation, Windows CI/release naming, `wagent`
CLI distribution and Russian-facing documentation. The authoritative boundary
is the post-merge-base Git history, not marketing claims.

The `winget/amirlehmam.wmux*` manifests are retained upstream metadata for
wmux `0.8.6`, including its package identity and release hashes. They are not
WinAgent Terminal releases or a second current product version.

## Fully new work

Documentation and configuration created after the fork are WinAgent Terminal
work when their Git commits are post-merge-base. They remain subject to the
repository license and do not erase inherited attribution.

## Upstream security fixes

Maintainers monitor wmux security fixes, compare affected files against the
current tree, and apply compatible fixes through reviewed WinAgent pull
requests. References to historical upstream issues use full links, for example
[wmux issue #32](https://github.com/amirlehmam/wmux/issues/32).
