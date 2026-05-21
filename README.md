```md
# Closing Management System

A React + TypeScript frontend for a Power Apps / PCF-style Closing Management System. The app helps manage closing tickets, document previews, invoice/closing actions, workflow statuses, and new owner ticket details.

## Tech Stack

- React
- TypeScript
- TSX
- Vite
- Tailwind CSS
- shadcn/ui
- lucide-react
- Framer Motion
- Microsoft Power Apps / Dataverse integration
- Power Platform CLI (`pac`)

## Prerequisites

Install:

- Node.js
- npm
- Power Platform CLI

Verify:

```bash
node -v
npm -v
pac --version
```

## Install Dependencies

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Then open the local Vite URL, usually:

```txt
http://localhost:5173
```

## Build

```bash
npm run build
```

The production build is generated in:

```txt
dist/
```

## Power Apps / PAC Deployment

Authenticate with Power Platform:

```bash
pac auth create
```

Select or confirm environment:

```bash
pac org list
pac org select --environment <environment-id-or-url>
```

Build the app:

```bash
npm run build
```

Deploy using the Power Apps / PAC workflow configured for the project:

```bash
pac power-fx push
```

Or, if using a solution-based deployment:

```bash
pac solution pack --zipfile ClosingManagement.zip --folder <solution-folder>
pac solution import --path ClosingManagement.zip
```

## Common Commands

```bash
npm run dev
npm run build
npm run preview
```

## Project Notes

- Do not change generated Dataverse service/model files manually.
- Keep backend contracts and Dataverse schema unchanged.
- UI changes should stay within React components, styles, and frontend behavior.
- Document preview uses the browser default PDF viewer through an iframe.
```