import assert from 'node:assert/strict'
import test from 'node:test'

import { parseArguments, publishInstagramImage } from '../scripts/publish-instagram.mjs'

const environment = {
  INSTAGRAM_ACCESS_TOKEN: 'test-token',
  INSTAGRAM_USER_ID: '123456789',
}

test('requires an explicit dry-run confirmation before allowing a publish command', () => {
  assert.throws(
    () => parseArguments(['--publish', '--image-url', 'https://example.github.io/study-/instagram/post.jpg']),
    /confirmed-dry-run/,
  )
  assert.deepEqual(
    parseArguments(['--publish', '--confirmed-dry-run', '--image-url', 'https://example.github.io/study-/instagram/post.jpg']),
    { dryRun: false, imageUrl: 'https://example.github.io/study-/instagram/post.jpg' },
  )
})

test('dry run verifies the configured account without creating a media container', async () => {
  const requests = []
  const fetchImpl = async (url) => {
    requests.push(url.toString())
    return Response.json({ username: 'codex.publisher.test' })
  }

  const result = await publishInstagramImage({
    dryRun: true,
    imageUrl: 'https://example.github.io/study-/instagram/post.jpg',
    environment,
    fetchImpl,
  })

  assert.deepEqual(result, { status: 'dry-run', username: 'codex.publisher.test' })
  assert.equal(requests.length, 1)
  assert.match(requests[0], /123456789\?fields=username/)
})

test('refuses to publish when the configured Instagram account is not the test account', async () => {
  const fetchImpl = async () => Response.json({ username: 'another.account' })

  await assert.rejects(
    publishInstagramImage({
      dryRun: false,
      imageUrl: 'https://example.github.io/study-/instagram/post.jpg',
      environment,
      fetchImpl,
    }),
    /codex\.publisher\.test/,
  )
})

test('publishes only after account verification completes', async () => {
  const requests = []
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url: url.toString(), method: options.method ?? 'GET', body: options.body })
    if (requests.length === 1) return Response.json({ username: 'codex.publisher.test' })
    if (requests.length === 2) return Response.json({ id: 'container-1' })
    return Response.json({ id: 'media-1' })
  }

  const result = await publishInstagramImage({
    dryRun: false,
    imageUrl: 'https://example.github.io/study-/instagram/post.jpg',
    environment,
    fetchImpl,
  })

  assert.deepEqual(result, { status: 'published', mediaId: 'media-1', username: 'codex.publisher.test' })
  assert.equal(requests.length, 3)
  assert.match(requests[1].url, /123456789\/media$/)
  assert.match(requests[1].body, /image_url=https%3A%2F%2Fexample.github.io%2Fstudy-%2Finstagram%2Fpost.jpg/)
  assert.match(requests[2].url, /123456789\/media_publish$/)
  assert.match(requests[2].body, /creation_id=container-1/)
})
