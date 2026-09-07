import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { calcularIdade, calcularVencimentoPlano } from '../lib/calculos.js';

const router = Router();

const ANAMNESE_VAZIA = {
  queixasDor: '',
  objetivo: '',
  condicoesSaude: '',
  restricoesMedicas: '',
  medicamentos: '',
  cirurgias: '',
  historicoFamiliar: '',
  nivelAtividade: 'sedentario',
  fumante: false,
  ingereAlcool: false,
  qualidadeSono: 'boa',
  observacoes: '',
};

function montarAnamnese(entrada = {}) {
  return { ...ANAMNESE_VAZIA, ...entrada };
}

function comIdade(aluno) {
  return { ...aluno, idade: calcularIdade(aluno.dataNascimento) };
}

router.get('/', async (req, res) => {
  await db.read();
  const { ativo } = req.query;
  let alunos = db.data.alunos;
  if (ativo === 'true') alunos = alunos.filter((a) => a.ativo);
  if (ativo === 'false') alunos = alunos.filter((a) => !a.ativo);
  res.json(alunos.map(comIdade).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
});

router.get('/:id', async (req, res) => {
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === req.params.id);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
  res.json(comIdade(aluno));
});

router.post('/', async (req, res) => {
  const {
    nome, telefone, email, tipo, valorMensal, periodicidade, desconto, dataInicio,
    observacoes, comoConheceu, dataNascimento, altura, sexo, anamnese,
  } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
  await db.read();
  const inicio = dataInicio || new Date().toISOString().slice(0, 10);
  const periodicidadeFinal = periodicidade || 'mensal';
  const vencimento = calcularVencimentoPlano(inicio, periodicidadeFinal);
  const aluno = {
    id: nanoid(10),
    nome: nome.trim(),
    telefone: telefone?.trim() || '',
    email: email?.trim() || '',
    tipo: tipo || 'presencial',
    valorMensal: Number(valorMensal) || 0,
    periodicidade: periodicidadeFinal,
    desconto: desconto?.trim() || '',
    dataInicio: inicio,
    dataVencimento: vencimento,
    diaVencimento: Number(vencimento.slice(8, 10)),
    observacoes: observacoes?.trim() || '',
    comoConheceu: comoConheceu || 'nao_informado',
    dataNascimento: dataNascimento || '',
    altura: altura ? Number(altura) : null,
    sexo: sexo || 'masculino',
    anamnese: montarAnamnese(anamnese),
    ativo: true,
    createdAt: new Date().toISOString(),
  };
  db.data.alunos.push(aluno);
  await db.write();
  res.status(201).json(comIdade(aluno));
});

router.put('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.alunos.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Aluno não encontrado' });
  const atual = db.data.alunos[idx];
  const {
    nome, telefone, email, tipo, valorMensal, periodicidade, desconto, dataInicio,
    observacoes, comoConheceu, ativo, dataNascimento, altura, sexo, anamnese,
  } = req.body;

  const inicioFinal = dataInicio !== undefined ? dataInicio : atual.dataInicio;
  const periodicidadeFinal = periodicidade !== undefined ? periodicidade : (atual.periodicidade || 'mensal');
  const recalcularVencimento = dataInicio !== undefined || periodicidade !== undefined;
  const vencimento = recalcularVencimento
    ? calcularVencimentoPlano(inicioFinal, periodicidadeFinal)
    : atual.dataVencimento;

  const atualizado = {
    ...atual,
    nome: nome !== undefined ? nome.trim() : atual.nome,
    telefone: telefone !== undefined ? telefone.trim() : atual.telefone,
    email: email !== undefined ? email.trim() : atual.email,
    tipo: tipo !== undefined ? tipo : atual.tipo,
    valorMensal: valorMensal !== undefined ? Number(valorMensal) : atual.valorMensal,
    periodicidade: periodicidadeFinal,
    desconto: desconto !== undefined ? desconto.trim() : atual.desconto || '',
    dataInicio: inicioFinal,
    dataVencimento: vencimento,
    diaVencimento: vencimento ? Number(vencimento.slice(8, 10)) : atual.diaVencimento,
    observacoes: observacoes !== undefined ? observacoes.trim() : atual.observacoes,
    comoConheceu: comoConheceu !== undefined ? comoConheceu : atual.comoConheceu,
    ativo: ativo !== undefined ? Boolean(ativo) : atual.ativo,
    dataNascimento: dataNascimento !== undefined ? dataNascimento : atual.dataNascimento,
    altura: altura !== undefined ? (altura ? Number(altura) : null) : atual.altura,
    sexo: sexo !== undefined ? sexo : atual.sexo,
    anamnese: anamnese !== undefined ? montarAnamnese({ ...atual.anamnese, ...anamnese }) : atual.anamnese,
  };
  db.data.alunos[idx] = atualizado;
  await db.write();
  res.json(comIdade(atualizado));
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.alunos.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Aluno não encontrado' });
  db.data.alunos.splice(idx, 1);
  db.data.aulas = db.data.aulas.filter((a) => a.alunoId !== req.params.id);
  db.data.pagamentos = db.data.pagamentos.filter((p) => p.alunoId !== req.params.id);
  db.data.avaliacoes = db.data.avaliacoes.filter((a) => a.alunoId !== req.params.id);
  db.data.treinos = db.data.treinos.filter((t) => t.alunoId !== req.params.id);
  db.data.planosEndurance = db.data.planosEndurance.filter((t) => t.alunoId !== req.params.id);
  db.data.registrosTreino = db.data.registrosTreino.filter((r) => r.alunoId !== req.params.id);
  db.data.pacotes = db.data.pacotes.filter((p) => p.alunoId !== req.params.id);
  db.data.mensagens = db.data.mensagens.filter((m) => m.alunoId !== req.params.id);
  db.data.dietas = db.data.dietas.filter((d) => d.alunoId !== req.params.id);
  await db.write();
  res.status(204).end();
});

export default router;
