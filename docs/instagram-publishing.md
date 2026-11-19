# Instagram test publishing

The `Publish Instagram test post` workflow deploys the current Vite build to GitHub Pages and then uses the deployed image URL with the Instagram Graph API.

## One-time repository configuration

Create these GitHub Actions secrets with values supplied by the owner of the connected Meta app:

- `INSTAGRAM_ACCESS_TOKEN`: a valid Instagram Graph API token with the required publishing permissions.
- `INSTAGRAM_USER_ID`: the Instagram Graph API ID for `@codex.publisher.test`.

Do not store either value in source control or workflow logs. The script never writes either secret to output.

## Runbook

1. Use the included default test card, or add a JPEG below `public/` and enter its relative path in the workflow.
2. Run **Publish Instagram test post** with `publish` left disabled. This deploys GitHub Pages and validates that the configured Graph account is exactly `@codex.publisher.test`, without creating a media container.
3. After that successful dry run, rerun it with `publish` enabled. The workflow performs another dry run, then creates `/media` and calls `/media_publish`.

The script refuses a different username even if its user ID and token are valid. Locally, publication additionally requires `--publish --confirmed-dry-run`; its default behavior is a dry run.
