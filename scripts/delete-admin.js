// Simple script to delete admin account
// Run from project root: node scripts/delete-admin.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');
const fs = require('fs');

function getDbPath() {
  const appDataPath = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  const dbDir = path.join(appDataPath, 'dimuth-tirehouse-pos', 'database');
  const dbPath = path.join(dbDir, 'pos.db');
  return dbPath;
}

const dbPath = getDbPath();
console.log('Database path:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error('Database file not found at:', dbPath);
  console.log('Please make sure the app has been run at least once.');
  process.exit(1);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  
  console.log('Connected to database');
  
  // Delete admin account
  db.run('DELETE FROM admin', (err) => {
    if (err) {
      console.error('Error deleting admin:', err);
      db.close();
      process.exit(1);
    }
    
    console.log('✓ Admin account deleted successfully!');
    console.log('You can now restart the app and create a new admin account.');
    
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      }
      process.exit(0);
    });
  });
});

