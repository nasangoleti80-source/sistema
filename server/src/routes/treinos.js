import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { chamarClaude, IaIndisponivelError } from '../lib/ia.js';

const router = Router();

router.get('/', async (req, res) => {
  await db.read();
  const { alunoId } = req.query;
  let treinos = db.data.treinos;
  if (alunoId) treinos = treinos.filter((t) => t.alunoId === alunoId);
  res.json(treinos.sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1)));
});

router.get('/:id', async (req, res) => {
  await db.read();
  const treino = db.data.treinos.find((t) => t.id === req.params.id);
  if (!treino) return res.status(404).json({ error: 'Treino não encontrado' });
  res.json(treino);
});

router.post('/', async (req, res) => {
  const { alunoId, nome, configuracao, dias } = req.body;
  if (!alunoId) return res.status(400).json({ error: 'alunoId é obrigatório' });
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === alunoId);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
  const treino = {
    id: nanoid(10),
    alunoId,
    nome: nome?.trim() || 'Treino',
    configuracao: configuracao || {},
    dias: Array.isArray(dias) ? dias : [],
    geradoPorIA: false,
    ativo: true,
    criadoEm: new Date().toISOString(),
  };
  db.data.treinos.push(treino);
  await db.write();
  res.status(201).json(treino);
});

router.put('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.treinos.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Treino não encontrado' });
  const atual = db.data.treinos[idx];
  const { nome, configuracao, dias, ativo } = req.body;
  const atualizado = {
    ...atual,
    nome: nome !== undefined ? nome.trim() : atual.nome,
    configuracao: configuracao !== undefined ? { ...atual.configuracao, ...configuracao } : atual.configuracao,
    dias: dias !== undefined ? dias : atual.dias,
    ativo: ativo !== undefined ? Boolean(ativo) : atual.ativo,
  };
  db.data.treinos[idx] = atualizado;
  await db.write();
  res.json(atualizado);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.treinos.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Treino não encontrado' });
  db.data.treinos.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

// POST /api/treinos/gerar-ia { alunoId, configuracao }
// configuracao: { objetivo, tipoPeriodizacao, nivel, diasPorSemana, divisao,
//   duracaoSessaoMin, semanasMesociclo, modalidade, aerobio, enfaseMuscular: [] }
router.post('/gerar-ia', async (req, res) => {
  const { alunoId, configuracao } = req.body;
  if (!alunoId || !configuracao) return res.status(400).json({ error: 'alunoId e configuracao são obrigatórios' });
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === alunoId);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });

  const ultimaAvaliacao = db.data.avaliacoes
    .filter((a) => a.alunoId === alunoId)
    .sort((a, b) => (a.data < b.data ? 1 : -1))[0];

  const systemPrompt = `Você é um especialista em prescrição de treinamento de musculação (personal trainer, periodização de força e hipertrofia).
Gere um plano de treino em JSON estrito, sem nenhum texto fora do JSON, seguindo exatamente este formato:
{
  "nome": "string",
  "dias": [
    {
      "letra": "A",
      "nome": "string (ex: Peito e Tríceps)",
      "exercicios": [
        {
          "nome": "string",
          "grupoMuscular": "string",
          "series": number,
          "repeticoes": "string (ex: 8-12)",
          "descansoSeg": number,
          "metodo": "string (ex: convencional, cluster-set, rest-pause, drop-set, tri-set, bi-set, piramide, super-serie, german-volume)",
          "cargaAlvoKg": number ou null,
          "observacao": "string"
        }
      ]
    }
  ],
  "orientacoesGerais": "string"
}
Use a quantidade de dias igual a "divisao" informada (A, B, C, D...), respeitando frequência semanal, nível do aluno, objetivo, tipo de periodização (linear = progressão de carga constante, ondulatória = varia intensidade/volume a cada sessão/semana, linear inversa = começa alta intensidade baixo volume e inverte, blocos = blocos de acumulação/intensificação/realização), duração de sessão, modalidade e ênfase muscular indicadas. Se aeróbio = "incluir", adicione um bloco de aeróbio ao final de cada dia. Se "automatico", decida com base no objetivo.`;

  const userPrompt = `Aluno: ${aluno.nome}, sexo ${aluno.sexo}, idade ${aluno.idade || 'não informada'}.
Anamnese: dor/queixas: ${aluno.anamnese?.queixasDor || 'nenhuma'}; objetivo relatado: ${aluno.anamnese?.objetivo || 'não informado'}; condições de saúde: ${aluno.anamnese?.condicoesSaude || 'nenhuma'}; restrições: ${aluno.anamnese?.restricoesMedicas || 'nenhuma'}.
${ultimaAvaliacao ? `Última avaliação física: peso ${ultimaAvaliacao.pesoKg}kg, %gordura ${ultimaAvaliacao.calculado?.percentualGordura ?? 'n/d'}.` : ''}

Configuração do treino solicitada:
- Objetivo: ${configuracao.objetivo}
- Tipo de periodização: ${configuracao.tipoPeriodizacao}
- Nível: ${configuracao.nivel}
- Dias por semana: ${configuracao.diasPorSemana}
- Divisão: ${configuracao.divisao}
- Duração da sessão (min): ${configuracao.duracaoSessaoMin}
- Semanas do mesociclo: ${configuracao.semanasMesociclo}
- Modalidade: ${configuracao.modalidade}
- Aeróbio: ${configuracao.aerobio}
- Ênfase muscular principal: ${(configuracao.enfaseMuscular || []).join(', ') || 'nenhuma específica'}

Retorne apenas o JSON.`;

  try {
    const gerado = await chamarClaude(systemPrompt, userPrompt);
    const treino = {
      id: nanoid(10),
      alunoId,
      nome: gerado.nome || 'Treino gerado por IA',
      configuracao,
      dias: gerado.dias || [],
      orientacoesGerais: gerado.orientacoesGerais || '',
      geradoPorIA: true,
      ativo: true,
      criadoEm: new Date().toISOString(),
    };
    db.data.treinos.push(treino);
    await db.write();
    res.status(201).json(treino);
  } catch (err) {
    if (err instanceof IaIndisponivelError) return res.status(503).json({ error: err.message });
    res.status(502).json({ error: err.message });
  }
});

export default router;
