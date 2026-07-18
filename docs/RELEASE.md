# Release procedure

1. Run `npm.cmd run lint`, `npm.cmd test` and `npm.cmd run build` on Windows.
2. Review `CHANGELOG.md` and keep the working tree clean.
3. Create and push a signed version tag only after the artifacts were checked.
4. GitHub Actions builds the NSIS installer and portable ZIP, produces checksums
   through the updater metadata, and uploads release artifacts.

Publishing a release is intentional external state. Unsigned or untrusted
installers may be offered for manual download but are not advertised to the
auto-updater.
