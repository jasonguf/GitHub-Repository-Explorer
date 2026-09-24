import type { GitHubRepository } from '../api/github'

interface RepositoryCardProps {
  repository: GitHubRepository
}

function RepositoryCard({ repository }: RepositoryCardProps) {
  const stars = repository.stargazers_count
  return (
    <li className="repository-row">
      <h3>
        <a href={repository.html_url} target="_blank" rel="noreferrer">
          {repository.name}
        </a>
      </h3>
      <p className={repository.description ? 'repo-description' : 'repo-description repo-description--empty'}>
        {repository.description || 'No description provided.'}
      </p>
      <div className="repo-details">
        <span>{repository.language || 'Language not specified'}</span>
        <span>{stars.toLocaleString()} {stars === 1 ? 'star' : 'stars'}</span>
      </div>
    </li>
  )
}

export default RepositoryCard

