import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchRepositoryPage,
  GitHubApiError,
  repositoryListUrl,
  type GitHubRepository,
} from '../api/github'

export type RepositoryStatus = 'idle' | 'loading' | 'ready' | 'loadingMore' | 'error' | 'moreError'

export interface RepositoryState {
  status: RepositoryStatus
  username: string
  repositories: GitHubRepository[]
  nextUrl: string | null
  error: GitHubApiError | null
}

const initialState: RepositoryState = {
  status: 'idle',
  username: '',
  repositories: [],
  nextUrl: null,
  error: null,
}

function normalizeUsername(value: string): string {
  return value.trim().replace(/^@/, '')
}

function appendUnique(current: GitHubRepository[], incoming: GitHubRepository[]): GitHubRepository[] {
  const seen = new Set(current.map((repository) => repository.id))
  const appended = incoming.filter((repository) => {
    if (seen.has(repository.id)) return false
    seen.add(repository.id)
    return true
  })
  return [...current, ...appended]
}

function claimNextUrl(visitedUrls: Set<string>, nextUrl: string | null): string | null {
  if (!nextUrl || visitedUrls.has(nextUrl)) return null
  visitedUrls.add(nextUrl)
  return nextUrl
}

export function useRepositories() {
  const [state, setState] = useState<RepositoryState>(initialState)
  const controllerRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)
  const loadingRef = useRef(false)
  const visitedUrlsRef = useRef<Set<string>>(new Set())

  const search = useCallback(async (rawUsername: string) => {
    const username = normalizeUsername(rawUsername)
    if (!username) return

    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    const requestId = ++requestIdRef.current
    const firstUrl = repositoryListUrl(username)
    visitedUrlsRef.current = new Set([firstUrl])
    loadingRef.current = true
    setState({ status: 'loading', username, repositories: [], nextUrl: null, error: null })

    try {
      const page = await fetchRepositoryPage(firstUrl, controller.signal)
      if (requestId !== requestIdRef.current) return
      setState({
        status: 'ready',
        username,
        repositories: page.repositories,
        nextUrl: claimNextUrl(visitedUrlsRef.current, page.nextUrl),
        error: null,
      })
    } catch (error) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return
      setState({
        status: 'error',
        username,
        repositories: [],
        nextUrl: null,
        error: error instanceof GitHubApiError
          ? error
          : new GitHubApiError('Something went wrong. Please try again.', 'http'),
      })
    } finally {
      if (requestId === requestIdRef.current) loadingRef.current = false
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !state.nextUrl) return

    const nextUrl = state.nextUrl
    const currentController = new AbortController()
    controllerRef.current = currentController
    const requestId = ++requestIdRef.current
    const currentState = state
    loadingRef.current = true
    setState({ ...currentState, status: 'loadingMore', error: null })

    try {
      const page = await fetchRepositoryPage(nextUrl, currentController.signal)
      if (requestId !== requestIdRef.current) return
      const nextPageUrl = claimNextUrl(visitedUrlsRef.current, page.nextUrl)
      setState((latest) => ({
        ...latest,
        status: 'ready',
        repositories: appendUnique(latest.repositories, page.repositories),
        nextUrl: nextPageUrl,
        error: null,
      }))
    } catch (error) {
      if (currentController.signal.aborted || requestId !== requestIdRef.current) return
      setState((latest) => ({
        ...latest,
        status: 'moreError',
        error: error instanceof GitHubApiError
          ? error
          : new GitHubApiError('Could not load the next page. Please try again.', 'http'),
      }))
    } finally {
      if (requestId === requestIdRef.current) loadingRef.current = false
    }
  }, [state])

  useEffect(() => () => controllerRef.current?.abort(), [])

  return { state, search, loadMore }
}
