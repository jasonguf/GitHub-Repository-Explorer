# Interview Prep

Use this as a guide, not a script. Explain what the app does, why you made the choices you did, and what tradeoffs they bring. Be clear about what is implemented and what is a possible next step.

## Project overview

This is a client-side React and TypeScript app for browsing a GitHub user's public repositories. A user submits a username, sees repository details, filters the repositories loaded so far, sorts them by name or stars, and can request another page.

### 90-second walkthrough

> “The app lets you enter a GitHub username and browse their public repositories. It fetches up to 100 repositories at a time from GitHub's public REST API and uses the API's pagination links for the Load more action. You can filter the loaded repositories by name, description, or language and sort them by name or star count.
>
> I separated the API request code, repository request state, main interface, and repository row into small modules. The API module parses responses and classifies errors. A custom hook manages loading, pagination, cancellation, and stale requests. The main component owns the search form and the filter and sort controls.
>
> I kept the app client-side because public repository data doesn't need a server or a secret token. The UI distinguishes loading, empty, no-match, and error states, and uses responsive layout and accessible focus and status styles. One tradeoff is that search and sorting apply only to pages already loaded, and the interface says so.”

## How the app works

1. `src/App.tsx` handles the username form. It trims whitespace, removes a leading `@`, and starts a new search. A new search also clears the current filter.
2. `src/hooks/useRepositories.ts` sets the loading state and calls the API module. It stores the username, repositories, next-page URL, status, and any error.
3. `src/api/github.ts` requests `GET /users/{username}/repos` with `type=owner`, `per_page=100`, and GitHub's API-version header. It checks the response shape and reads the next-page URL from the `Link` header.
4. The hook returns the results to `App.tsx`. The app filters and sorts the loaded items, then renders them with `src/components/RepositoryCard.tsx`.
5. When the user selects **Load more**, the hook fetches the next URL and appends repositories that are not already present.

## Likely interview questions

### Stack and structure

**Why React instead of Vue, Svelte, or Angular, and why Vite instead of Next.js?**

> “React, Vue, and Svelte could all build this app. I chose React because its component and hook model fits the interface, but I wouldn't claim it is inherently better for this project. Angular could also work; its more complete application structure is useful in some projects, but this single-view app doesn't need it. Vite and Next.js are different kinds of tools: Vite provides the development server and static build, while Next.js is a React framework with routing and server-rendering features. Since this app doesn't need server rendering, SEO, or server endpoints, a Vite-built client app is a simpler fit. The browser calls GitHub directly, so it remains subject to the public API limits.”

**Why TypeScript instead of plain JavaScript?**

> “The repository shape and request states have several fields and cases, so TypeScript makes those expectations clearer while editing. It doesn't validate network JSON at runtime, which is why the API module also checks the response shape.”

**Why is the code split this way?**

> “The API module handles HTTP and response parsing, the hook owns repository request state, and the components handle presentation. That keeps fetch details out of the repository row and most of the UI.”

**Why no component library?**

> “The app only needs a few controls. Plain CSS keeps dependencies small and gives direct control over its spacing, colors, and responsive behavior.”

### API and data flow

**Which GitHub endpoint do you use?**

> “The public user-repositories endpoint. The username is URL-encoded, the request asks for 100 owned repositories per page, and it sends GitHub's JSON accept and API-version headers.”

**How does pagination work?**

> “GitHub returns a `Link` header with a next-page URL when another page is available. I parse that URL and use it for the Load more request. I track visited URLs so a repeated link cannot keep pagination cycling.”

**Where does each displayed value come from?**

> “The repository response provides its name, description, `language`, `stargazers_count`, and `html_url`. Description and language can be null, so the row has fallback text.”

**Does the app search or sort all of a user's repositories?**

> “Only the repositories loaded so far. Filtering is case-insensitive across name, description, and language. Sorting is in the browser: stars descending by default, with name as the tie-breaker; name sorting is A to Z. The UI shows how many are loaded and whether more are available.”

**Why fetch 100 at a time?**

> “That is the API page size used here. It reduces the number of requests for users with many repositories, while the explicit Load more button avoids fetching every page before the user asks for it.”

### State and failure cases

**What states does the app handle?**

> “The hook models idle, initial loading, ready, loading more, initial error, and pagination error. The interface separately distinguishes an account with no public repositories from a filter with no matches.”

**What happens when a request fails?**

> “The API module maps failures into types such as not found, rate limited, network, HTTP, and invalid response. The UI uses those types to show a useful message and retry where appropriate. If loading another page fails, the already-loaded repositories stay visible.”

