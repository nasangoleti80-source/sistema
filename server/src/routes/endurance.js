import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { chamarClaude, IaIndisponivelError } from '../lib/ia.js';

const router = Router();

router.get('/', async (req, res) => {
  await db.read();
  const { alunoId } = req.query;
  let planos = db.data.planosEndurance;
  if (alunoId) planos = planos.filter((p) => p.alunoId === alunoId);
  res.json(planos.sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1)));
});

router.get('/:id', async (req, res) => {
  await db.read();
  const plano = db.data.planosEndurance.find((p) => p.id === req.params.id);
  if (!plano) return res.status(404).json({ error: 'Plano não encontrado' });
  res.json(plano);
});

router.post('/', async (req, res) => {
  const { alunoId, nome, configuracao, semanas } = req.body;
  if (!alunoId) return res.status(400).json({ error: 'alunoId é obrigatório' });
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === alunoId);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
  const plano = {
    id: nanoid(10),
    alunoId,
    nome: nome?.trim() || 'Plano de endurance',
    configuracao: configuracao || {},
    semanas: Array.isArray(semanas) ? semanas : [],
    geradoPorIA: false,
    ativo: true,
    criadoEm: new Date().toISOString(),
  };
  db.data.planosEndurance.push(plano);
  await db.write();
  res.status(201).json(plano);
});

router.put('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.planosEndurance.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Plano não encontrado' });
  const atual = db.data.planosEndurance[idx];
  const { nome, configuracao, semanas, ativo } = req.body;
  const atualizado = {
    ...atual,
    nome: nome !== undefined ? nome.trim() : atual.nome,
    configuracao: configuracao !== undefined ? { ...atual.configuracao, ...configuracao } : atual.configuracao,
    semanas: semanas !== undefined ? semanas : atual.semanas,
    ativo: ativo !== undefined ? Boolean(ativo) : atual.ativo,
  };
  db.data.planosEndurance[idx] = atualizado;
  await db.write();
  res.json(atualizado);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.planosEndurance.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Plano não encontrado' });
  db.data.planosEndurance.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

// POST /api/endurance/gerar-ia { alunoId, configuracao }
// configuracao: { nivel, modalidade, objetivoProva, dataProva, periodizacao,
//   duracaoSemanas, sessoesPorSemana, kmInicial, kmPico, progressaoPercent,
//   diaLongao, incluirForca }
router.post('/gerar-ia', async (req, res) => {
  const { alunoId, configuracao } = req.body;
  if (!alunoId || !configuracao) return res.status(400).json({ error: 'alunoId e configuracao são obrigatórios' });
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === alunoId);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });

  const systemPrompt = `Você é um treinador especialista em endurance (corrida, ciclismo, natação e triathlon), com domínio de modelos de periodização: Linear (progressão constante de volume/intensidade), Blocos com múltiplos picos, Polarizado e 80/20 (80% do volume em baixa intensidade, 20% em moderada/alta).
Gere um plano de treino em JSON estrito, sem texto fora do JSON, no formato:
{
  "nome": "string",
  "semanas": [
    {
      "numero": number,
      "kmTotal": number,
      "sessoes": [
        { "dia": "segunda|terca|quarta|quinta|sexta|sabado|domingo", "tipo": "string (ex: rodagem leve, intervalado, longão, força específica, descanso, regenerativo)", "distanciaKm": number ou null, "ritmo": "string", "descricao": "string" }
      ]
    }
  ],
  "orientacoesGerais": "string"
}
Respeite: nível do atleta, modalidade, objetivo/prova, data da prova (para calcular o número de semanas até lá, se fornecida), modelo de periodização, sessões por semana, km inicial e km pico (progressão gradual, evitando saltos de volume acima de ~10% por semana), dias de treino x dias de descanso.
Sempre marque claramente 1 sessão por semana como "longão" (separado de treinos de força). Se incluirForca=true, inclua sessões de treino de força específico para corredor/atleta de endurance (força que aproveita a corrida, ex: pliometria, posterior de coxa, core, tornozelo), distribuídas estrategicamente para não prejudicar as sessões-chave.`;

  const userPrompt = `Aluno: ${aluno.nome}, sexo ${aluno.sexo}, idade ${aluno.idade || 'não informada'}.
Anamnese: dor/queixas: ${aluno.anamnese?.queixasDor || 'nenhuma'}; objetivo relatado: ${aluno.anamnese?.objetivo || 'não informado'}; condições de saúde: ${aluno.anamnese?.condicoesSaude || 'nenhuma'}.

Configuração solicitada:
- Nível do atleta: ${configuracao.nivel}
- Modalidade: ${configuracao.modalidade}
- Objetivo/prova: ${configuracao.objetivoProva}
- Data da prova: ${configuracao.dataProva || 'sem data definida (base, sem prova)'}
- Modelo de periodização: ${configuracao.periodizacao}
- Duração (semanas): ${configuracao.duracaoSemanas}
- Sessões por semana: ${configuracao.sessoesPorSemana}
- Km inicial: ${configuracao.kmInicial}
- Km pico: ${configuracao.kmPico}
- Progressão (%): ${configuracao.progressaoPercent}
- Dia do longão: ${configuracao.diaLongao}
- Incluir treino de força específico: ${configuracao.incluirForca ? 'sim' : 'não'}

Retorne apenas o JSON.`;

  try {
    const gerado = await chamarClaude(systemPrompt, userPrompt);
    const plano = {
      id: nanoid(10),
      alunoId,
      nome: gerado.nome || 'Plano de endurance gerado por IA',
      configuracao,
      semanas: gerado.semanas || [],
      orientacoesGerais: gerado.orientacoesGerais || '',
      geradoPorIA: true,
      ativo: true,
      criadoEm: new Date().toISOString(),
    };
    db.data.planosEndurance.push(plano);
    await db.write();
    res.status(201).json(plano);
  } catch (err) {
    if (err instanceof IaIndisponivelError) return res.status(503).json({ error: err.message });
    res.status(502).json({ error: err.message });
  }
});

export default router;
