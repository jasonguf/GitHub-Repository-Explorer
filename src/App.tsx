import { FormEvent, useState } from 'react'
import { fetchRepositoryPage, repositoryListUrl, type GitHubRepository } from './api/github'
import RepositoryCard from './components/RepositoryCard'

function App() {
  const [usernameInput, setUsernameInput] = useState('')
  const [username, setUsername] = useState('')
  const [repositories, setRepositories] = useState<GitHubRepository[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextUsername = usernameInput.trim().replace(/^@/, '')
    if (!nextUsername) return
    setUsername(nextUsername)
    setStatus('loading')
    setError('')
    setRepositories([])
    try {
      const page = await fetchRepositoryPage(repositoryListUrl(nextUsername), new AbortController().signal)
      setRepositories(page.repositories)
      setStatus('ready')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load repositories.')
      setStatus('error')
    }
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <h1>Explore repositories</h1>
        <form className="search-form" onSubmit={handleSearch}>
          <label htmlFor="username">GitHub username</label>
          <div className="search-control">
            <input id="username" value={usernameInput} onChange={(event) => setUsernameInput(event.target.value)} placeholder="e.g. octocat" />
            <button type="submit" disabled={status === 'loading'}>Search</button>
          </div>
        </form>
      </section>
      {status === 'loading' ? <p role="status">Loading repositories for @{username}…</p> : null}
      {status === 'error' ? <p role="alert">{error}</p> : null}
      {status === 'ready' && repositories.length === 0 ? <p role="status">No public repositories for @{username}.</p> : null}
      {repositories.length > 0 ? <ul className="repository-list">{repositories.map((repository) => <RepositoryCard key={repository.id} repository={repository} />)}</ul> : null}
    </main>
  )
}

export default App
