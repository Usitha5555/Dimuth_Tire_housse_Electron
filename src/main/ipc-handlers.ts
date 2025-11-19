import { ipcMain, app } from 'electron';
import { getDatabase } from './database';

/**
 * Setup all IPC handlers for communication between renderer and main process
 */
export function setupIpcHandlers(): void {
  // ========== PRODUCT HANDLERS ==========
  
  ipcMain.handle('products:getAll', async () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM products ORDER BY name').all();
  });

  ipcMain.handle('products:getById', async (_, id: number) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  });

  ipcMain.handle('products:create', async (_, product: any) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO products (name, description, sku, price, cost_price, stock_quantity, low_stock_threshold, category,
                           product_type, tire_width, tire_aspect_ratio, tire_diameter, tire_load_index, tire_speed_rating,
                           wheel_diameter, wheel_width, wheel_pcd, wheel_offset, wheel_center_bore, size_display)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      product.name,
      product.description || null,
      product.sku || null,
      product.price || 0,
      product.cost_price || 0,
      product.stock_quantity || 0,
      product.low_stock_threshold || 10,
      product.category || null,
      product.product_type || 'general',
      product.tire_width || null,
      product.tire_aspect_ratio || null,
      product.tire_diameter || null,
      product.tire_load_index || null,
      product.tire_speed_rating || null,
      product.wheel_diameter || null,
      product.wheel_width || null,
      product.wheel_pcd || null,
      product.wheel_offset || null,
      product.wheel_center_bore || null,
      product.size_display || null
    );
    return { id: result.lastInsertRowid, ...product };
  });

  ipcMain.handle('products:update', async (_, id: number, product: any) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE products 
      SET name = ?, description = ?, sku = ?, price = ?, cost_price = ?, 
          stock_quantity = ?, low_stock_threshold = ?, category = ?,
          product_type = ?, tire_width = ?, tire_aspect_ratio = ?, tire_diameter = ?, 
          tire_load_index = ?, tire_speed_rating = ?, wheel_diameter = ?, wheel_width = ?,
          wheel_pcd = ?, wheel_offset = ?, wheel_center_bore = ?, size_display = ?
      WHERE id = ?
    `);
    stmt.run(
      product.name,
      product.description || null,
      product.sku || null,
      product.price || 0,
      product.cost_price || 0,
      product.stock_quantity || 0,
      product.low_stock_threshold || 10,
      product.category || null,
      product.product_type || 'general',
      product.tire_width || null,
      product.tire_aspect_ratio || null,
      product.tire_diameter || null,
      product.tire_load_index || null,
      product.tire_speed_rating || null,
      product.wheel_diameter || null,
      product.wheel_width || null,
      product.wheel_pcd || null,
      product.wheel_offset || null,
      product.wheel_center_bore || null,
      product.size_display || null,
      id
    );
    return { id, ...product };
  });

  ipcMain.handle('products:delete', async (_, id: number) => {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    stmt.run(id);
    return { success: true };
  });

  ipcMain.handle('products:getLowStock', async () => {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM products 
      WHERE stock_quantity <= low_stock_threshold 
      ORDER BY stock_quantity ASC
    `).all();
  });

  ipcMain.handle('products:getByType', async (_, productType: string) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM products WHERE product_type = ? ORDER BY name').all(productType);
  });

  ipcMain.handle('products:getBySize', async (_, size: string) => {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM products 
      WHERE size_display LIKE ? OR size_display = ?
      ORDER BY name
    `).all(`%${size}%`, size);
  });

  // ========== BRANDS HANDLERS ==========

  ipcMain.handle('brands:getAll', async () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM brands ORDER BY name').all();
  });

  ipcMain.handle('brands:create', async (_, name: string) => {
    const db = getDatabase();
    try {
      const stmt = db.prepare('INSERT INTO brands (name) VALUES (?)');
      const result = stmt.run(name);
      return { id: result.lastInsertRowid, name };
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('Brand already exists');
      }
      throw e;
    }
  });

  ipcMain.handle('brands:delete', async (_, id: number) => {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM brands WHERE id = ?');
    stmt.run(id);
    return { success: true };
  });

  // ========== TIRE SIZES HANDLERS ==========

  ipcMain.handle('tireSizes:getAll', async () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM tire_sizes ORDER BY diameter, width, aspect_ratio').all();
  });

  ipcMain.handle('tireSizes:create', async (_, sizeData: any) => {
    const db = getDatabase();
    const sizeDisplay = sizeData.size_display || 
      `${sizeData.width}/${sizeData.aspect_ratio}R${sizeData.diameter}${sizeData.load_index && sizeData.speed_rating ? ` ${sizeData.load_index}${sizeData.speed_rating}` : ''}`;
    
    try {
      const stmt = db.prepare(`
        INSERT INTO tire_sizes (width, aspect_ratio, diameter, load_index, speed_rating, size_display)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        sizeData.width,
        sizeData.aspect_ratio,
        sizeData.diameter,
        sizeData.load_index || null,
        sizeData.speed_rating || null,
        sizeDisplay
      );
      return { id: result.lastInsertRowid, ...sizeData, size_display: sizeDisplay };
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('Tire size already exists');
      }
      throw e;
    }
  });

  ipcMain.handle('tireSizes:delete', async (_, id: number) => {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM tire_sizes WHERE id = ?');
    stmt.run(id);
    return { success: true };
  });

  // ========== WHEEL SIZES HANDLERS ==========

  ipcMain.handle('wheelSizes:getAll', async () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM wheel_sizes ORDER BY diameter, width').all();
  });

  ipcMain.handle('wheelSizes:create', async (_, sizeData: any) => {
    const db = getDatabase();
    const sizeDisplay = sizeData.size_display || `${sizeData.diameter}x${sizeData.width}`;
    
    try {
      const stmt = db.prepare(`
        INSERT INTO wheel_sizes (diameter, width, pcd, offset, center_bore, size_display)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        sizeData.diameter,
        sizeData.width,
        sizeData.pcd || null,
        sizeData.offset || null,
        sizeData.center_bore || null,
        sizeDisplay
      );
      return { id: result.lastInsertRowid, ...sizeData, size_display: sizeDisplay };
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('Wheel size already exists');
      }
      throw e;
    }
  });

  ipcMain.handle('wheelSizes:delete', async (_, id: number) => {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM wheel_sizes WHERE id = ?');
    stmt.run(id);
    return { success: true };
  });

  // ========== INVOICE HANDLERS ==========

  ipcMain.handle('invoices:create', async (_, invoiceData: any) => {
    const db = getDatabase();
    const transaction = db.transaction(() => {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;
      
      // Create invoice
      const invoiceStmt = db.prepare(`
        INSERT INTO invoices (invoice_number, customer_name, customer_phone, customer_email,
                             subtotal, tax_amount, discount_amount, total_amount, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const invoiceResult = invoiceStmt.run(
        invoiceNumber,
        invoiceData.customer_name || null,
        invoiceData.customer_phone || null,
        invoiceData.customer_email || null,
        invoiceData.subtotal || 0,
        invoiceData.tax_amount || 0,
        invoiceData.discount_amount || 0,
        invoiceData.total_amount || 0,
        invoiceData.payment_method || 'cash'
      );
      
      const invoiceId = invoiceResult.lastInsertRowid as number;
      
      // Create invoice items
      const itemStmt = db.prepare(`
        INSERT INTO invoice_items (invoice_id, product_id, product_name, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      // Update stock quantities
      const stockUpdateStmt = db.prepare(`
        UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?
      `);
      
      // Create stock movements
      const stockMovementStmt = db.prepare(`
        INSERT INTO stock_movements (product_id, movement_type, quantity, reference_id)
        VALUES (?, 'sale', ?, ?)
      `);
      
      for (const item of invoiceData.items || []) {
        itemStmt.run(
          invoiceId,
          item.product_id,
          item.product_name,
          item.quantity,
          item.unit_price,
          item.total_price
        );
        
        stockUpdateStmt.run(item.quantity, item.product_id);
        stockMovementStmt.run(item.product_id, invoiceId, item.quantity);
      }
      
      return { id: invoiceId, invoice_number: invoiceNumber };
    });
    
    return transaction();
  });

  ipcMain.handle('invoices:getAll', async () => {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM invoices 
      ORDER BY created_at DESC 
      LIMIT 100
    `).all();
  });

  ipcMain.handle('invoices:getById', async (_, id: number) => {
    const db = getDatabase();
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    if (!invoice) return null;
    
    const items = db.prepare(`
      SELECT * FROM invoice_items WHERE invoice_id = ?
    `).all(id);
    
    return { ...invoice, items };
  });

  ipcMain.handle('invoices:getByDateRange', async (_, startDate: string, endDate: string) => {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM invoices 
      WHERE DATE(created_at) BETWEEN ? AND ?
      ORDER BY created_at DESC
    `).all(startDate, endDate);
  });

  // ========== REPORTS HANDLERS ==========

  ipcMain.handle('reports:dailySales', async (_, date: string) => {
    const db = getDatabase();
    const sales = db.prepare(`
      SELECT 
        COUNT(*) as total_invoices,
        SUM(total_amount) as total_revenue,
        SUM(subtotal) as total_subtotal,
        SUM(tax_amount) as total_tax,
        SUM(discount_amount) as total_discount
      FROM invoices
      WHERE DATE(created_at) = ?
    `).get(date);
    
    const topProducts = db.prepare(`
      SELECT 
        ii.product_name,
        SUM(ii.quantity) as total_quantity,
        SUM(ii.total_price) as total_revenue
      FROM invoice_items ii
      INNER JOIN invoices i ON ii.invoice_id = i.id
      WHERE DATE(i.created_at) = ?
      GROUP BY ii.product_id, ii.product_name
      ORDER BY total_revenue DESC
      LIMIT 10
    `).all(date);
    
    return { summary: sales, topProducts };
  });

  // ========== UTILITY HANDLERS ==========

  ipcMain.handle('app:getVersion', async () => {
    return app.getVersion();
  });

  ipcMain.handle('app:getDbPath', async () => {
    return app.getPath('userData');
  });
}

