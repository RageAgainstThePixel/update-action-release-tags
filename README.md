# update-action-release-tags

A GitHub Action to update pinned action release versions.

When a new release is created, this action will update the pinned major and minor version tags to point to the new release.
This is useful for workflows that use the major and minor version tags to pin to a specific release stream.
This is also the same behavior that GitHub uses for its own actions.

For example the following will match to the same release:

```yaml
- uses: {owner}/{action}@v1
- uses: {owner}/{action}@v1.1
- uses: {owner}/{action}@v1.1.1
```

The action must run on a tag push (`refs/tags/*`). It reads the highest semver tag (`vX.Y.Z` or `X.Y.Z`), then creates or force pushes the matching `vX` and `vX.Y` tags. The minor tag is skipped when the minor version is `0` (e.g. `v2.0.1` only updates `v2`).

## How to use

### workflow

```yaml
name: Update Release Tags
on:
  push:
    tags: ['*']
jobs:
  update-release-tags:
    runs-on: ubuntu-slim
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0 # Required to fetch all tags
      - uses: RageAgainstThePixel/update-action-release-tags@v1
        with:
          update-major: true
          update-minor: true
```

### inputs

| name | description | default |
| ---- | ----------- | -------- |
| `update-major` | Update the major version tag | true |
| `update-minor` | Update the minor version tag | true |
