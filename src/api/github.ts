export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  language: string | null
  stargazers_count: number
}

export interface RepositoryPage {
  repositories: GitHubRepository[]
  nextUrl: string | null
}

export type GitHubErrorKind = 'not-found' | 'rate-limit' | 'http' | 'network' | 'invalid-response'

export class GitHubApiError extends Error {
  readonly kind: GitHubErrorKind
  readonly status?: number
  readonly retryAt?: number

  constructor(message: string, kind: GitHubErrorKind, options: { status?: number; retryAt?: number } = {}) {
    super(message)
    this.name = 'GitHubApiError'
    this.kind = kind
    this.status = options.status
    this.retryAt = options.retryAt
  }
}

function isRepository(value: unknown): value is GitHubRepository {
  if (!value || typeof value !== 'object') return false

  const repository = value as Partial<GitHubRepository>
  return typeof repository.id === 'number'
    && typeof repository.name === 'string'
    && typeof repository.full_name === 'string'
    && typeof repository.html_url === 'string'
    && (typeof repository.description === 'string' || repository.description === null)
    && (typeof repository.language === 'string' || repository.language === null)
    && typeof repository.stargazers_count === 'number'
}

const API_ROOT = 'https://api.github.com'
const API_VERSION = '2026-03-10'

export function repositoryListUrl(username: string): string {
  return `${API_ROOT}/users/${encodeURIComponent(username)}/repos?type=owner&per_page=100&sort=full_name&direction=asc`
}

function findNextUrl(linkHeader: string | null): string | null {
  if (!linkHeader) return null

  const entries = linkHeader.split(/,\s*(?=<)/)
  const nextEntry = entries.find((entry) => /\brel="?next"?/.test(entry))
  return nextEntry?.match(/<([^>]+)>/)?.[1] ?? null
}

function rateLimitRetryAt(headers: Headers): number | undefined {
  const retryAfter = Number(headers.get('retry-after'))
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Date.now() + retryAfter * 1000

  const resetAt = Number(headers.get('x-ratelimit-reset'))
  if (Number.isFinite(resetAt) && resetAt > 0) return resetAt * 1000
  return undefined
}

export async function fetchRepositoryPage(url: string, signal: AbortSignal): Promise<RepositoryPage> {
  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': API_VERSION,
      },
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new GitHubApiError('Could not reach GitHub. Check your connection and try again.', 'network')
  }

  if (!response.ok) {
    const remaining = response.headers.get('x-ratelimit-remaining')
    let apiMessage = ''
    try {
      const body = (await response.json()) as { message?: string }
      apiMessage = body.message ?? ''
    } catch {
      // The status code still gives us enough information to present a useful error.
    }

    const isRateLimited = response.status === 429 || remaining === '0' || /rate limit/i.test(apiMessage)
    if (isRateLimited) {
      throw new GitHubApiError('GitHub is temporarily limiting requests from this network.', 'rate-limit', {
        status: response.status,
        retryAt: rateLimitRetryAt(response.headers),
      })
    }
    if (response.status === 404) {
      throw new GitHubApiError('No GitHub account was found with that username.', 'not-found', { status: 404 })
    }
    throw new GitHubApiError('GitHub could not return repositories for that account. Please try again.', 'http', {
      status: response.status,
    })
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new GitHubApiError('GitHub returned an unreadable response. Please try again.', 'invalid-response')
  }

  if (!Array.isArray(payload) || !payload.every(isRepository)) {
    throw new GitHubApiError('GitHub returned an unexpected response. Please try again.', 'invalid-response')
  }

  return {
    repositories: payload,
    nextUrl: findNextUrl(response.headers.get('Link')),
  }
}
