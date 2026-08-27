import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { autenticar, exigirTreinador } from '../auth.js';

const router = Router();

router.use(autenticar, exigirTreinador);

function normalizarItens(lista) {
  return Array.isArray(lista)
    ? lista
        .filter((i) => i.alimento && i.alimento.trim())
        .map((i) => ({ id: i.id || nanoid(8), alimento: i.alimento.trim(), quantidade: (i.quantidade || '').trim() }))
    : [];
}

function normalizarRefeicoes(lista) {
  return Array.isArray(lista)
    ? lista
        .filter((r) => r.nome && r.nome.trim())
        .map((r) => ({
          id: r.id || nanoid(8),
          nome: r.nome.trim(),
          horario: (r.horario || '').trim(),
          itens: normalizarItens(r.itens),
          substituicoes: normalizarItens(r.substituicoes),
        }))
    : [];
}

// GET /api/dietas?alunoId=xxx
router.get('/', async (req, res) => {
  await db.read();
  const { alunoId } = req.query;
  const dieta = db.data.dietas.find((d) => d.alunoId === alunoId) || null;
  res.json(dieta);
});

// PUT /api/dietas/:alunoId - cria ou substitui a dieta do aluno
router.put('/:alunoId', async (req, res) => {
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === req.params.alunoId);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
  const { orientacoes, metas, refeicoes } = req.body;
  const idx = db.data.dietas.findIndex((d) => d.alunoId === req.params.alunoId);
  const dieta = {
    id: idx === -1 ? nanoid(10) : db.data.dietas[idx].id,
    alunoId: req.params.alunoId,
    orientacoes: orientacoes?.trim() || '',
    metas:
      metas && (metas.calorias || metas.proteina || metas.carboidrato || metas.gordura)
        ? {
            calorias: metas.calorias || '',
            proteina: metas.proteina || '',
            carboidrato: metas.carboidrato || '',
            gordura: metas.gordura || '',
          }
        : null,
    refeicoes: normalizarRefeicoes(refeicoes),
    atualizadoEm: new Date().toISOString(),
  };
  if (idx === -1) db.data.dietas.push(dieta);
  else db.data.dietas[idx] = dieta;
  await db.write();
  res.json(dieta);
});

export default router;
