import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import {
  calcularIdade,
  calcularIMC,
  classificarIMC,
  calcularComposicaoCorporal,
  classificarPercentualGordura,
} from '../lib/calculos.js';

const router = Router();

const DOBRAS_VAZIAS = {
  triceps: null, subescapular: null, axilarMedia: null,
  suprailiaca: null, abdominal: null, coxa: null, peitoral: null,
};

const MEDIDAS_VAZIAS = {
  pescoco: null, ombro: null, torax: null, cintura: null, abdomen: null, quadril: null,
  bracoDireito: null, bracoEsquerdo: null, antebracoDireito: null, antebracoEsquerdo: null,
  coxaDireita: null, coxaEsquerda: null, panturrilhaDireita: null, panturrilhaEsquerda: null,
};

function calcular(aluno, dados) {
  const idade = calcularIdade(aluno.dataNascimento) ?? dados.idade ?? null;
  const imc = calcularIMC(dados.pesoKg, aluno.altura);
  const composicao = calcularComposicaoCorporal({
    dobras: dados.dobras,
    idade,
    sexo: aluno.sexo,
    pesoKg: dados.pesoKg,
  });
  return {
    imc,
    classificacaoImc: classificarIMC(imc),
    ...composicao,
    classificacaoGordura: composicao
      ? classificarPercentualGordura(composicao.percentualGordura, aluno.sexo)
      : '',
  };
}

router.get('/', async (req, res) => {
  await db.read();
  const { alunoId } = req.query;
  let avaliacoes = db.data.avaliacoes;
  if (alunoId) avaliacoes = avaliacoes.filter((a) => a.alunoId === alunoId);
  res.json(avaliacoes.sort((a, b) => (a.data < b.data ? 1 : -1)));
});

router.get('/:id', async (req, res) => {
  await db.read();
  const avaliacao = db.data.avaliacoes.find((a) => a.id === req.params.id);
  if (!avaliacao) return res.status(404).json({ error: 'Avaliação não encontrada' });
  res.json(avaliacao);
});

router.post('/', async (req, res) => {
  const { alunoId, data, pesoKg, dobras, medidas, fotos, observacoes } = req.body;
  if (!alunoId) return res.status(400).json({ error: 'alunoId é obrigatório' });
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === alunoId);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });

  const dadosBase = {
    pesoKg: Number(pesoKg) || null,
    dobras: { ...DOBRAS_VAZIAS, ...dobras },
    medidas: { ...MEDIDAS_VAZIAS, ...medidas },
  };

  const avaliacao = {
    id: nanoid(10),
    alunoId,
    data: data || new Date().toISOString().slice(0, 10),
    ...dadosBase,
    fotos: Array.isArray(fotos) ? fotos : [],
    observacoes: observacoes?.trim() || '',
    calculado: calcular(aluno, dadosBase),
    createdAt: new Date().toISOString(),
  };
  db.data.avaliacoes.push(avaliacao);
  await db.write();
  res.status(201).json(avaliacao);
});

router.put('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.avaliacoes.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Avaliação não encontrada' });
  const atual = db.data.avaliacoes[idx];
  const aluno = db.data.alunos.find((a) => a.id === atual.alunoId);
  const { data, pesoKg, dobras, medidas, fotos, observacoes } = req.body;

  const dadosBase = {
    pesoKg: pesoKg !== undefined ? Number(pesoKg) || null : atual.pesoKg,
    dobras: dobras !== undefined ? { ...atual.dobras, ...dobras } : atual.dobras,
    medidas: medidas !== undefined ? { ...atual.medidas, ...medidas } : atual.medidas,
  };

  const atualizado = {
    ...atual,
    data: data !== undefined ? data : atual.data,
    ...dadosBase,
    fotos: fotos !== undefined ? fotos : atual.fotos,
    observacoes: observacoes !== undefined ? observacoes.trim() : atual.observacoes,
    calculado: aluno ? calcular(aluno, dadosBase) : atual.calculado,
  };
  db.data.avaliacoes[idx] = atualizado;
  await db.write();
  res.json(atualizado);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.avaliacoes.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Avaliação não encontrada' });
  db.data.avaliacoes.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

export default router;
