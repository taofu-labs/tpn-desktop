# React + TypeScript + Vite + Electron

---

## 📦 Prerequisites

- Node.js v16+
- npm v7+
- [Playwright](https://playwright.dev/docs/intro) (for e2e tests)
- [Electron Builder](https://www.electron.build/) (already included via scripts)

---

## 🛠️ Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the App in Development Mode
This runs both the React frontend and the Electron main process in parallel:

```bash
npm run dev
```

> 💡 Under the hood:
> - `vite` starts the frontend dev server
> - `electron` runs the Electron app with hot-reloading support

---

## 🧪 Testing

### Unit Tests (via `vitest`)
```bash
npm run test:unit
```

### End-to-End Tests (via `playwright`)
```bash
npm run test:e2e
```

---

## 🔍 Preview (Production-like Frontend Only)

To preview the production build of the frontend:
```bash
npm run preview
```

---

## 🧹 Linting

Run the linter to check for issues:
```bash
npm run lint
```

---

## 📦 Building for Production

### Build the Entire App (React + Electron)
```bash
npm run build
```

This:
- Compiles TypeScript (including Electron backend)
- Builds the React frontend using Vite

---

## 🖥️ Packaging the App

Electron Builder is used to create distributable binaries for each platform.

> Note: You must be on the target OS to build for it (e.g., run `dist:win` on Windows).

### macOS (ARM64 - Apple Silicon)
```bash
npm run dist:mac
```

### Windows (x64)
```bash
npm run dist:win
```

### Linux (x64)
```bash
npm run dist:linux
```

---

## 📁 Project Structure Overview

```
src/
├── electron/           # Electron main process code (TypeScript)
│   └── tsconfig.json   # Electron-specific TypeScript config
├── renderer/           # React frontend (Vite powered)
└── ...
```

---

## ✅ Script Summary

| Script                | Description                             |
|-----------------------|-----------------------------------------|
| `dev`                | Starts dev server and Electron together |
| `dev:react`          | Starts only Vite frontend               |
| `dev:electron`       | Starts only Electron (with TS transpile)|
| `build`              | Builds frontend and Electron TS         |
| `transpile:electron` | Type-checks & compiles Electron code    |
| `dist:mac`           | Builds macOS ARM64 binary               |
| `dist:win`           | Builds Windows x64 binary               |
| `dist:linux`         | Builds Linux x64 binary                 |
| `lint`               | Runs ESLint                             |
| `test:unit`          | Runs unit tests                         |
| `test:e2e`           | Runs end-to-end Playwright tests        |
