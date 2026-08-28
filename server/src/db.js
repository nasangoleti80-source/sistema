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

// Valores passados pela Nayara em 28/08/2026. Presencial fica de fora (varia por local/residência).
const PRECOS_PADRAO = {
  plano_consultoria_online: { mensal: 197, trimestral: 497, semestral: 897 },
  plano_consultoria_semi_presencial: { mensal: 299, trimestral: 797, semestral: 1494 },
  plano_consultoria_online_treino_dieta: { mensal: 397, trimestral: 1047, semestral: 1974, anual: 3564 },
};

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
  anamneses: [],
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
  db.data.anamneses ||= [];
  db.data.treinador ||= null;
  db.data.config ||= {};

  if (db.data.planos.length === 0) {
    for (const nome of PLANOS_PADRAO) {
      const id = `plano_${nome.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
      const precos = precosVazios();
      const valoresConhecidos = PRECOS_PADRAO[id];
      if (valoresConhecidos) {
        for (const [periodicidade, valorCheio] of Object.entries(valoresConhecidos)) {
          precos[periodicidade].valorCheio = valorCheio;
        }
      }
      db.data.planos.push({ id, nome, precos });
    }
  }

  await db.write();
}
