# Tech Stack

## Core

| Layer | Choice |
|---|---|
| Language | TypeScript 5.9 (strict) |
| UI Framework | React 19 |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite` plugin) |
| Component Library | shadcn/ui (components live in `src/components/ui/`) |
| Icons | lucide-react |
| Animation | Framer Motion |
| PDF Rendering | react-pdf + pdfjs-dist |
| Platform SDK | `@microsoft/power-apps` |

## Utility Libraries

- `clsx` + `tailwind-merge` — combined in `src/lib/utils.ts` as the `cn()` helper. Always use `cn()` for conditional class names.
- `class-variance-authority` — used inside shadcn/ui variants.

## Linting

ESLint 9 with `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`.

## Common Commands

```bash
# Start local dev server (opens at http://localhost:5173)
npm run dev

# Type-check + production build (outputs to dist/)
npm run build

# Lint the project
npm run lint

# Preview the production build locally
npm run preview
```

## Power Platform Deployment

```bash
# Authenticate with Power Platform
pac auth create

# List / select target environment
pac org list
pac org select --environment <environment-id-or-url>

# Deploy (after npm run build)
pac power-fx push

# Solution-based deployment
pac solution pack --zipfile ClosingManagement.zip --folder <solution-folder>
pac solution import --path ClosingManagement.zip
```

## Important Constraints

- **Do not manually edit** any file under `src/generated/`. These are auto-generated from Dataverse schemas and will be overwritten.
- The generated services (`src/generated/services/`) expose `getAll`, `create`, `update`, and `delete` methods. Always go through these when reading/writing Dataverse data.
- Power Automate flows are invoked via the generated service wrappers — do not call flow endpoints directly.
