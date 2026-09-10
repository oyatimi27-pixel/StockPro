import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

export async function setupDatabase(): Promise<Database> {
  const dbDir = process.env.STOCKPRO_DATA_DIR || path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'database.sqlite');

  const removeDbFiles = () => {
    try {
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
      if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
      if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);
      if (fs.existsSync(`${dbPath}-journal`)) fs.unlinkSync(`${dbPath}-journal`);
    } catch (e) {
      console.error("Failed to remove DB files:", e);
    }
  };

  const initSchema = async (database: Database) => {
    await database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        theme TEXT DEFAULT 'light'
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        barcode TEXT,
        designation TEXT NOT NULL,
        category TEXT,
        purchase_price REAL NOT NULL,
        sale_price REAL NOT NULL,
        tva REAL NOT NULL,
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 0,
        status TEXT DEFAULT 'ACTIF'
      );

      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        email TEXT,
        tax_id TEXT,
        notes TEXT,
        status TEXT DEFAULT 'ACTIF'
      );

      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        email TEXT,
        tax_id TEXT,
        notes TEXT,
        status TEXT DEFAULT 'ACTIF'
      );

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT,
        activity TEXT,
        address TEXT,
        city TEXT,
        phone TEXT,
        mobile TEXT,
        email TEXT,
        website TEXT,
        tax_id TEXT,
        commercial_register TEXT,
        rib TEXT,
        bank TEXT,
        fiscal_stamp REAL,
        currency TEXT,
        logo_path TEXT,
        theme TEXT DEFAULT 'light'
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        date TEXT NOT NULL,
        time TEXT DEFAULT '',
        client_id INTEGER NOT NULL,
        total_ht REAL NOT NULL,
        total_tva REAL NOT NULL,
        fiscal_stamp REAL NOT NULL,
        global_discount REAL DEFAULT 0,
        total_ttc REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'VALIDÉE',
        FOREIGN KEY (client_id) REFERENCES clients (id)
      );

      CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        designation TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price_ht REAL NOT NULL,
        discount REAL DEFAULT 0,
        tva REAL NOT NULL,
        total_ht REAL NOT NULL,
        total_ttc REAL NOT NULL,
        FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id)
      );
    `);

    // Ensure columns exist on upgrade
    const safeAlter = async (sql: string) => {
      try {
        await database.exec(sql);
      } catch (e) {}
    };

    await safeAlter("ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'light'");
    await safeAlter("ALTER TABLE settings ADD COLUMN theme TEXT DEFAULT 'light'");
    await safeAlter("ALTER TABLE settings ADD COLUMN activity TEXT DEFAULT ''");
    await safeAlter("ALTER TABLE invoices ADD COLUMN global_discount REAL DEFAULT 0");
    await safeAlter("ALTER TABLE invoices ADD COLUMN time TEXT DEFAULT ''");
    await safeAlter("ALTER TABLE invoice_items ADD COLUMN discount REAL DEFAULT 0");
    await safeAlter("ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'ACTIF'");
    await safeAlter("ALTER TABLE clients ADD COLUMN status TEXT DEFAULT 'ACTIF'");
    await safeAlter("ALTER TABLE suppliers ADD COLUMN status TEXT DEFAULT 'ACTIF'");

    // Create or update default admin user
    const adminExists = await database.get('SELECT * FROM users WHERE username = ?', ['admin']);
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    if (!adminExists) {
      await database.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hashedPassword, 'Administrateur']);
    } else {
      await database.run('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, 'admin']);
    }

    // Create default settings if none exist
    const settingsExist = await database.get('SELECT * FROM settings');
    if (!settingsExist) {
      await database.run(`
        INSERT INTO settings 
        (company_name, fiscal_stamp, currency) 
        VALUES (?, ?, ?)
      `, ['Ma Société', 1.000, 'TND']);
    }
  };

  let db: Database;
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    // Check integrity
    const check = await db.get('PRAGMA integrity_check;');
    if (check && check.integrity_check && check.integrity_check !== 'ok') {
      throw new Error(`Corrupt database: ${check.integrity_check}`);
    }
    await initSchema(db);
  } catch (err: any) {
    console.error("Database initialization/integrity error, rebuilding fresh database:", err?.message || err);
    if (db!) {
      try {
        await db.close();
      } catch (e) {}
    }
    removeDbFiles();
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    await initSchema(db);
  }

  return db;
}
