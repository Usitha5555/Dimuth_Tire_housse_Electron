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
    try {
      const stmt = db.prepare(`
        INSERT INTO products (name, description, sku, price, cost_price, stock_quantity, low_stock_threshold, category,
                             product_type, tire_width, tire_aspect_ratio, tire_diameter, tire_load_index, tire_speed_rating,
                             wheel_diameter, wheel_width, wheel_pcd, wheel_offset, wheel_center_bore, wheel_stud_count, wheel_stud_type, size_display)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        product.wheel_stud_count || null,
        product.wheel_stud_type || null,
        product.size_display || null
      );
      return { id: result.lastInsertRowid, ...product };
    } catch (error: any) {
      console.error('Error creating product:', error);
      throw new Error(error.message || 'Failed to create product');
    }
  });

  ipcMain.handle('products:update', async (_, id: number, product: any) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE products 
      SET name = ?, description = ?, sku = ?, price = ?, cost_price = ?, 
          stock_quantity = ?, low_stock_threshold = ?, category = ?,
          product_type = ?, tire_width = ?, tire_aspect_ratio = ?, tire_diameter = ?, 
          tire_load_index = ?, tire_speed_rating = ?, wheel_diameter = ?, wheel_width = ?,
          wheel_pcd = ?, wheel_offset = ?, wheel_center_bore = ?, wheel_stud_count = ?, wheel_stud_type = ?, size_display = ?
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
      product.wheel_stud_count || null,
      product.wheel_stud_type || null,
      product.size_display || null,
      id
    );
    return { id, ...product };
  });

  ipcMain.handle('products:delete', async (_, id: number) => {
    const db = getDatabase();
    try {
      // Check if product is used in any invoices
      const invoiceItemsCheck = db.prepare('SELECT COUNT(*) as count FROM invoice_items WHERE product_id = ?').get(id) as { count: number };
      
      if (invoiceItemsCheck.count > 0) {
        // Product is used in invoices - delete related records first
        // Delete stock movements
        db.prepare('DELETE FROM stock_movements WHERE product_id = ?').run(id);
        // Delete invoice items (they reference the product)
        db.prepare('DELETE FROM invoice_items WHERE product_id = ?').run(id);
      }
      
      // Delete stock movements if any exist
      db.prepare('DELETE FROM stock_movements WHERE product_id = ?').run(id);
      
      // Now delete the product
      const stmt = db.prepare('DELETE FROM products WHERE id = ?');
      const result = stmt.run(id);
      
      if (result.changes === 0) {
        throw new Error('Product not found');
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting product:', error);
      throw new Error(error.message || 'Failed to delete product. It may be referenced in invoices.');
    }
  });

  ipcMain.handle('products:deleteAll', async () => {
    const db = getDatabase();
    try {
      // Delete all related records first
      db.prepare('DELETE FROM stock_movements').run();
      db.prepare('DELETE FROM invoice_items').run();
      
      // Delete all products
      const result = db.prepare('DELETE FROM products').run();
      
      return { success: true, deleted: result.changes };
    } catch (error: any) {
      console.error('Error deleting all products:', error);
      throw new Error(error.message || 'Failed to delete all products');
    }
  });

  ipcMain.handle('products:deleteByName', async (_, name: string) => {
    const db = getDatabase();
    try {
      // Find products by name (partial match)
      const products = db.prepare('SELECT id FROM products WHERE name LIKE ?').all(`%${name}%`) as { id: number }[];
      
      if (products.length === 0) {
        throw new Error(`No products found matching "${name}"`);
      }

      let deleted = 0;
      for (const product of products) {
        // Delete related records
        db.prepare('DELETE FROM stock_movements WHERE product_id = ?').run(product.id);
        db.prepare('DELETE FROM invoice_items WHERE product_id = ?').run(product.id);
        // Delete the product
        db.prepare('DELETE FROM products WHERE id = ?').run(product.id);
        deleted++;
      }
      
      return { success: true, deleted, products: products.map(p => p.id) };
    } catch (error: any) {
      console.error('Error deleting products by name:', error);
      throw new Error(error.message || 'Failed to delete products');
    }
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
    // Build size display - stud info is essential for wheel sizes
    let sizeDisplay = sizeData.size_display;
    if (!sizeDisplay) {
      sizeDisplay = `${sizeData.diameter}x${sizeData.width}`;
      if (sizeData.pcd) sizeDisplay += ` PCD:${sizeData.pcd}`;
      // Always include stud info if provided (essential field)
      if (sizeData.stud_count) {
        sizeDisplay += ` ${sizeData.stud_count} Stud`;
      }
      if (sizeData.stud_type) {
        sizeDisplay += ` (${sizeData.stud_type})`;
      }
    }
    
    try {
      const stmt = db.prepare(`
        INSERT INTO wheel_sizes (diameter, width, pcd, offset, center_bore, stud_count, stud_type, size_display)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        sizeData.diameter,
        sizeData.width,
        sizeData.pcd || null,
        sizeData.offset || null,
        sizeData.center_bore || null,
        sizeData.stud_count || null,
        sizeData.stud_type || null,
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
      
      // Get current local date/time as ISO string (without timezone conversion)
      const now = new Date();
      const localDateTime = now.getFullYear() + '-' + 
        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0');
      
      // Create invoice
      const invoiceStmt = db.prepare(`
        INSERT INTO invoices (invoice_number, customer_name, customer_phone, customer_email,
                             subtotal, tax_amount, discount_amount, total_amount, payment_method, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        invoiceData.payment_method || 'cash',
        localDateTime
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
    // Use string comparison to extract date part (first 10 characters: YYYY-MM-DD)
    // This avoids timezone issues with SQLite's DATE() function
    const sales = db.prepare(`
      SELECT 
        COUNT(*) as total_invoices,
        SUM(total_amount) as total_revenue,
        SUM(subtotal) as total_subtotal,
        SUM(tax_amount) as total_tax,
        SUM(discount_amount) as total_discount
      FROM invoices
      WHERE SUBSTR(created_at, 1, 10) = ?
    `).get(date);
    
    const topProducts = db.prepare(`
      SELECT 
        ii.product_name,
        SUM(ii.quantity) as total_quantity,
        SUM(ii.total_price) as total_revenue
      FROM invoice_items ii
      INNER JOIN invoices i ON ii.invoice_id = i.id
      WHERE SUBSTR(i.created_at, 1, 10) = ?
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

