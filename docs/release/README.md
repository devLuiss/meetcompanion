# Release Process

This document describes the release process for Stupid LeetCode Club.

## Versioning

We follow [Semantic Versioning](https://semver.org/) (SemVer) for our releases:

- **MAJOR** version (`X.0.0`): Incremented for incompatible API changes or significant UI/UX changes
- **MINOR** version (`0.X.0`): Incremented for new features in a backward-compatible manner
- **PATCH** version (`0.0.X`): Incremented for backward-compatible bug fixes

## Release Process

1. **Update version number**:
   - Update the version in `package.json`
   - Commit the change with a message like "Bump version to X.Y.Z"

   ```bash
   # Update version in package.json (example for patch update)
   npm version patch
   
   # For minor or major versions
   npm version minor
   # or
   npm version major
   ```

2. **Create a GitHub Release**:
   - Go to the [Releases page](https://github.com/your-username/stupid-leetcode-club/releases) on GitHub
   - Click "Draft a new release"
   - Set the tag to `vX.Y.Z` matching your version number (e.g., `v1.2.3`)
   - Set the release title to `vX.Y.Z`
   - Add release notes describing the changes
   - Publish the release

3. **Automated Build Process**:
   - Once you publish a release, GitHub Actions will automatically:
     - Build the application for macOS, Windows, and Linux
     - Attach the built installers to the GitHub release
   - The build progress can be monitored in the "Actions" tab of the repository

## Build Artifacts

For each release, the following artifacts are generated:

- **macOS**: `.dmg` installer
- **Windows**: `.exe` installer
- **Linux**: `.AppImage` and `.deb` packages

## Hotfixes

For critical bugs:

1. Create a hotfix branch from the latest release tag
2. Fix the issue
3. Update the patch version
4. Create a new release following the process above

## Release Candidates

For major releases, you may want to create release candidates:

1. Update version to `X.Y.Z-rc.1` in package.json
2. Create a GitHub Release with the pre-release flag checked
3. Test the release candidate
4. If issues are found, fix them and create `X.Y.Z-rc.2`, etc.
5. Once stable, create the final release `X.Y.Z`