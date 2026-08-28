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

export const PERIODICIDADES = ['mensal', 'bimestral', 'trimestral', 'semestral', 'anual'];

const PLANOS_PADRAO = [
  'Presencial',
  'Consultoria online',
  'Consultoria semi-presencial',
  'Consultoria online treino + dieta',
];

function precosVazios() {
  const precos = {};
  for (const periodicidade of PERIODICIDADES) precos[periodicidade] = { valorCheio: null, valorDesconto: null };
  return precos;
}

const defaultData = {
  alunos: [],
  aulas: [],
  pagamentos: [],
  avaliacoes: [],
  treinos: [],
  mensagens: [],
  alimentosBanco: [],
  dietas: [],
  videosPremium: [],
  planos: [],
  treinador: null,
  config: {},
};

export const db = new Low(adapter, defaultData);

export async function initDb() {
  await db.read();
  db.data ||= structuredClone(defaultData);
  db.data.alunos ||= [];
  db.data.aulas ||= [];
  db.data.pagamentos ||= [];
  db.data.avaliacoes ||= [];
  db.data.treinos ||= [];
  db.data.mensagens ||= [];
  db.data.alimentosBanco ||= [];
  db.data.dietas ||= [];
  db.data.videosPremium ||= [];
  db.data.planos ||= [];
  db.data.treinador ||= null;
  db.data.config ||= {};

  if (db.data.planos.length === 0) {
    for (const nome of PLANOS_PADRAO) {
      db.data.planos.push({ id: `plano_${nome.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`, nome, precos: precosVazios() });
    }
  }

  await db.write();
}
