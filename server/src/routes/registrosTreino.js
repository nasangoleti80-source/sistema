import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { calcularCaloriasTreino, calcularVolumeTreino } from '../lib/calculos.js';

const router = Router();

router.get('/', async (req, res) => {
  await db.read();
  const { alunoId, treinoId } = req.query;
  let registros = db.data.registrosTreino;
  if (alunoId) registros = registros.filter((r) => r.alunoId === alunoId);
  if (treinoId) registros = registros.filter((r) => r.treinoId === treinoId);
  res.json(registros.sort((a, b) => (a.data < b.data ? 1 : -1)));
});

// GET /api/registros-treino/historico-carga?alunoId=xxx&exercicioNome=Supino
// Retorna o histórico de cargas usadas nesse exercício, para mostrar "carga anterior"
router.get('/historico-carga', async (req, res) => {
  await db.read();
  const { alunoId, exercicioNome } = req.query;
  if (!alunoId || !exercicioNome) return res.status(400).json({ error: 'alunoId e exercicioNome são obrigatórios' });
  const historico = [];
  for (const registro of db.data.registrosTreino.filter((r) => r.alunoId === alunoId)) {
    const carga = registro.cargas.find((c) => c.exercicioNome === exercicioNome);
    if (carga) historico.push({ data: registro.data, series: carga.series });
  }
  res.json(historico.sort((a, b) => (a.data < b.data ? 1 : -1)));
});

router.post('/', async (req, res) => {
  const { alunoId, treinoId, data, diaLetra, duracaoMin, intensidadePercebida, cansaco, cargas, observacoes } = req.body;
  if (!alunoId) return res.status(400).json({ error: 'alunoId é obrigatório' });
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === alunoId);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });

  const ultimaAvaliacao = db.data.avaliacoes
    .filter((a) => a.alunoId === alunoId)
    .sort((a, b) => (a.data < b.data ? 1 : -1))[0];
  const pesoKg = ultimaAvaliacao?.pesoKg || null;

  const cargasProcessadas = Array.isArray(cargas)
    ? cargas.map((c) => ({
        exercicioNome: c.exercicioNome,
        series: Array.isArray(c.series) ? c.series : [],
        volume: calcularVolumeTreino(c.series || []),
      }))
    : [];

  const registro = {
    id: nanoid(10),
    alunoId,
    treinoId: treinoId || null,
    data: data || new Date().toISOString().slice(0, 10),
    diaLetra: diaLetra || '',
    duracaoMin: Number(duracaoMin) || 0,
    intensidadePercebida: intensidadePercebida || 'moderada',
    cansaco: Number(cansaco) || 0,
    cargas: cargasProcessadas,
    volumeTotal: cargasProcessadas.reduce((s, c) => s + c.volume, 0),
    caloriasGastas: pesoKg
      ? calcularCaloriasTreino({ pesoKg, duracaoMin: Number(duracaoMin) || 0, intensidade: intensidadePercebida })
      : null,
    observacoes: observacoes?.trim() || '',
    createdAt: new Date().toISOString(),
  };
  db.data.registrosTreino.push(registro);
  await db.write();
  res.status(201).json(registro);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.registrosTreino.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Registro não encontrado' });
  db.data.registrosTreino.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

export default router;