**How do you handle rate limits?**

> “I check for rate-limit status and headers or a rate-limit message. If GitHub supplies a retry or reset time, the UI displays it. Since requests are unauthenticated, they remain subject to GitHub's public API limits.”

**What if the user changes usernames while a request is running?**

> “The hook aborts the previous request and gives each request an ID. Before applying a result, it checks that the ID is still current, so an older response cannot replace the newer search.”

**What if GitHub returns an unexpected response or a repeated page?**

> “The API module checks that the response is an array of repositories with the fields the UI uses. The hook deduplicates repositories by ID and stops when a next-page URL has already been visited.”

### UX, accessibility, and security

**What did you do for mobile and keyboard users?**

> “The content has a maximum width on desktop. On narrow screens the filter and sort controls stack. Form fields have labels, results use list semantics, status and error messages use appropriate live-region roles, and focus is visible. The CSS also respects reduced-motion settings.”

**Why is filtering local instead of making another API request?**

> “All fields needed for filtering are already in the loaded response, so local filtering is immediate and avoids extra requests. The tradeoff is that it only covers loaded pages.”

**How do you avoid exposing secrets or mishandling input?**

> “The app uses public data without a token, so there are no credentials to ship to the browser. The username is URL-encoded, and React escapes text rendered in the interface. Repository links open in a new tab with `rel="noreferrer"`.”

### Testing, performance, and tradeoffs

**What tests are in the project?**

> “There is no automated test suite in the current project. The configured production build runs the TypeScript check and Vite build, but that is not a substitute for behavior tests. I would add tests around response parsing, stale requests, pagination retries, and the distinct empty and error states.”

**Why use `useMemo`?**

> “The visible list is derived from the repositories, filter, and sort mode. `useMemo` avoids filtering and sorting again when those inputs have not changed. The implementation stays simple because the amount of data is modest for the intended use.”

**What would you improve next?**

> “I would add automated tests for the API and request-state edge cases, then revisit performance only if real use showed that loading many pages made rendering slow. I would keep the current flow and visual simplicity unless user feedback pointed to a specific need.”

### Further questions and tradeoffs

**What does “a user's repositories” mean in this app?**

> “The request uses `type=owner`, so it lists repositories owned by that account. If the product should include repositories the user contributes to, I would revisit the API query and make that scope clear in the interface.”

**Can the app show private repositories?**

> “No. It calls GitHub's public API without signing in, so it can show public repository data only. It does not request or store a token.”

**What does GitHub's `language` field represent?**

> “It is GitHub's reported primary language for the repository, not a complete breakdown of all languages used in it.”

**Can a user retry before the rate-limit reset time shown in the UI?**

> “Yes. The UI shows GitHub's retry or reset time as guidance, but it does not disable the retry action until then. A future improvement could prevent a retry before the suggested time.”

**What happens if a request hangs?**

> “The app aborts a request when a new search starts or the component unmounts, but it does not set a request timeout. I could add a timeout if a long-running request caused a stuck loading state.”

**What resets when the user searches for another username?**

> “The old results and filter are cleared, and the new search starts from the first page. The selected sort order is retained.”

**How tolerant is response validation?**

> “The API module rejects a page if its response is not an array of repositories with the expected fields. That avoids rendering unexpected data, though a more tolerant approach could skip malformed items and show the valid ones.”

**Could the pagination URL be checked more defensively?**

> “The app follows the next-page URL supplied in GitHub's `Link` header. I could also validate that its origin is GitHub's API domain before requesting it.”

**What if a user loads many pages?**

> “The app keeps and renders all loaded repositories. That keeps the implementation simple, but a very large list could eventually benefit from list virtualization. I would add that if measurement showed rendering was slow.”

**Does the app cache results or preserve the search in the URL?**

> “There is no explicit app-level cache, and the username and filter are kept in component state. Refreshing the page loses the current search, so it isn't directly shareable. I could add URL state or caching if users needed those behaviors.”

**How did you verify accessibility and mobile behavior?**

> “The implementation includes responsive breakpoints, keyboard focus styles, labeled controls, status announcements, and reduced-motion support. I would describe the specific manual checks I actually performed; these code choices are not the same as a formal accessibility audit.”

**Would you keep `useMemo`?**

> “It avoids repeating filtering and sorting when their inputs have not changed. The list is modest at first, so it may not be essential; I would measure before adding heavier performance optimizations.”

**Why use both `AbortController` and a request ID?**

> “Aborting can stop work for an old request. The request ID is a separate guard: if an old request still completes, the hook ignores its result instead of replacing newer results.”

