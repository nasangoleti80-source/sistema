import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  await db.read();
  const { grupoMuscular } = req.query;
  let exercicios = db.data.exercicios;
  if (grupoMuscular) exercicios = exercicios.filter((e) => e.grupoMuscular === grupoMuscular);
  res.json(exercicios.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
});

router.post('/', async (req, res) => {
  const { nome, grupoMuscular, videoUrl, descricao, equipamento } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
  await db.read();
  const exercicio = {
    id: nanoid(10),
    nome: nome.trim(),
    grupoMuscular: grupoMuscular || 'outro',
    videoUrl: videoUrl?.trim() || '',
    descricao: descricao?.trim() || '',
    equipamento: equipamento?.trim() || '',
    createdAt: new Date().toISOString(),
  };
  db.data.exercicios.push(exercicio);
  await db.write();
  res.status(201).json(exercicio);
});

router.put('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.exercicios.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Exercício não encontrado' });
  const atual = db.data.exercicios[idx];
  const { nome, grupoMuscular, videoUrl, descricao, equipamento } = req.body;
  const atualizado = {
    ...atual,
    nome: nome !== undefined ? nome.trim() : atual.nome,
    grupoMuscular: grupoMuscular !== undefined ? grupoMuscular : atual.grupoMuscular,
    videoUrl: videoUrl !== undefined ? videoUrl.trim() : atual.videoUrl,
    descricao: descricao !== undefined ? descricao.trim() : atual.descricao,
    equipamento: equipamento !== undefined ? equipamento.trim() : atual.equipamento,
  };
  db.data.exercicios[idx] = atualizado;
  await db.write();
  res.json(atualizado);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.exercicios.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Exercício não encontrado' });
  db.data.exercicios.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

export default router;
