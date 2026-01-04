import Database from 'better-sqlite3';
import path from 'path';
import { schema } from './schema';

const DATABASE_PATH = process.env.DATABASE_PATH || './data/inventory.db';

// Singleton database instance
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    const dbDir = path.dirname(DATABASE_PATH);
    const fs = require('fs');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(DATABASE_PATH);

    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = -64000'); // 64MB cache
    db.pragma('temp_store = MEMORY');
    db.pragma('foreign_keys = ON');

    // Initialize schema if needed
    initializeSchema(db);
  }

  return db;
}

function initializeSchema(database: Database.Database): void {
  // Check if tables exist
  const tablesExist = database
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='items'")
    .get();

  if (!tablesExist) {
    // Run schema creation
    database.exec(schema);
    console.log('Database schema initialized');
  }
}

// Close database connection (for cleanup)
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// Export for direct use
export { Database };
