# Project Structure

```
src/
├── main.tsx                  # App entry point
├── App.tsx                   # Root component — renders ClosingTicketPage
├── App.css                   # Global app styles
├── index.css                 # Base / reset styles
│
├── assets/                   # Static assets (logos, images)
│   └── logoData.ts           # Logo metadata / exports
│
├── components/               # Shared, reusable UI components
│   ├── ui/                   # shadcn/ui primitives (DO NOT modify manually)
│   ├── enterprise/           # App-level layout components (PageHeader, StatCard, etc.)
│   │   └── index.ts          # Barrel export for all enterprise components
│   ├── dashboard/            # Dashboard-specific widgets
│   ├── feedback/             # Status banners, processing indicators
│   ├── filters/              # SearchFilter, SelectFilter
│   └── icons/                # Custom SVG icon components
│
├── features/                 # Feature modules (primary business logic)
│   ├── closingTickets/       # Closing ticket management (main feature)
│   │   ├── api/              # Service calls wrapping generated services
│   │   ├── components/       # Page and UI components for this feature
│   │   ├── constants/        # Column definitions, static config
│   │   ├── data/             # Client-side caches (e.g. buildingListCache)
│   │   ├── hooks/            # Feature-specific React hooks
│   │   ├── types/            # TypeScript types / interfaces
│   │   ├── utils/            # Pure helper functions
│   │   └── index.ts          # Public API — only export what other features need
│   ├── invoices/             # Invoice / charge line-item management
│   ├── charges/              # Unpaid / scheduled charges
│   └── newOwnerTickets/      # New owner ticket generation
│
├── generated/                # AUTO-GENERATED — do not edit
│   ├── models/               # Dataverse entity interfaces and enum maps
│   ├── services/             # CRUD service wrappers for each Dataverse table
│   └── index.ts              # Barrel export
│
├── hooks/                    # Global / cross-feature React hooks
│   └── useAutoClear.ts       # Clears state after a timeout (used for toasts)
│
├── lib/
│   └── utils.ts              # cn() helper (clsx + tailwind-merge)
│
└── styles/
    └── tokens.css            # Design tokens (colors, spacing, typography)
```

## Architecture Rules

### Feature modules
- Each feature under `src/features/` is self-contained with its own `api/`, `components/`, `hooks/`, `types/`, and `utils/` sub-folders.
- Cross-feature imports must go through the feature's `index.ts` barrel — never import directly from another feature's internal files.
- Feature `index.ts` files export only what other modules need; keep internal implementation private.

### API layer
- `src/features/<feature>/api/` wraps the generated services with domain-specific logic (filtering, error handling, type mapping).
- Never call `src/generated/services/` directly from components or hooks — always go through the feature's `api/` layer.
- OData string values must be escaped (see `escapeODataString` pattern in `invoiceService.ts`).

### Components
- Shared, reusable components go in `src/components/`.
- Feature-specific components stay inside their feature folder.
- Always use the `cn()` utility from `src/lib/utils.ts` for conditional Tailwind class names.
- Prefer composing from `src/components/ui/` (shadcn primitives) and `src/components/enterprise/` before writing new layout components.

### State management
- No global state library. State is managed locally with `useState`/`useReducer` and lifted as needed.
- Data fetching is encapsulated in custom hooks (`use<Feature>.ts`) that return `{ records, loading, error, refresh }`.

### Types
- Feature types are derived from generated Dataverse models using `Pick`, `Partial`, and `Omit` — avoid duplicating field names.
- Enum values come from the generated const objects in `src/generated/models/`; import and re-export them from feature `types/` files as needed.

### Styling
- Tailwind utility classes are the primary styling mechanism.
- Design tokens (CSS variables) are defined in `src/styles/tokens.css`.
- Component-scoped CSS files are acceptable for complex animations (e.g. `ProcessingDots.css`).
- Inline `style` props are used only for dynamic values that Tailwind cannot express (e.g. computed gradients, exact font sizes).
