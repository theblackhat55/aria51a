// SQLite Database Module for Node.js/Docker deployment
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export async function initializeDatabase() {
  try {
    const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'database', 'dmt.sqlite');
    
    // Ensure database directory exists with proper permissions
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true, mode: 0o755 });
    }

    console.log(`📁 Database path: ${dbPath}`);
    
    // Try to create a test file to check permissions
    try {
      const testFile = path.join(dbDir, '.test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log('✅ Database directory permissions verified');
    } catch (permError) {
      console.error('❌ Database directory permission issue:', permError.message);
      throw new Error(`Cannot write to database directory: ${dbDir}. Please check permissions.`);
    }
    
    // Initialize SQLite database
    db = new Database(dbPath);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Set journal mode to WAL for better concurrency
    db.pragma('journal_mode = WAL');
    
    // Apply migrations
    await applyMigrations();
    
    // Apply seed data if database is empty
    await applySeedData();
    
    console.log('✅ SQLite database initialized successfully');
    
    return db;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

async function applyMigrations() {
  console.log('🔧 Applying database migrations...');
  
  const migrationsDir = path.join(process.cwd(), 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('⚠️ Migrations directory not found, skipping migrations');
    return;
  }
  
  // Create migrations table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Get applied migrations
  const appliedMigrations = db.prepare('SELECT filename FROM _migrations').all();
  const appliedSet = new Set(appliedMigrations.map(m => m.filename));
  
  // Read migration files
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql') && !file.endsWith('.skip'))
    .sort();
  
  for (const filename of migrationFiles) {
    if (appliedSet.has(filename)) {
      console.log(`⏭️ Migration ${filename} already applied`);
      continue;
    }
    
    console.log(`🔄 Applying migration: ${filename}`);
    
    const migrationPath = path.join(migrationsDir, filename);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    try {
      // Execute migration in transaction
      db.transaction(() => {
        db.exec(migrationSQL);
        db.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(filename);
      })();
      
      console.log(`✅ Migration ${filename} applied successfully`);
    } catch (error) {
      console.error(`❌ Migration ${filename} failed:`, error);
      throw error;
    }
  }
  
  console.log('✅ All migrations applied successfully');
}

async function applySeedData() {
  console.log('🌱 Checking for seed data...');
  
  // Check if users table has data
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  
  if (userCount.count > 0) {
    console.log('📊 Database already has data, skipping seed');
    return;
  }
  
  console.log('🌱 Applying seed data...');
  
  // Prefer database/seed.sql, fall back to project root seed.sql
  let seedPath = path.join(process.cwd(), 'database', 'seed.sql');
  if (!fs.existsSync(seedPath)) {
    seedPath = path.join(process.cwd(), 'seed.sql');
  }
  
  if (!fs.existsSync(seedPath)) {
    console.log('⚠️ Seed file not found, skipping seed data');
    return;
  }
  
  try {
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    db.exec(seedSQL);
    console.log('✅ Seed data applied successfully');
  } catch (error) {
    console.error('❌ Seed data application failed:', error);
    throw error;
  }
}

// Database query helpers compatible with D1-style API
export function createQueryHelpers(db) {
  return {
    prepare: (sql) => {
      const stmt = db.prepare(sql);
      
      return {
        bind: (...params) => ({
          all: () => {
            try {
              const results = stmt.all(...params);
              return { results, success: true };
            } catch (error) {
              return { results: [], success: false, error: error.message };
            }
          },
          first: () => {
            try {
              const result = stmt.get(...params);
              return { result, success: true };
            } catch (error) {
              return { result: null, success: false, error: error.message };
            }
          },
          run: () => {
            try {
              const result = stmt.run(...params);
              return { 
                success: true, 
                meta: { 
                  changes: result.changes,
                  last_row_id: result.lastInsertRowid 
                } 
              };
            } catch (error) {
              return { success: false, error: error.message };
            }
          }
        }),
        
        all: (...params) => {
          try {
            const results = stmt.all(...params);
            return { results, success: true };
          } catch (error) {
            return { results: [], success: false, error: error.message };
          }
        },
        
        first: (...params) => {
          try {
            const result = stmt.get(...params);
            return { result, success: true };
          } catch (error) {
            return { result: null, success: false, error: error.message };
          }
        },
        
        run: (...params) => {
          try {
            const result = stmt.run(...params);
            return { 
              success: true, 
              meta: { 
                changes: result.changes,
                last_row_id: result.lastInsertRowid 
              } 
            };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      };
    }
  };
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('✅ Database connection closed');
  }
}