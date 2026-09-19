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
  res.json(
    aulas.sort((a, b) => {
      if (a.data !== b.data) return a.data < b.data ? 1 : -1;
      // Dentro do mesmo dia, por horário — quem não tem horário vai por último.
      if (!a.hora && !b.hora) return 0;
      if (!a.hora) return 1;
      if (!b.hora) return -1;
      return a.hora < b.hora ? -1 : 1;
    })
  );
});

router.post('/', async (req, res) => {
  const { alunoId, data, hora, tipo, realizada, observacao } = req.body;
  if (!alunoId || !data) return res.status(400).json({ error: 'alunoId e data são obrigatórios' });
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === alunoId);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
  const aula = {
    id: nanoid(10),
    alunoId,
    data,
    hora: hora || null,
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
  const { data, hora, tipo, realizada, observacao } = req.body;
  const atualizado = {
    ...atual,
    data: data !== undefined ? data : atual.data,
    hora: hora !== undefined ? (hora || null) : atual.hora,
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
 *   POST /api/aulas/programar { alunoId, tipo, diasSemana: ['seg','qua'], dataInicio, dataFim, hora }
 *
 * dataInicio e dataFim: basta informar um dos dois — o outro é preenchido
 * sozinho (início = hoje; fim = 3 meses depois do início), já que gerar aula
 * pra sempre não é viável.
 */
router.post('/programar', async (req, res) => {
  const { alunoId, tipo, diasSemana, dataInicio, dataFim, hora } = req.body;
  if (!alunoId || (!dataInicio && !dataFim) || !Array.isArray(diasSemana) || diasSemana.length === 0) {
    return res.status(400).json({ error: 'alunoId, diasSemana e ao menos uma das datas (início ou fim) são obrigatórios' });
  }
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === alunoId);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });

  const diasNumeros = diasSemana.map((d) => DIA_SEMANA_NUMERO[d]).filter((n) => n !== undefined);
  const tipoFinal = tipo || 'presencial';

  const inicioBase = dataInicio ? (() => {
    const [a, m, d] = dataInicio.split('-').map(Number);
    return new Date(a, m - 1, d);
  })() : null;
  const fimBase = dataFim ? (() => {
    const [a, m, d] = dataFim.split('-').map(Number);
    return new Date(a, m - 1, d);
  })() : null;

  const cursor = inicioBase || new Date();
  cursor.setHours(0, 0, 0, 0);
  const fim = fimBase || new Date(cursor.getFullYear(), cursor.getMonth() + 3, cursor.getDate());

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
          hora: hora || null,
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
