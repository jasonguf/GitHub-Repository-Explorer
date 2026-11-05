# GitHub Repository Explorer

Enter a GitHub username to browse their public repositories. You can search the loaded repositories or sort them by name or stars.

## Run the app

You need Node.js 20 or newer and npm.

```sh
npm install
npm run dev
```

To make and preview a production build:

```sh
npm run build
npm run preview
```

## Notes

- Built with React, TypeScript, Vite, and plain CSS.
- Uses GitHub's public API. No sign-in or token is needed.
- Loads up to 100 repositories at a time. Choose **Load more** to get the next page.
- Search and sorting apply to repositories loaded so far.
- Shows loading, empty, no-match, and error messages.
- Uses GitHub-inspired colors and the Mona Sans font. The font license is in `public/fonts/OFL.txt`.
- Supports keyboard focus, reduced motion, and small screens.

## API

[GitHub REST API: list repositories for a user](https://docs.github.com/en/rest/repos/repos?apiVersion=2026-03-10#list-repositories-for-a-user)
