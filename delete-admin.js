const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

// Get the database path (same logic as in database.ts)
function getDbPath() {
  // In development, use app.getPath if available, otherwise use a default path
  let userDataPath;
  try {
    userDataPath = app.getPath('userData');
  } catch (e) {
    // If app is not available (running standalone), use default path
    userDataPath = path.join(process.env.APPDATA || process.env.HOME || __dirname, 'dimuth-tirehouse-pos');
  }
  
  const dbDir = path.join(userDataPath, 'database');
  const dbPath = path.join(dbDir, 'pos.db');
  
  return dbPath;
}

const dbPath = getDbPath();
console.log('Database path:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error('Database file not found at:', dbPath);
  process.exit(1);
}

try {
  const db = new Database(dbPath);
  
  // Delete all admin records
  const result = db.prepare('DELETE FROM admin').run();
  
  console.log(`Deleted ${result.changes} admin account(s)`);
  console.log('Admin account deleted successfully!');
  console.log('You can now restart the app and create a new admin account.');
  
  db.close();
} catch (error) {
  console.error('Error deleting admin account:', error);
  process.exit(1);
}

