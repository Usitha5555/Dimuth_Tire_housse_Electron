# Setup Guide

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

**Important:** If you encounter errors with `better-sqlite3` on Windows, you may need:

```bash
# Install Windows Build Tools (run as Administrator)
npm install --global windows-build-tools

# Or use Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/downloads/
# Install "Desktop development with C++" workload
```

### 2. Verify Installation

Check that all dependencies are installed:

```bash
npm list --depth=0
```

### 3. Run Development Server

```bash
npm run dev
```

This should:
- Start Vite dev server
- Open Electron window
- Show the POS dashboard

## Project Structure Overview

```
dimuth-tirehouse-pos/
├── src/
│   ├── main/              # Electron main process (Node.js)
│   │   ├── main.ts        # Entry point, window management
│   │   ├── database.ts    # SQLite setup & migrations
│   │   └── ipc-handlers.ts # IPC request handlers
│   ├── preload/           # Preload scripts (bridge)
│   │   └── preload.ts     # Secure IPC API exposure
│   └── renderer/          # React application (UI)
│       ├── components/    # Reusable components
│       ├── pages/         # Page components
│       ├── types/         # TypeScript types
│       └── App.tsx        # Main React component
├── assets/                # Static assets (icons, images)
├── dist/                  # Vite build output
├── dist-electron/         # Electron build output
└── release/               # Packaged installers
```

## Database Location

The SQLite database is stored in Electron's userData directory:

- **Windows:** `%APPDATA%\dimuth-tirehouse-pos\database\pos.db`
- **macOS:** `~/Library/Application Support/dimuth-tirehouse-pos/database/pos.db`
- **Linux:** `~/.config/dimuth-tirehouse-pos/database/pos.db`

## Troubleshooting

### Issue: `better-sqlite3` build fails

**Solution:**
1. Install Windows Build Tools or Visual Studio Build Tools
2. Rebuild: `npm rebuild better-sqlite3`
3. Or use prebuilt binaries: `npm install better-sqlite3 --build-from-source=false`

### Issue: Electron window doesn't open

**Solution:**
1. Check if Vite is running on port 5173
2. Check console for errors
3. Try: `npm run build` then run Electron manually

### Issue: Database errors

**Solution:**
1. Check userData directory permissions
2. Delete database file to reset (backup first!)
3. Check console logs for SQL errors

## Next Steps

After setup, follow the roadmap in README.md to implement features step by step.

