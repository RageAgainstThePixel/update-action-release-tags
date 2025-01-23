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

## How to use

### workflow

```yaml
name: Update Release Tags
on:
  push:
    tags: v?[0-9].[0-9].[0-9] # Must be a valid semver tag
jobs:
  update-release-tags:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
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
