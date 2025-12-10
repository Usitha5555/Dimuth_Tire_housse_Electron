import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { getDatabase } from './database';

const SALT_ROUNDS = 10;

/**
 * Normalize master key (trim, remove spaces, uppercase)
 */
function normalizeMasterKey(masterKey: string): string {
  return masterKey.trim().replace(/\s/g, '').toUpperCase();
}

/**
 * Generate a random master key for password reset
 */
export function generateMasterKey(): string {
  // Generate a 16-character alphanumeric key (already uppercase)
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Check if admin account exists
 */
export function adminExists(): boolean {
  const db = getDatabase();
  const result = db.prepare('SELECT COUNT(*) as count FROM admin').get() as { count: number };
  return result.count > 0;
}

/**
 * Create initial admin account
 */
export async function createAdminAccount(username: string, password: string, masterKey: string): Promise<void> {
  const db = getDatabase();
  const passwordHash = await hashPassword(password);
  // Normalize master key before hashing to ensure consistency
  const normalizedMasterKey = normalizeMasterKey(masterKey);
  const masterKeyHash = await hashPassword(normalizedMasterKey);
  
  db.prepare(`
    INSERT INTO admin (username, password_hash, master_key)
    VALUES (?, ?, ?)
  `).run(username, passwordHash, masterKeyHash);
}

/**
 * Verify login credentials
 */
export async function verifyLogin(username: string, password: string): Promise<boolean> {
  const db = getDatabase();
  const admin = db.prepare('SELECT * FROM admin WHERE username = ?').get(username) as any;
  
  if (!admin) {
    return false;
  }
  
  const isValid = await verifyPassword(password, admin.password_hash);
  
  if (isValid) {
    // Update last login
    db.prepare('UPDATE admin SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(admin.id);
  }
  
  return isValid;
}

/**
 * Verify master key for password reset
 */
export async function verifyMasterKey(masterKey: string): Promise<boolean> {
  const db = getDatabase();
  const admin = db.prepare('SELECT master_key FROM admin LIMIT 1').get() as any;
  
  if (!admin || !admin.master_key) {
    console.error('Admin account or master key not found');
    return false;
  }
  
  // Normalize master key using the same function as during creation
  const normalizedKey = normalizeMasterKey(masterKey);
  
  if (!normalizedKey) {
    console.error('Master key is empty after normalization');
    return false;
  }
  
  try {
    const isValid = await verifyPassword(normalizedKey, admin.master_key);
    if (!isValid) {
      console.error('Master key verification failed. Expected hash matches normalized key:', normalizedKey);
    }
    return isValid;
  } catch (error) {
    console.error('Error verifying master key:', error);
    return false;
  }
}

/**
 * Change admin password
 */
export async function changePassword(newPassword: string): Promise<void> {
  const db = getDatabase();
  const passwordHash = await hashPassword(newPassword);
  
  db.prepare('UPDATE admin SET password_hash = ?').run(passwordHash);
}

/**
 * Get admin info (without sensitive data)
 */
export function getAdminInfo(): { username: string; last_login: string | null } | null {
  const db = getDatabase();
  const admin = db.prepare('SELECT username, last_login FROM admin LIMIT 1').get() as any;
  
  if (!admin) {
    return null;
  }
  
  return {
    username: admin.username,
    last_login: admin.last_login || null,
  };
}

