import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type MemoryHit = { id: number; role: string; content: string; score: number };

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9_\- ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 500);
}

function score(queryTokens: string[], docTokens: string[]): number {
  const set = new Set(docTokens);
  let hit = 0;
  for (const t of queryTokens) if (set.has(t)) hit++;
  return hit / Math.sqrt(docTokens.length + 1);
}

export class MemoryStore {
  private db: Database.Database;

  constructor(dbPath = "data/memory.sqlite") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts INTEGER NOT NULL,
        session TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS summaries (
        session TEXT PRIMARY KEY,
        updated_ts INTEGER NOT NULL,
        summary TEXT NOT NULL
      );
    `);
  }

  add(session: string, role: string, content: string) {
    this.db.prepare(
      "INSERT INTO messages (ts, session, role, content) VALUES (?, ?, ?, ?)"
    ).run(Date.now(), session, role, content);
  }

  getRecent(session: string, limit = 12) {
    return this.db.prepare(
      "SELECT id, role, content FROM messages WHERE session=? ORDER BY id DESC LIMIT ?"
    ).all(session, limit).reverse() as { id: number; role: string; content: string }[];
  }

  getSummary(session: string): string | null {
    const row = this.db.prepare("SELECT summary FROM summaries WHERE session=?").get(session) as any;
    return row?.summary ?? null;
  }

  upsertSummary(session: string, summary: string) {
    this.db.prepare(`
      INSERT INTO summaries (session, updated_ts, summary)
      VALUES (?, ?, ?)
      ON CONFLICT(session) DO UPDATE SET updated_ts=excluded.updated_ts, summary=excluded.summary
    `).run(session, Date.now(), summary);
  }

  retrieve(session: string, query: string, limit = 6): MemoryHit[] {
    const qTok = tokenize(query);
    const rows = this.db.prepare(
      "SELECT id, role, content FROM messages WHERE session=? ORDER BY id DESC LIMIT 400"
    ).all(session) as { id: number; role: string; content: string }[];

    const scored = rows.map(r => {
      const dTok = tokenize(r.content);
      return { ...r, score: score(qTok, dTok) };
    });

    return scored
      .filter(x => x.score > 0.02)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
