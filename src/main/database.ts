import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

/**
 * Get the database file path in Electron's userData directory
 */
function getDbPath(): string {
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'database');
  
  // Ensure database directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  return path.join(dbDir, 'pos.db');
}

/**
 * Initialize the database connection and run migrations
 */
export function initDatabase(): void {
  if (db) {
    return; // Already initialized
  }

  const dbPath = getDbPath();
  db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Run migrations
  runMigrations();

  console.log(`Database initialized at: ${dbPath}`);
}

/**
 * Get the database instance (throws if not initialized)
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Run database migrations to create/update schema
 */
function runMigrations(): void {
  if (!db) {
    throw new Error('Database not initialized');
  }

  const transaction = db.transaction(() => {
    // Create products table
    db!.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        sku TEXT UNIQUE,
        price REAL NOT NULL DEFAULT 0,
        cost_price REAL DEFAULT 0,
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 10,
        category TEXT,
        product_type TEXT DEFAULT 'general', -- 'tire', 'alloy_wheel', 'general'
        -- Tire size fields
        tire_width INTEGER, -- e.g., 205
        tire_aspect_ratio INTEGER, -- e.g., 55
        tire_diameter INTEGER, -- e.g., 16 (R16)
        tire_load_index TEXT, -- e.g., 91
        tire_speed_rating TEXT, -- e.g., V, H, W
        -- Alloy wheel size fields
        wheel_diameter INTEGER, -- e.g., 16
        wheel_width REAL, -- e.g., 7.0
        wheel_pcd TEXT, -- e.g., 5x114.3
        wheel_offset TEXT, -- e.g., ET35
        wheel_center_bore TEXT, -- e.g., 67.1
        wheel_stud_count INTEGER, -- e.g., 4, 5, 6
        wheel_stud_type TEXT, -- e.g., "Short Stud", "Long Stud", "Multi Stud"
        -- Combined size display (for easy search/filter)
        size_display TEXT, -- e.g., "205/55R16" for tires, "16x7" for wheels
        image_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration: Add new columns if they don't exist (for existing databases)
    try {
      db!.exec(`ALTER TABLE products ADD COLUMN product_type TEXT DEFAULT 'general'`);
    } catch (e) {
      // Column already exists, ignore
    }
    
    // Add tire columns
    try {
      db!.exec(`ALTER TABLE products ADD COLUMN tire_width INTEGER`);
    } catch (e) {}
    try {
      db!.exec(`ALTER TABLE products ADD COLUMN tire_aspect_ratio INTEGER`);
    } catch (e) {}
    try {
      db!.exec(`ALTER TABLE products ADD COLUMN tire_diameter INTEGER`);
    } catch (e) {}
    try {
      db!.exec(`ALTER TABLE products ADD COLUMN tire_load_index TEXT`);
    } catch (e) {}
    try {
      db!.exec(`ALTER TABLE products ADD COLUMN tire_speed_rating TEXT`);
    } catch (e) {}
    
    // Add wheel columns
    try {
      db!.exec(`ALTER TABLE products ADD COLUMN wheel_diameter INTEGER`);
    } catch (e) {}
    try {
      db!.exec(`ALTER TABLE products ADD COLUMN wheel_width REAL`);
    } catch (e) {}
    try {
      db!.exec(`ALTER TABLE products ADD COLUMN wheel_pcd TEXT`);
    } catch (e) {}
    try {
      db!.exec(`ALTER TABLE products ADD COLUMN wheel_offset TEXT`);
    } catch (e) {}
    try {
      db!.exec(`ALTER TABLE products ADD COLUMN wheel_center_bore TEXT`);
    } catch (e) {}
    try {
      db!.exec(`ALTER TABLE products ADD COLUMN wheel_stud_count INTEGER`);
    } catch (e) {}
    try {
      db!.exec(`ALTER TABLE products ADD COLUMN wheel_stud_type TEXT`);
    } catch (e) {}
    try {
      db!.exec(`ALTER TABLE products ADD COLUMN size_display TEXT`);
    } catch (e) {}

    // Create invoices table
    db!.exec(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        customer_name TEXT,
        customer_phone TEXT,
        customer_email TEXT,
        subtotal REAL NOT NULL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        total_amount REAL NOT NULL DEFAULT 0,
        payment_method TEXT,
        status TEXT DEFAULT 'completed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create invoice_items table
    db!.exec(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Create stock_movements table for tracking stock changes
    db!.exec(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        movement_type TEXT NOT NULL, -- 'sale', 'purchase', 'adjustment', 'return'
        quantity INTEGER NOT NULL,
        reference_id INTEGER, -- invoice_id or adjustment_id
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Create brands table
    db!.exec(`
      CREATE TABLE IF NOT EXISTS brands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tire_sizes table for predefined tire sizes
    db!.exec(`
      CREATE TABLE IF NOT EXISTS tire_sizes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        width INTEGER NOT NULL,
        aspect_ratio INTEGER NOT NULL,
        diameter INTEGER NOT NULL,
        load_index TEXT,
        speed_rating TEXT,
        size_display TEXT NOT NULL,
        UNIQUE(width, aspect_ratio, diameter, load_index, speed_rating)
      )
    `);

    // Create wheel_sizes table for predefined wheel sizes
    db!.exec(`
      CREATE TABLE IF NOT EXISTS wheel_sizes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        diameter INTEGER NOT NULL,
        width REAL NOT NULL,
        pcd TEXT,
        offset TEXT,
        center_bore TEXT,
        stud_count INTEGER,
        stud_type TEXT,
        size_display TEXT NOT NULL,
        UNIQUE(diameter, width, pcd, offset, center_bore, stud_count, stud_type)
      )
    `);
    
    // Add stud columns to existing wheel_sizes table if they don't exist
    try {
      db!.exec(`ALTER TABLE wheel_sizes ADD COLUMN stud_count INTEGER`);
      db!.exec(`ALTER TABLE wheel_sizes ADD COLUMN stud_type TEXT`);
    } catch (e) {
      // Columns already exist, ignore
    }

    // Insert default brands
    try {
      db!.exec(`
        INSERT OR IGNORE INTO brands (name) VALUES 
        ('MAXTREK'),
        ('MICHELIN'),
        ('BRIDGESTONE'),
        ('GOODYEAR'),
        ('CONTINENTAL'),
        ('PIRELLI'),
        ('DUNLOP'),
        ('YOKOHAMA'),
        ('HANKOOK'),
        ('TOYO'),
        ('NEXEN'),
        ('KUMHO')
      `);
    } catch (e) {
      // Ignore if already exists
    }

    // Insert common tire sizes
    try {
      db!.exec(`
        INSERT OR IGNORE INTO tire_sizes (width, aspect_ratio, diameter, size_display) VALUES
        (175, 70, 13, '175/70R13'),
        (175, 65, 14, '175/65R14'),
        (185, 65, 14, '185/65R14'),
        (185, 60, 15, '185/60R15'),
        (195, 60, 15, '195/60R15'),
        (195, 55, 15, '195/55R15'),
        (195, 55, 16, '195/55R16'),
        (205, 55, 16, '205/55R16'),
        (205, 50, 16, '205/50R16'),
        (215, 55, 16, '215/55R16'),
        (215, 50, 17, '215/50R17'),
        (225, 45, 17, '225/45R17'),
        (225, 50, 17, '225/50R17'),
        (235, 45, 17, '235/45R17'),
        (235, 40, 18, '235/40R18'),
        (245, 40, 18, '245/40R18')
      `);
    } catch (e) {
      // Ignore if already exists
    }

    // Remove default wheel sizes that don't have stud information
    // Users must add wheel sizes with stud information through the UI
    try {
      db!.exec(`DELETE FROM wheel_sizes WHERE stud_count IS NULL OR stud_type IS NULL`);
    } catch (e) {
      // Ignore if table doesn't exist or no rows to delete
    }

    // Create admin table for authentication
    db!.exec(`
      CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        master_key TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `);

    // Create indexes for better query performance
    db!.exec(`
      CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
      CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
      CREATE INDEX IF NOT EXISTS idx_products_size_display ON products(size_display);
      CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
      CREATE INDEX IF NOT EXISTS idx_tire_sizes_display ON tire_sizes(size_display);
      CREATE INDEX IF NOT EXISTS idx_wheel_sizes_display ON wheel_sizes(size_display);
      CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
      CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
      CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
      CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON invoice_items(product_id);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
      CREATE INDEX IF NOT EXISTS idx_admin_username ON admin(username);
    `);

    // Create trigger to update updated_at timestamp
    db!.exec(`
      CREATE TRIGGER IF NOT EXISTS update_products_timestamp 
      AFTER UPDATE ON products
      BEGIN
        UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);

    db!.exec(`
      CREATE TRIGGER IF NOT EXISTS update_invoices_timestamp 
      AFTER UPDATE ON invoices
      BEGIN
        UPDATE invoices SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);
  });

  transaction();
  console.log('Database migrations completed');
}

