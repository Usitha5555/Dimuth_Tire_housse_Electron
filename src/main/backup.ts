import { dialog, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { getDatabase } from './database';

interface BackupSettings {
  backupPath: string | null;
  autoBackupEnabled: boolean;
  lastBackupDate: string | null;
  backupFormat: 'csv' | 'json';
}

const SETTINGS_FILE = path.join(app.getPath('userData'), 'backup-settings.json');

export function loadBackupSettings(): BackupSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading backup settings:', error);
  }
  return {
    backupPath: null,
    autoBackupEnabled: false,
    lastBackupDate: null,
    backupFormat: 'csv',
  };
}

export function saveBackupSettings(settings: BackupSettings): void {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving backup settings:', error);
    throw error;
  }
}

export async function selectBackupFolder(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select Backup Folder',
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
}

export function createBackup(format: 'csv' | 'json', dateRange?: { startDate: string; endDate: string }): { filename: string; path: string } {
  const settings = loadBackupSettings();
  if (!settings.backupPath) {
    throw new Error('Backup folder not configured');
  }

  const db = getDatabase();
  
  // Build query with optional date range filter
  let query = `
    SELECT 
      i.*,
      GROUP_CONCAT(
        json_object(
          'product_name', ii.product_name,
          'quantity', ii.quantity,
          'unit_price', ii.unit_price,
          'total_price', ii.total_price
        )
      ) as items_json
    FROM invoices i
    LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
  `;
  
  let invoices: any[];
  
  // Add date range filter if provided
  if (dateRange && dateRange.startDate && dateRange.endDate) {
    query += ` WHERE SUBSTR(i.created_at, 1, 10) >= ? AND SUBSTR(i.created_at, 1, 10) <= ?`;
    query += ` GROUP BY i.id ORDER BY i.created_at DESC`;
    invoices = db.prepare(query).all(dateRange.startDate, dateRange.endDate);
  } else {
    query += ` GROUP BY i.id ORDER BY i.created_at DESC`;
    invoices = db.prepare(query).all();
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  let filename = `invoices-backup-${timestamp}`;
  
  // Add date range to filename if provided
  if (dateRange && dateRange.startDate && dateRange.endDate) {
    filename += `-${dateRange.startDate}-to-${dateRange.endDate}`;
  }
  
  filename += `.${format}`;
  const filePath = path.join(settings.backupPath, filename);

  if (format === 'csv') {
    createCSVBackup(invoices, filePath);
  } else {
    createJSONBackup(invoices, filePath);
  }

  // Update last backup date
  settings.lastBackupDate = new Date().toISOString();
  saveBackupSettings(settings);

  return { filename, path: filePath };
}

function createCSVBackup(invoices: any[], filePath: string): void {
  const headers = [
    'Invoice Number',
    'Date',
    'Customer Name',
    'Customer Phone',
    'Customer Email',
    'Subtotal',
    'Tax Amount',
    'Discount Amount',
    'Total Amount',
    'Payment Method',
    'Items',
  ];

  const rows = invoices.map((inv) => {
    // Parse items from JSON string
    let items = [];
    try {
      if (inv.items_json) {
        items = JSON.parse(`[${inv.items_json}]`);
      }
    } catch (e) {
      // If parsing fails, try to get items separately
      const db = getDatabase();
      items = db.prepare(`
        SELECT product_name, quantity, unit_price, total_price
        FROM invoice_items
        WHERE invoice_id = ?
      `).all(inv.id);
    }

    const itemsStr = items
      .map((item: any) => `${item.product_name} (Qty: ${item.quantity}, Price: ${item.unit_price})`)
      .join('; ');

    return [
      inv.invoice_number || '',
      inv.created_at || '',
      inv.customer_name || '',
      inv.customer_phone || '',
      inv.customer_email || '',
      inv.subtotal || 0,
      inv.tax_amount || 0,
      inv.discount_amount || 0,
      inv.total_amount || 0,
      inv.payment_method || '',
      itemsStr,
    ].map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  fs.writeFileSync(filePath, csvContent, 'utf-8');
}

function createJSONBackup(invoices: any[], filePath: string): void {
  const db = getDatabase();
  const backupData = invoices.map((inv) => {
    const items = db.prepare(`
      SELECT product_id, product_name, quantity, unit_price, total_price
      FROM invoice_items
      WHERE invoice_id = ?
    `).all(inv.id);

    return {
      invoice_number: inv.invoice_number,
      created_at: inv.created_at,
      customer_name: inv.customer_name,
      customer_phone: inv.customer_phone,
      customer_email: inv.customer_email,
      subtotal: inv.subtotal,
      tax_amount: inv.tax_amount,
      discount_amount: inv.discount_amount,
      total_amount: inv.total_amount,
      payment_method: inv.payment_method,
      items: items,
    };
  });

  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');
}

// Schedule daily backup check
let backupInterval: NodeJS.Timeout | null = null;

export function startBackupScheduler(): void {
  // Stop existing scheduler if running
  if (backupInterval) {
    clearInterval(backupInterval);
  }

  // Check every hour if backup is needed
  backupInterval = setInterval(() => {
    const settings = loadBackupSettings();
    if (settings.autoBackupEnabled && settings.backupPath) {
      const now = new Date();
      const lastBackup = settings.lastBackupDate ? new Date(settings.lastBackupDate) : null;
      
      // Check if we need to backup (once per day)
      // Backup if no previous backup exists, or if last backup was on a different day
      const shouldBackup = !lastBackup || 
        (now.getDate() !== lastBackup.getDate() || 
         now.getMonth() !== lastBackup.getMonth() || 
         now.getFullYear() !== lastBackup.getFullYear());

      // Only backup at midnight (00:00) to avoid multiple backups
      if (shouldBackup && now.getHours() === 0 && now.getMinutes() < 5) {
        try {
          createBackup(settings.backupFormat);
          console.log('Daily backup completed automatically');
        } catch (error) {
          console.error('Error during automatic backup:', error);
        }
      }
    }
  }, 60 * 60 * 1000); // Check every hour
}

export function stopBackupScheduler(): void {
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
  }
}

