import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { autenticar, exigirTreinador } from '../auth.js';

const router = Router();

router.use(autenticar, exigirTreinador);

// GET /api/treinos?alunoId=xxx
router.get('/', async (req, res) => {
  await db.read();
  const { alunoId } = req.query;
  let treino = db.data.treinos.find((t) => t.alunoId === alunoId) || null;
  res.json(treino);
});

// PUT /api/treinos/:alunoId - cria ou substitui o treino do aluno
router.put('/:alunoId', async (req, res) => {
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === req.params.alunoId);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
  const { exercicios, observacoes } = req.body;
  const idx = db.data.treinos.findIndex((t) => t.alunoId === req.params.alunoId);
  const treino = {
    id: idx === -1 ? nanoid(10) : db.data.treinos[idx].id,
    alunoId: req.params.alunoId,
    exercicios: Array.isArray(exercicios)
      ? exercicios.map((ex) => ({
          id: ex.id || nanoid(8),
          nome: (ex.nome || '').trim(),
          series: ex.series || '',
          repeticoes: ex.repeticoes || '',
          carga: ex.carga || '',
          observacao: ex.observacao || '',
        }))
      : [],
    observacoes: observacoes?.trim() || '',
    atualizadoEm: new Date().toISOString(),
  };
  if (idx === -1) db.data.treinos.push(treino);
  else db.data.treinos[idx] = treino;
  await db.write();
  res.json(treino);
});

export default router;
