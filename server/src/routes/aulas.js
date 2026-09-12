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

const DIA_SEMANA_NUMERO = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };

/**
 * Programa aulas recorrentes num período — em vez de marcar dia por dia, o
 * treinador escolhe os dias da semana (ex: seg e qua) e o período (ex: o mês
 * inteiro), e a agenda já nasce com todas as aulas daquele padrão.
 *
 *   POST /api/aulas/programar { alunoId, tipo, diasSemana: ['seg','qua'], dataInicio, dataFim }
 */
router.post('/programar', async (req, res) => {
  const { alunoId, tipo, diasSemana, dataInicio, dataFim } = req.body;
  if (!alunoId || !dataInicio || !dataFim || !Array.isArray(diasSemana) || diasSemana.length === 0) {
    return res.status(400).json({ error: 'alunoId, dataInicio, dataFim e diasSemana são obrigatórios' });
  }
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === alunoId);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });

  const diasNumeros = diasSemana.map((d) => DIA_SEMANA_NUMERO[d]).filter((n) => n !== undefined);
  const tipoFinal = tipo || 'presencial';

  const [anoI, mesI, diaI] = dataInicio.split('-').map(Number);
  const [anoF, mesF, diaF] = dataFim.split('-').map(Number);
  const cursor = new Date(anoI, mesI - 1, diaI);
  const fim = new Date(anoF, mesF - 1, diaF);

  const existentes = new Set(
    db.data.aulas.filter((a) => a.alunoId === alunoId).map((a) => `${a.data}|${a.tipo}`)
  );

  const criadas = [];
  while (cursor <= fim) {
    if (diasNumeros.includes(cursor.getDay())) {
      const dataISO = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
      const chave = `${dataISO}|${tipoFinal}`;
      if (!existentes.has(chave)) {
        const aula = {
          id: nanoid(10),
          alunoId,
          data: dataISO,
          tipo: tipoFinal,
          realizada: true,
          observacao: '',
          createdAt: new Date().toISOString(),
        };
        db.data.aulas.push(aula);
        criadas.push(aula);
        existentes.add(chave);
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  await db.write();
  res.status(201).json(criadas);
});

export default router;
