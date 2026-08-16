import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';

const router = Router();

// GET /api/aulas?mes=YYYY-MM&alunoId=xxx
router.get('/', async (req, res) => {
  await db.read();
  const { mes, alunoId } = req.query;
  let aulas = db.data.aulas;
  if (mes) aulas = aulas.filter((a) => a.data.startsWith(mes));
  if (alunoId) aulas = aulas.filter((a) => a.alunoId === alunoId);
  res.json(aulas.sort((a, b) => (a.data < b.data ? 1 : -1)));
});

router.post('/', async (req, res) => {
  const { alunoId, data, tipo, realizada, observacao } = req.body;
  if (!alunoId || !data) return res.status(400).json({ error: 'alunoId e data são obrigatórios' });
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === alunoId);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
  const aula = {
    id: nanoid(10),
    alunoId,
    data,
    tipo: tipo || 'presencial',
    realizada: realizada !== undefined ? Boolean(realizada) : true,
    observacao: observacao?.trim() || '',
    createdAt: new Date().toISOString(),
  };
  db.data.aulas.push(aula);
  await db.write();
  res.status(201).json(aula);
});

router.put('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.aulas.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Registro não encontrado' });
  const atual = db.data.aulas[idx];
  const { data, tipo, realizada, observacao } = req.body;
  const atualizado = {
    ...atual,
    data: data !== undefined ? data : atual.data,
    tipo: tipo !== undefined ? tipo : atual.tipo,
    realizada: realizada !== undefined ? Boolean(realizada) : atual.realizada,
    observacao: observacao !== undefined ? observacao.trim() : atual.observacao,
  };
  db.data.aulas[idx] = atualizado;
  await db.write();
  res.json(atualizado);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.aulas.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Registro não encontrado' });
  db.data.aulas.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

export default router;