**How do you prevent duplicate Load more requests?**

> “The hook sets a ref before starting the request and checks it before accepting another one. That blocks a rapid second click before React has time to render the disabled button.”

**Does React `StrictMode` cause duplicate API calls?**

> “No. Repository searches start from the form submit handler rather than an effect that fetches on mount. `StrictMode` does not automatically submit thI think they might ask this, but I don't know. Maybe I'm just like projectinge form or start another search.”

**Why validate the API response at runtime when the app uses TypeScript?**

> “TypeScript checks the code we write, but it cannot guarantee the shape of JSON received over the network. The runtime check verifies the fields the UI expects before using that data.”

**Why pin the GitHub API version?**

> “It makes the API version expected by the app explicit. If I update it, I would review the response handling against that version.”

**What happens if the `Link` header has no usable next-page URL?**

> “The parser returns no next URL, so the app stops offering Load more. It does not guess a page URL.”

**How much username validation happens before making the request?**

> “The app trims whitespace, removes a leading `@`, and shows an error for an empty value. It URL-encodes the username and lets GitHub report an invalid or unknown one.”

**Why use a status string and nullable error instead of a reducer or discriminated union?**

> “The current model is small and keeps the request handling straightforward. A reducer or discriminated union could make invalid combinations harder to represent if the state machine grows.”

**Why no Redux or Context?**

> “Repository request state is used by the main screen, so the custom hook can own it without a global state library. I would add shared state infrastructure if the app grew to have multiple screens that needed it.”

**Why no router?**

> “The app has one view, so a router would add structure without solving a current navigation need. Search state could be reflected in the URL later if shareable searches became important.”

**Why no debounce?**

> “Typing only updates the input. The GitHub request starts when the user submits the form, so the app does not send a request on every keystroke.”

**What quality checks are configured?**

> “The build script runs the TypeScript check and Vite production build. There is no automated test suite, lint script, or CI workflow in the current project.”

**How would you host the app?**

> “Vite creates a static production build that can be hosted on a static site service. The current project includes build and preview commands, but no live hosting setup. The public source repository requirement is separate from deploying a live site.”

### Project reflection

**How does the project meet the prompt?**

> “It lets someone submit a GitHub username, fetches that user's public repositories from GitHub, and displays the name, description, primary language, star count, and repository link. It also supports sorting and filtering, has loading, empty, no-match, and error states, and uses a responsive layout.”

**Why did you choose this visual direction?**

> “I wanted the repository information to be the focus, so I kept the page restrained and used a simple list that is easy to scan. GitHub-inspired colors and the locally included Mona Sans font give it a familiar feel without adding a component library or extra decoration.”

**What was a technical challenge you can explain in depth?**

> “One area that needed care was asynchronous searches and pagination. A new search aborts the previous request, and a request ID prevents an older response from replacing newer results. Pagination also tracks visited URLs and avoids appending duplicate repositories.”

**How did you use AI or other resources?**

> “AI tools and public documentation were allowed for this project. I would describe exactly where I used them and which decisions I made or verified myself. I should be able to trace the request flow, explain the tradeoffs, and be honest about anything I have not independently checked.”

## Demo sequence

1. Search for a known GitHub username and point out the loading state.
2. Show the repository name, description, language, star count, and repository link.
3. Filter by a word and switch between name and star sorting.
4. Load another page and note that filtering and sorting cover loaded repositories.
5. Explain how an empty account, no-match search, missing user, network failure, and rate limit are represented. Do not claim a failure was live-tested unless you actually tested it.

## Source map

- `src/main.tsx`: React entry point.
- `src/App.tsx`: search form, UI states, filtering, sorting, and results layout.
- `src/hooks/useRepositories.ts`: request lifecycle, cancellation, pagination, and repository state.
- `src/api/github.ts`: GitHub URL, request headers, response parsing, and typed API errors.
- `src/components/RepositoryCard.tsx`: one repository row.
- `src/styles.css`: colors, typography, focus styles, responsive layout, and reduced motion.
- `README.md`: setup commands and project notes.

## Before the interview

- Trace one search through `App.tsx`, `useRepositories.ts`, and `github.ts`, then explain how the result reaches a repository row.
- Be ready to explain the loaded-pages limitation and the unauthenticated API limit.
- Distinguish a production build from automated tests, and describe only checks you actually performed.
- If asked whether it is deployed, distinguish a live website from the public source repository. The submission asks for a public GitHub repository, so confirm that the repository is accessible before sharing it.
