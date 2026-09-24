import { useState } from 'react'

function App() {
  const [username, setUsername] = useState('')

  return (
    <main className="page-shell">
      <section className="hero">
        <h1>Explore repositories</h1>
        <form className="search-form" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="username">GitHub username</label>
          <div className="search-control">
            <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="e.g. octocat" />
            <button type="submit">Search</button>
          </div>
        </form>
      </section>
    </main>
  )
}

export default App
