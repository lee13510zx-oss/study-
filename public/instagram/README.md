# Instagram test media

Add the JPEG image to be posted at `public/instagram/post.jpg` (or provide another relative path through the workflow input). The GitHub Pages deployment makes this path publicly reachable before the Instagram workflow runs.

The workflow accepts only `@codex.publisher.test`. It always performs an Instagram Graph API account check in `--dry-run` mode before it can create a media container or call `media_publish`.
