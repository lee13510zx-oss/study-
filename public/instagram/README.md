# Instagram test media

The default workflow creates a neutral `instagram/test-card.jpg` during the GitHub Pages build. To use another image, add a JPEG below `public/` and provide its relative path through the workflow input. The deployment makes that path publicly reachable before the Instagram workflow runs.

The workflow accepts only `@codex.publisher.test`. It always performs an Instagram Graph API account check in `--dry-run` mode before it can create a media container or call `media_publish`.
