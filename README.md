# React + TypeScript + Vite + Electron

## 📦 Prerequisites

- Node.js v22+
- npm v7+
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

### Build the React App
```bash
npm run build
```

This:
- Compiles TypeScript
- Builds the React frontend using Vite

---

## 🖥️ Packaging the App

Electron Builder is used to create distributable binaries for each platform.

> Note: You must be on the target OS to build for it (e.g., run `dist:win` on Windows).

### macOS (ARM64 - Apple Silicon)
```bash
npm run dist:mac
```

- Set up `.env` with relevant variables, see `build/aftersign_hook.js`
- Check entitlements in `build/entitlements.mac.plist`, the defauls should suffice

---

## ✅ Script Summary

| Script                | Description                             |
|-----------------------|-----------------------------------------|
| `dev`                | Starts dev server and Electron together |
| `dev:react`          | Starts only Vite frontend               |
| `dev:electron`       | Starts only Electron (with TS transpile)|
| `build`              | Builds frontend                         |
| `transpile:electron` | Type-checks & compiles Electron code    |
| `dist:mac`           | Builds macOS ARM64 binary               |
| `dist:win`           | Builds Windows x64 binary               |
| `dist:linux`         | Builds Linux x64 binary                 |
| `lint`               | Runs ESLint                             |
| `test:unit`          | Runs unit tests                         |
