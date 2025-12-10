const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

// Get the database path (Windows AppData path)
function getDbPath() {
  const appDataPath = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  const dbDir = path.join(appDataPath, 'dimuth-tirehouse-pos', 'database');
  const dbPath = path.join(dbDir, 'pos.db');
  return dbPath;
}

const dbPath = getDbPath();
console.log('Database path:', dbPath);

const fs = require('fs');

if (!fs.existsSync(dbPath)) {
  console.error('Database file not found at:', dbPath);
  console.log('Please make sure the app has been run at least once.');
  process.exit(1);
}

try {
  const db = new Database(dbPath);
  
  // Check if admin exists
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin').get();
  console.log(`Found ${adminCount.count} admin account(s)`);
  
  if (adminCount.count === 0) {
    console.log('No admin account found. Nothing to delete.');
    db.close();
    process.exit(0);
  }
  
  // Delete all admin records
  const result = db.prepare('DELETE FROM admin').run();
  
  console.log(`\n✓ Deleted ${result.changes} admin account(s)`);
  console.log('✓ Admin account deleted successfully!');
  console.log('\nYou can now restart the app and create a new admin account.');
  
  db.close();
} catch (error) {
  console.error('Error deleting admin account:', error);
  process.exit(1);
}

