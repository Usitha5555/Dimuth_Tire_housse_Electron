# Dimuth Tirehouse Management System

A fully offline desktop management system for tire and wheel businesses, built with Electron, React, SQLite, and TailwindCSS. Perfect for managing tires, alloy wheels, inventory, sales, and invoicing.

## Tech Stack

- **Electron** - Desktop application framework
- **React** - UI library
- **SQLite (better-sqlite3)** - Local database
- **TailwindCSS** - UI styling
- **Vite** - Build tool for React
- **TypeScript** - Type safety
- **electron-builder** - Windows installer packaging

## Features

- ✅ **Product & Stock Management** - Full CRUD operations for tires, alloy wheels, and general products
- ✅ **Brand & Size Management** - Manage tire brands, tire sizes, and wheel sizes with predefined options
- ✅ **Smart Product Forms** - Add products with brand selection, size dropdowns, and inline size creation
- ✅ **Invoice Creation / Billing Screen** - Quick and easy invoice generation with product search and filtering
- ✅ **Receipts** - PDF generation and direct printing with professional formatting
- ✅ **Low-Stock Alerts** - Automatic alerts for products below threshold
- ✅ **Enhanced Dashboard** - Beautiful charts and visualizations:
  - Sales trend charts (last 7 days)
  - Product type distribution (pie chart)
  - Daily invoices bar chart
  - Comprehensive sales statistics
- ✅ **Daily Sales Reports** - Detailed reports with top products and revenue breakdown
- ✅ **Fully Offline Operation** - No internet required, all data stored locally
- ✅ **Windows .exe Installer** - Easy installation package

## Project Structure

```
dimuth-tirehouse-pos/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # Main entry point
│   │   ├── database.ts    # SQLite database layer
│   │   └── ipc-handlers.ts # IPC request handlers
│   ├── preload/           # Preload scripts
│   │   └── preload.ts     # Secure IPC bridge
│   └── renderer/          # React application
│       ├── components/     # React components
│       ├── pages/         # Page components
│       ├── hooks/         # Custom React hooks
│       ├── types/         # TypeScript types
│       ├── utils/         # Utility functions
│       └── App.tsx        # Main React component
├── assets/                 # Static assets
├── dist/                   # Vite build output
├── dist-electron/          # Electron build output
└── release/                # Packaged installers
```

## Development Roadmap

### Phase 1: Project Bootstrap ✅
- [x] Initialize project structure
- [x] Set up Electron main process
- [x] Create preload script
- [x] Configure Vite + React
- [x] Set up SQLite database connection
- [x] Create basic IPC channels

### Phase 2: Database Schema & Migrations ✅
- [x] Create database schema (products, invoices, invoice_items, stock_movements)
- [x] Implement migration system
- [x] Database initialization on app start

### Phase 3: Product Management ✅
- [x] Product list view with search/filter
- [x] Add/Edit product form
- [x] Delete product with confirmation
- [x] Stock quantity management

### Phase 4: Stock Management ✅
- [x] Stock level display
- [x] Stock adjustment interface (Add/Subtract/Set)
- [x] Low-stock alerts dashboard
- [x] Stock movement tracking (via sales)

### Phase 5: Billing & Invoicing ✅
- [x] Billing screen with cart
- [x] Product search and add to cart
- [x] Invoice generation
- [x] Invoice list/history view
- [x] Automatic stock deduction on sale

### Phase 6: Receipts & Printing ✅
- [x] Receipt template design
- [x] PDF generation (jsPDF)
- [x] Direct printer support (browser print dialog)
- [x] Receipt download after checkout

### Phase 7: Reports ✅
- [x] Daily sales report
- [x] Sales by product report
- [x] Date filtering
- [x] Revenue and invoice statistics

### Phase 8: Polish & Packaging 🚧
- [x] Basic error handling
- [x] Loading states
- [x] Low-stock alerts component
- [ ] Enhanced toast notifications (components created, needs integration)
- [ ] Responsive UI improvements
- [x] Windows installer configuration (electron-builder ready)
- [ ] Testing and bug fixes

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Windows 10/11 (for building Windows installer)
- Python 3.x and build tools (for better-sqlite3 native compilation)

**Note for Windows:** You may need to install Windows Build Tools:
```bash
npm install --global windows-build-tools
```

### Installation

```bash
# Install dependencies
npm install

# Run in development mode (starts Vite dev server + Electron)
npm run dev

# Build for production
npm run build

# Create Windows installer (.exe)
npm run dist:win
```

### Development Workflow

1. **Start Development:**
   ```bash
   npm run dev
   ```
   This will:
   - Start Vite dev server on http://localhost:5173
   - Launch Electron window automatically
   - Enable hot-reload for React components

2. **Build Application:**
   ```bash
   npm run build
   ```
   This compiles:
   - React app (Vite) → `dist/`
   - Electron main process (TypeScript) → `dist-electron/`

3. **Package Installer:**
   ```bash
   npm run dist:win
   ```
   Creates Windows installer in `release/` directory

## Development Commands

- `npm run dev` - Start development server (Vite + Electron)
- `npm run build` - Build React app and Electron main process
- `npm run dist:win` - Create Windows installer

## Architecture

### Electron Main Process
- Handles window creation and management
- Manages SQLite database connections
- Processes IPC requests from renderer

### Preload Script
- Provides secure bridge between renderer and main process
- Exposes only necessary APIs to renderer

### React Renderer
- UI components and pages
- Communicates with main process via IPC
- No direct database access (security best practice)

### Database Layer
- SQLite database stored in Electron userData directory
- All database operations in main process
- Migration system for schema updates

## Security

- Context isolation enabled
- Node integration disabled in renderer
- Preload script for secure IPC communication
- Database access only from main process

## License

MIT

