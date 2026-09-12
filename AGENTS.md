# Repository Guidelines

## Project Structure & Module Organization

This repository is a React component library packaged with Vite. Library source lives in `src/lib`, with board behavior grouped under `src/lib/board`, messaging under `src/lib/message`, and user/session helpers under `src/lib/users`. The package entry point is `src/main.tsx`. Interactive example/demo code is in `src/example`, including sample board items, forms, UI components, and SVG assets. Build configuration is in `vite.config.ts`; TypeScript settings are in `tsconfig*.json`.

## Build, Test, and Development Commands

Run `npm ci` to install the lockfile-defined dependencies. Use:

- `npm run dev` — start the Vite development server.
- `npm run build` — type-check with `tsc` and create the distributable package in `dist`.
- `npm run build:website` — build the website/demo variant.
- `npm run watch` — rebuild continuously while editing.
- `npm run preview` — serve the production build locally.
- `npm run lint` — lint files under `src` with ESLint.

The collaboration features require a running `wire.io` server; start one with `npx wire.io` when exercising synchronization locally.

## Coding Style & Naming Conventions

Use two-space indentation and follow the repository’s Prettier configuration (`.prettierrc`) and ESLint rules (`.eslintrc.cjs`). Use TypeScript for application/library entry points, JSX for React components, PascalCase for component files and component names (for example, `Board.jsx`), and camelCase for hooks, helpers, and variables (for example, `useBoardState.js`). Keep board-specific code within `src/lib/board` and avoid unrelated formatting changes.

## Testing Guidelines

No automated test framework or `npm test` script is currently configured. Before submitting changes, run `npm run lint` and `npm run build`, then manually verify affected behavior in the Vite demo and, where relevant, with two clients connected through `wire.io`.

## Commit & Pull Request Guidelines

Recent commits use short, imperative summaries such as `Update socket url`, `Fix when item is missing`, and `Improve perfs and other bug fixes (#13)`. Follow that concise style, explaining the user-visible change and referencing an issue or pull request when applicable. Pull requests should describe the behavior changed, include validation commands and relevant manual-test notes, and add screenshots or recordings for UI changes. Keep generated output and unrelated changes out of the review.

## Security & Configuration Tips

Do not commit credentials, private socket endpoints, or local environment files. Treat the `wire.io` server URL and synchronization payloads as deployment configuration, and verify changes do not expose board or session data unnecessarily.

## npm Publishing Recap

Before publishing, run `npm run lint`, `npm run build`, and `npm pack --dry-run` to verify the package contents. The package is published as `react-sync-board`; update the version in `package.json` before publishing a new release.

Publishing requires either interactive npm 2FA or a granular access token with package read/write access and **Bypass two-factor authentication** enabled. For token-based publishing, configure the token locally with `npm config set //registry.npmjs.org/:_authToken=YOUR_TOKEN`, verify with `npm whoami`, then run `npm publish`. Never commit or share the token.
