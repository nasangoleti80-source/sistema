import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const file = path.join(dataDir, 'db.json');
const adapter = new JSONFile(file);

const defaultData = {
  alunos: [],
  aulas: [],
  pagamentos: [],
};

export const db = new Low(adapter, defaultData);

export async function initDb() {
  await db.read();
  db.data ||= structuredClone(defaultData);
  db.data.alunos ||= [];
  db.data.aulas ||= [];
  db.data.pagamentos ||= [];
  await db.write();
}
