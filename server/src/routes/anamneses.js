import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { autenticar, exigirTreinador } from '../auth.js';

export const PARQ_PERGUNTAS = [
  'Algum médico já disse que você possui um problema cardíaco e que só deveria realizar atividade física supervisionada?',
  'Você sente dor no peito quando pratica atividade física?',
  'No último mês, você sentiu dor no peito quando não estava praticando atividade física?',
  'Você perde o equilíbrio por tontura ou já perdeu a consciência?',
  'Você tem algum problema ósseo ou articular que poderia piorar com a mudança de atividade física?',
  'Algum médico já recomendou o uso de medicamento para pressão arterial ou problema do coração?',
  'Você conhece algum outro motivo para não praticar atividade física?',
];

const CONDICOES_PADRAO = ['hipertensao', 'diabetes', 'problemaCardiaco', 'problemaRespiratorio', 'problemaArticular'];

function anamneseVazia(alunoId) {
  return {
    id: nanoid(10),
    alunoId,
    data: new Date().toISOString().slice(0, 10),
    objetivoPrincipal: '',
    experiencia: 'nunca_treinou',
    condicoes: Object.fromEntries(CONDICOES_PADRAO.map((c) => [c, false])),
    outrasCondicoes: '',
    cirurgias: '',
    lesoes: '',
    medicamentos: '',
    dorAtual: '',
    parq: PARQ_PERGUNTAS.map(() => null),
    habitos: { sono: '', agua: '', fumante: false, alcool: 'nunca', estresse: 'medio' },
    profissaoSedentaria: false,
    atividadeAtual: '',
    observacoesProfissional: '',
    atualizadoEm: new Date().toISOString(),
  };
}

const router = Router();

router.use(autenticar, exigirTreinador);

// GET /api/anamneses?alunoId=xxx
router.get('/', async (req, res) => {
  await db.read();
  const { alunoId } = req.query;
  const anamnese = db.data.anamneses.find((a) => a.alunoId === alunoId) || null;
  res.json(anamnese);
});

// PUT /api/anamneses/:alunoId - cria ou substitui a anamnese do aluno
router.put('/:alunoId', async (req, res) => {
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === req.params.alunoId);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });

  const idx = db.data.anamneses.findIndex((a) => a.alunoId === req.params.alunoId);
  const base = idx === -1 ? anamneseVazia(req.params.alunoId) : db.data.anamneses[idx];
  const body = req.body;

  const anamnese = {
    ...base,
    data: body.data ?? base.data,
    objetivoPrincipal: body.objetivoPrincipal?.trim() ?? base.objetivoPrincipal,
    experiencia: body.experiencia ?? base.experiencia,
    condicoes: body.condicoes ?? base.condicoes,
    outrasCondicoes: body.outrasCondicoes?.trim() ?? base.outrasCondicoes,
    cirurgias: body.cirurgias?.trim() ?? base.cirurgias,
    lesoes: body.lesoes?.trim() ?? base.lesoes,
    medicamentos: body.medicamentos?.trim() ?? base.medicamentos,
    dorAtual: body.dorAtual?.trim() ?? base.dorAtual,
    parq: Array.isArray(body.parq) && body.parq.length === PARQ_PERGUNTAS.length ? body.parq : base.parq,
    habitos: body.habitos ?? base.habitos,
    profissaoSedentaria: body.profissaoSedentaria !== undefined ? Boolean(body.profissaoSedentaria) : base.profissaoSedentaria,
    atividadeAtual: body.atividadeAtual?.trim() ?? base.atividadeAtual,
    observacoesProfissional: body.observacoesProfissional?.trim() ?? base.observacoesProfissional,
    atualizadoEm: new Date().toISOString(),
  };

  if (idx === -1) db.data.anamneses.push(anamnese);
  else db.data.anamneses[idx] = anamnese;
  await db.write();
  res.json(anamnese);
});

export default router;
