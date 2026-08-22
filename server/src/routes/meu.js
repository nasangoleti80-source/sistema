import { Router } from 'express';
import { db } from '../db.js';
import { autenticar, exigirAluno } from '../auth.js';

const router = Router();

router.use(autenticar, exigirAluno);

// GET /api/meu/treino
router.get('/treino', async (req, res) => {
  await db.read();
  const treino = db.data.treinos.find((t) => t.alunoId === req.usuario.alunoId) || null;
  res.json(treino);
});

// GET /api/meu/evolucao - fotos marcadas como visíveis, agrupadas por avaliação
router.get('/evolucao', async (req, res) => {
  await db.read();
  const avaliacoes = db.data.avaliacoes
    .filter((av) => av.alunoId === req.usuario.alunoId)
    .map((av) => ({
      id: av.id,
      data: av.data,
      fotos: av.fotos
        .filter((f) => f.visivelParaAluno)
        .map((f) => ({
          id: f.id,
          tipo: f.tipo,
          url: `/api/avaliacoes/fotos/${req.usuario.alunoId}/${f.arquivo}`,
        })),
    }))
    .filter((av) => av.fotos.length > 0)
    .sort((a, b) => (a.data < b.data ? -1 : 1));
  res.json(avaliacoes);
});

export default router;
