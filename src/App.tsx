import { FormEvent, useState } from 'react'
import { GitHubApiError } from './api/github'
import { useRepositories } from './hooks/useRepositories'
import RepositoryCard from './components/RepositoryCard'

function App() {
  const [usernameInput, setUsernameInput] = useState('')
  const { state, search, loadMore } = useRepositories()

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const username = usernameInput.trim().replace(/^@/, '')
    if (username) search(username)
  }

  const loading = state.status === 'loading' || state.status === 'loadingMore'
  return (
    <main className="page-shell">
      <section className="hero">
        <h1>Explore repositories</h1>
        <form className="search-form" onSubmit={handleSearch}>
          <label htmlFor="username">GitHub username</label>
          <div className="search-control">
            <input id="username" value={usernameInput} onChange={(event) => setUsernameInput(event.target.value)} placeholder="e.g. octocat" />
            <button type="submit" disabled={state.status === 'loading'}>Search</button>
          </div>
        </form>
      </section>
      {state.status === 'loading' ? <p className="loading-state" role="status">Loading repositories for @{state.username}…</p> : null}
      {state.status === 'error' && state.error ? <div className="state-panel" role="alert"><h2>{state.error.kind === 'not-found' ? 'User not found' : 'Could not load repositories'}</h2><p>{state.error.message}</p><button type="button" onClick={() => search(state.username)}>Try again</button></div> : null}
      {state.status === 'ready' && state.repositories.length === 0 ? <div className="state-panel" role="status"><h2>No public repositories</h2><p>@{state.username} doesn’t have any public repositories to show.</p></div> : null}
      {state.repositories.length > 0 ? (
        <>
          <h2>@{state.username} repositories</h2>
          <ul className="repository-list">{state.repositories.map((repository) => <RepositoryCard key={repository.id} repository={repository} />)}</ul>
          {state.status === 'moreError' && state.error ? <p className="inline-error" role="alert">{state.error.message}</p> : null}
          {state.nextUrl ? <button type="button" onClick={loadMore} disabled={loading}>{state.status === 'loadingMore' ? 'Loading…' : state.status === 'moreError' && state.error instanceof GitHubApiError ? 'Retry' : 'Load more'}</button> : null}
        </>
      ) : null}
    </main>
  )
}

export default App
