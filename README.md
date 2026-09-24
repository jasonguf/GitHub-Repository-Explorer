# GitHub Repository Explorer

A small, responsive explorer for public GitHub repositories. Enter a username to browse repository descriptions, languages, and stars, then filter or sort the repositories already loaded.

## Run locally

Requirements: Node.js 20 or newer and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. To create and preview a production build:

```sh
npm run build
npm run preview
```

## How it works

- `src/api/github.ts` calls GitHub's public `GET /users/{username}/repos` endpoint directly. No sign-in or token is needed for public repositories.
- The first request asks for 100 repositories. **Load more repositories** follows GitHub's `Link` header on demand, so large accounts do not require downloading every page up front.
- Sorting and filtering are local and cover only the repositories loaded so far; the result count and helper text make that scope visible.
- `src/hooks/useRepositories.ts` owns request state, cancels stale requests, avoids duplicate repositories across pages, and preserves current results if loading another page fails.
- The interface distinguishes loading, empty account, no filter matches, not-found, network, rate-limit, and other API errors. Retry actions are available where useful, and missing optional fields have readable fallbacks.
- Pagination tracks visited page URLs as well as repository IDs so repeated API links cannot leave an endless **Load more** action.

## Design notes

The UI uses plain CSS and GitHub Primer product color roles: neutral surfaces, blue links and focus states, and green primary actions. It bundles GitHub's variable Mona Sans font locally under the SIL Open Font License; see `public/fonts/OFL.txt`. [UI Skills](https://www.ui-skills.com/playbook/use-large-touch-targets) informed 44px controls and readable data; [shadcn/ui](https://ui.shadcn.com) and [COSS UI](https://coss.com/ui) informed field labels and empty states; the [Design System Checklist](https://designsystemchecklist.com) informed contrast and responsive consistency; and [Emil Kowalski's motion guide](https://emilkowal.ski/ui/you-dont-need-animations) informed the restrained motion. Focus states and reduced-motion preferences are supported without adding a component library.

The API is unauthenticated and subject to GitHub's public rate limits. If requests are limited, the interface shows the reset time when GitHub provides one, or advises waiting a few minutes when it does not. Repository data can change between pages because the API is live; the app deduplicates IDs as pages arrive.

## API reference

[GitHub REST API: List repositories for a user](https://docs.github.com/en/rest/repos/repos?apiVersion=2026-03-10#list-repositories-for-a-user)

