const EXPECTED_USERNAME = 'codex.publisher.test'
const GRAPH_API_BASE_URL = 'https://graph.facebook.com/v23.0'

function readRequiredEnvironment(environment, name) {
  const value = environment[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function assertPublicImageUrl(imageUrl) {
  let parsed
  try {
    parsed = new URL(imageUrl)
  } catch {
    throw new Error('imageUrl must be an absolute HTTPS URL')
  }

  if (parsed.protocol !== 'https:' || !parsed.hostname) {
    throw new Error('imageUrl must be an absolute HTTPS URL')
  }
}

async function graphRequest({ fetchImpl, url, accessToken, body }) {
  const response = await fetchImpl(url, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body,
  })

  if (!response.ok) throw new Error(`Instagram Graph API request failed (HTTP ${response.status})`)
  return response.json()
}

export async function publishInstagramImage({
  dryRun,
  imageUrl,
  environment = process.env,
  fetchImpl = fetch,
  graphApiBaseUrl = GRAPH_API_BASE_URL,
}) {
  assertPublicImageUrl(imageUrl)
  const accessToken = readRequiredEnvironment(environment, 'INSTAGRAM_ACCESS_TOKEN')
  const instagramUserId = readRequiredEnvironment(environment, 'INSTAGRAM_USER_ID')
  const accountUrl = new URL(`${graphApiBaseUrl}/${encodeURIComponent(instagramUserId)}`)
  accountUrl.searchParams.set('fields', 'username')

  const account = await graphRequest({ fetchImpl, url: accountUrl, accessToken })
  if (account.username !== EXPECTED_USERNAME) {
    throw new Error(`Refusing to publish: expected Instagram account ${EXPECTED_USERNAME}`)
  }

  if (dryRun) return { status: 'dry-run', username: account.username }

  const container = await graphRequest({
    fetchImpl,
    url: `${graphApiBaseUrl}/${encodeURIComponent(instagramUserId)}/media`,
    accessToken,
    body: new URLSearchParams({ image_url: imageUrl }).toString(),
  })
  if (!container.id) throw new Error('Instagram Graph API did not return a media container ID')

  const published = await graphRequest({
    fetchImpl,
    url: `${graphApiBaseUrl}/${encodeURIComponent(instagramUserId)}/media_publish`,
    accessToken,
    body: new URLSearchParams({ creation_id: container.id }).toString(),
  })
  if (!published.id) throw new Error('Instagram Graph API did not return a published media ID')

  return { status: 'published', mediaId: published.id, username: account.username }
}

export function parseArguments(argumentsList) {
  const flags = new Set(argumentsList)
  const publish = flags.has('--publish')
  const confirmedDryRun = flags.has('--confirmed-dry-run')
  const imageUrlIndex = argumentsList.indexOf('--image-url')
  const imageUrl = imageUrlIndex >= 0 ? argumentsList[imageUrlIndex + 1] : undefined

  if (!imageUrl || imageUrl.startsWith('--')) {
    throw new Error('Usage: node scripts/publish-instagram.mjs --image-url <https-url> [--dry-run | --publish --confirmed-dry-run]')
  }
  if (publish && !confirmedDryRun) {
    throw new Error('Refusing to publish without --confirmed-dry-run')
  }
  if (publish && flags.has('--dry-run')) {
    throw new Error('Choose either --dry-run or --publish')
  }

  return { dryRun: !publish, imageUrl }
}

async function main() {
  const result = await publishInstagramImage(parseArguments(process.argv.slice(2)))
  console.log(`Instagram ${result.status} completed for @${result.username}${result.mediaId ? ` (media ID: ${result.mediaId})` : ''}`)
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
