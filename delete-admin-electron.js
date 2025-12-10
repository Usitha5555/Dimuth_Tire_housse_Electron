// This script uses Electron's Node runtime
// Run with: electron delete-admin-electron.js

const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

async function deleteAdmin() {
  await app.whenReady();
  
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'database');
  const dbPath = path.join(dbDir, 'pos.db');
  
  console.log('Database path:', dbPath);
  
  if (!fs.existsSync(dbPath)) {
    console.error('Database file not found at:', dbPath);
    app.quit();
    return;
  }
  
  try {
    const db = new Database(dbPath);
    
    // Check if admin exists
    const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin').get();
    console.log(`Found ${adminCount.count} admin account(s)`);
    
    if (adminCount.count === 0) {
      console.log('No admin account found. Nothing to delete.');
      db.close();
      app.quit();
      return;
    }
    
    // Delete all admin records
    const result = db.prepare('DELETE FROM admin').run();
    
    console.log(`\n✓ Deleted ${result.changes} admin account(s)`);
    console.log('✓ Admin account deleted successfully!');
    console.log('\nYou can now restart the app and create a new admin account.');
    
    db.close();
    app.quit();
  } catch (error) {
    console.error('Error deleting admin account:', error);
    app.quit();
  }
}

deleteAdmin();

