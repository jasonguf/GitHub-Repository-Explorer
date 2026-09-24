import { FormEvent, useMemo, useState } from 'react'
import { GitHubApiError, type GitHubRepository } from './api/github'
import { useRepositories } from './hooks/useRepositories'
import RepositoryCard from './components/RepositoryCard'

type SortMode = 'stars' | 'name'

function sortRepositories(repositories: GitHubRepository[], mode: SortMode): GitHubRepository[] {
  return [...repositories].sort((first, second) => {
    if (mode === 'stars' && first.stargazers_count !== second.stargazers_count) {
      return second.stargazers_count - first.stargazers_count
    }
    return first.name.localeCompare(second.name, undefined, { sensitivity: 'base' })
  })
}

function errorTitle(error: GitHubApiError): string {
  switch (error.kind) {
    case 'not-found': return 'User not found'
    case 'rate-limit': return 'GitHub rate limit reached'
    case 'network': return 'Connection problem'
    default: return 'Could not load repositories'
  }
}

function App() {
  const [usernameInput, setUsernameInput] = useState('')
  const [filter, setFilter] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('stars')
  const [formError, setFormError] = useState('')
  const { state, search, loadMore } = useRepositories()

  const visibleRepositories = useMemo(() => {
    const needle = filter.trim().toLocaleLowerCase()
    const matching = state.repositories.filter((repository) => {
      if (!needle) return true
      return [repository.name, repository.description ?? '', repository.language ?? '']
        .some((value) => value.toLocaleLowerCase().includes(needle))
    })
    return sortRepositories(matching, sortMode)
  }, [filter, sortMode, state.repositories])

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const username = usernameInput.trim().replace(/^@/, '')
    if (!username) {
      setFormError('Enter a GitHub username.')
      return
    }

    setFormError('')
    setFilter('')
    search(username)
  }

  const isLoading = state.status === 'loading'
  const isLoadingMore = state.status === 'loadingMore'
  const hasMoreError = state.status === 'moreError'
  const hasResultsArea = state.status !== 'idle'
  const hasActiveFilter = Boolean(filter.trim())

  return (
    <main className="page-shell">
      <section className={hasResultsArea ? 'hero hero--compact' : 'hero'} id="top" aria-labelledby="page-title">
        <h1 id="page-title">Explore repositories</h1>
        <form className="search-form" onSubmit={handleSearch} noValidate>
          <label htmlFor="username">GitHub username</label>
          <div className="search-control">
            <input
              id="username"
              name="username"
              placeholder="e.g. octocat"
              autoComplete="off"
              spellCheck={false}
              value={usernameInput}
              onChange={(event) => {
                setUsernameInput(event.target.value)
                if (formError) setFormError('')
              }}
              aria-invalid={Boolean(formError)}
              aria-describedby={formError ? 'form-error' : undefined}
            />
            <button type="submit">Search</button>
          </div>
          {formError ? <p className="form-error" id="form-error" role="alert">{formError}</p> : null}
        </form>
      </section>

      {hasResultsArea ? (
        <section className="results-section" aria-label="Repository results" aria-busy={isLoading || isLoadingMore}>
          {isLoading ? <LoadingState username={state.username} /> : null}

          {state.status === 'error' && state.error ? (
            <div className="state-panel state-panel--error" role="alert">
              <div className="state-copy">
                <h2>{errorTitle(state.error)}</h2>
                <p>{state.error.message}</p>
                {state.error.kind === 'rate-limit' ? (
                  <p className="retry-time">
                    {state.error.retryAt
                      ? `Try again after ${new Date(state.error.retryAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`
                      : 'Wait a few minutes before trying again.'}
                  </p>
                ) : null}
              </div>
              {state.error.kind !== 'not-found' ? (
                <button className="secondary-button" type="button" onClick={() => search(state.username)}>
                  {state.error.kind === 'rate-limit' ? 'Retry when ready' : 'Try again'}
                </button>
              ) : null}
            </div>
          ) : null}

          {state.status === 'ready' && state.repositories.length === 0 ? (
            <div className="state-panel" role="status">
              <div className="state-copy">
                <h2>No public repositories</h2>
                <p>@{state.username} doesn’t have any public repositories to show.</p>
              </div>
            </div>
          ) : null}

          {state.repositories.length > 0 && state.status !== 'error' ? (
            <>
              <div className="results-heading">
                <h2><span className="owner-name">@{state.username}</span> repositories</h2>
                <p className="results-count">
                  {hasActiveFilter ? (
                    <>
                      {visibleRepositories.length.toLocaleString()} {visibleRepositories.length === 1 ? 'match' : 'matches'}
                      {' · '}
                      {state.repositories.length.toLocaleString()} loaded
                    </>
                  ) : (
                    <>
                      {state.repositories.length.toLocaleString()} {state.repositories.length === 1 ? 'repository' : 'repositories'} loaded
                    </>
                  )}
                  {state.nextUrl ? <span> · more available</span> : null}
                </p>
              </div>

              <div className="toolbar">
                <label className="filter-control" htmlFor="repo-filter">
                  <span className="visually-hidden">Filter loaded repositories</span>
                  <input
                    id="repo-filter"
                    type="search"
                    placeholder="Filter loaded repositories"
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                  />
                </label>
                <label className="sort-control" htmlFor="sort-mode">
                  <span>Sort by</span>
                  <select id="sort-mode" value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
                    <option value="stars">Most stars</option>
                    <option value="name">Name, A–Z</option>
                  </select>
                </label>
              </div>

              {visibleRepositories.length > 0 ? (
                <ul className="repository-list" aria-label="Loaded repositories">
                  {visibleRepositories.map((repository) => (
                    <RepositoryCard key={repository.id} repository={repository} />
                  ))}
                </ul>
              ) : (
                <div className="state-panel state-panel--empty-search" role="status">
                  <div className="state-copy">
                    <h2>No matching repositories</h2>
                    <p>{state.nextUrl ? 'Try another search or load the next page.' : 'Try a different search term.'}</p>
                  </div>
                </div>
              )}

              {hasMoreError && state.error ? (
                <div className="inline-error" role="alert">
                  <span>{state.error.message}</span>
                  {state.error.kind === 'rate-limit' && state.error.retryAt ? (
                    <span> Try again after {new Date(state.error.retryAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.</span>
                  ) : null}
                  {state.error.kind === 'rate-limit' && !state.error.retryAt ? (
                    <span> Wait a few minutes before retrying.</span>
                  ) : null}
                </div>
              ) : null}

              {state.nextUrl ? (
                <div className="load-more-wrap">
                  <button className="load-more-button" type="button" onClick={loadMore} disabled={isLoadingMore}>
                    {isLoadingMore ? <span className="spinner" aria-hidden="true" /> : null}
                    {isLoadingMore
                      ? 'Loading…'
                      : hasMoreError && state.error?.kind === 'rate-limit'
                        ? 'Retry when ready'
                        : hasMoreError ? 'Retry' : 'Load more'}
                  </button>
                  <p>Search and sorting apply to loaded repositories only.</p>
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      ) : null}
    </main>
  )
}

function LoadingState({ username }: { username: string }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>Loading repositories for <strong>@{username}</strong>…</p>
    </div>
  )
}

export default App

