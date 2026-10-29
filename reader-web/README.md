# Yomiori Web

React + TypeScript + Vite reader, with a local editor during development. Start with the repository [AI entry point](../AGENTS.md) for task scope and delivery rules.

## Setup and local use

Run these commands from reader-web. Use Node.js compatible with the engines in package-lock.json and the checked-in npm lockfile.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The development editor writes JSON files into src/data through the middleware in [vite.config.ts](vite.config.ts); review the resulting diff before committing.

## Checks and production output

| Command, from reader-web | Purpose |
| --- | --- |
| npm run lint | Oxlint checks |
| npm test | Web tests in tests/ |
| npm run build | TypeScript check, Vite build and postbuild CDN export |
| npm run preview | Preview the existing production build locally |

Choose checks for the changed behavior; preview does not provide the development editor's write endpoints. A build produces dist/ for deployment and dist/data/ manifests/data for the mobile CDN. Deployment configuration lives in [deploy.yml](../.github/workflows/deploy.yml); production has no file-writing backend.

## Read next

- [Chapter conversion and publishing](../AI_CONVERSION_GUIDE.md#chapter-protocol): mandatory when adding or modifying chapter content.
- [Product vocabulary](../CONTEXT.md): consistent bookshelf, offline and resume terminology.
- [System architecture](../SYSTEM_BLUEPRINT.md): data flow, editor endpoints and historical context.
- [Git delivery](../AGENTS.md#delivery): commit/push rules for completed changes.
