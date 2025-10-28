// src/db/connection.ts
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

sqlite3.verbose();

let db: Database | null = null;

// ====== Caminhos ======
const dataDir = path.resolve(__dirname, '../../data');
const dbPath = path.join(dataDir, 'database.db');

const schemaCandidates = [
  path.resolve(__dirname, './schema.sql'),
  path.resolve(__dirname, '../../src/db/schema.sql'),
  path.resolve(process.cwd(), 'src/db/schema.sql'),
  path.resolve(process.cwd(), 'db/schema.sql'),
];

// ====== Helpers ======
function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function findSchemaPath(): string | null {
  for (const p of schemaCandidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function applySchema(database: Database) {
  const schemaPath = findSchemaPath();
  if (!schemaPath) {
    console.warn('[DB] Aviso: schema.sql não encontrado; prosseguindo sem aplicar schema.');
    return;
  }
  const sql = fs.readFileSync(schemaPath, 'utf-8');
  await database.exec('PRAGMA foreign_keys = ON;');
  await database.exec(sql);
}

// ====== API ======
export async function initDatabase(): Promise<Database> {
  if (db) return db;

  ensureDataDir();

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec('PRAGMA journal_mode = WAL;');
  await db.exec('PRAGMA foreign_keys = ON;');
  await db.exec('PRAGMA busy_timeout = 5000;');

  await applySchema(db);

  return db;
}

export async function closeDatabase(): Promise<void> {
  if (!db) return;
  await db.close();
  db = null;
}

// ✅ CORRIGIDO: Retorna o RunResult com lastInsertRowid
export interface RunResult {
  lastID: number;
  changes: number;
  lastInsertRowid: number; // Compatibilidade com código legado
}

export async function execute(sql: string, params: any[] = []): Promise<RunResult> {
  const database = await initDatabase();
  const result = await database.run(sql, params);
  
  // Normalizar retorno (garantindo valores numéricos)
  return {
    lastID: result.lastID ?? 0,
    changes: result.changes ?? 0,
    lastInsertRowid: result.lastID ?? 0, // Alias para compatibilidade
  };
}

export async function queryOne<T>(sql: string, params: any[] = []): Promise<T | null> {
  const database = await initDatabase();
  const row = await database.get(sql, params);
  return (row as T) ?? null;
}

export async function queryAll<T>(sql: string, params: any[] = []): Promise<T[]> {
  const database = await initDatabase();
  const rows = await database.all(sql, params);
  return (rows as T[]) ?? [];
}

// ✅ NOVO: Alias para compatibilidade
export const query = queryAll;

// ✅ NOVO: Suporte a transações
export async function transaction<T>(callback: () => Promise<T>): Promise<T> {
  const database = await initDatabase();
  
  try {
    await database.exec('BEGIN TRANSACTION');
    const result = await callback();
    await database.exec('COMMIT');
    return result;
  } catch (error) {
    await database.exec('ROLLBACK');
    throw error;
  }
}

const exported = { initDatabase, closeDatabase, execute, queryOne, queryAll, query, transaction };
export default exported;