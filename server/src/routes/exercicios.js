import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { apagar, ehVideo, formatoAceito, gravarFluxo, LIMITE_BYTES } from '../midia.js';

const router = Router();

const limpar = (v) => (typeof v === 'string' ? v.trim() : '');

router.get('/', async (req, res) => {
  await db.read();
  const { grupo } = req.query;
  let lista = db.data.exercicios;
  if (grupo) lista = lista.filter((e) => e.grupo === grupo);
  res.json(lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
});

router.get('/:id', async (req, res) => {
  await db.read();
  const exercicio = db.data.exercicios.find((e) => e.id === req.params.id);
  if (!exercicio) return res.status(404).json({ error: 'Exercício não encontrado' });
  res.json(exercicio);
});

router.post('/', async (req, res) => {
  const { nome, grupo, equipamento, ondeFica, comoFazer } = req.body;
  if (!limpar(nome)) return res.status(400).json({ error: 'O nome do exercício é obrigatório' });
  await db.read();
  const exercicio = {
    id: nanoid(10),
    nome: limpar(nome),
    grupo: grupo || 'outro',
    equipamento: equipamento || 'maquina',
    // O diferencial: onde o aparelho fica nesta academia.
    ondeFica: limpar(ondeFica),
    comoFazer: limpar(comoFazer),
    midia: [],
    createdAt: new Date().toISOString(),
  };
  db.data.exercicios.push(exercicio);
  await db.write();
  res.status(201).json(exercicio);
});

router.put('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.exercicios.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Exercício não encontrado' });
  const atual = db.data.exercicios[idx];
  const { nome, grupo, equipamento, ondeFica, comoFazer } = req.body;
  if (nome !== undefined && !limpar(nome)) {
    return res.status(400).json({ error: 'O nome do exercício é obrigatório' });
  }
  const atualizado = {
    ...atual,
    nome: nome !== undefined ? limpar(nome) : atual.nome,
    grupo: grupo !== undefined ? grupo : atual.grupo,
    equipamento: equipamento !== undefined ? equipamento : atual.equipamento,
    ondeFica: ondeFica !== undefined ? limpar(ondeFica) : atual.ondeFica,
    comoFazer: comoFazer !== undefined ? limpar(comoFazer) : atual.comoFazer,
  };
  db.data.exercicios[idx] = atualizado;
  await db.write();
  res.json(atualizado);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.exercicios.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Exercício não encontrado' });
  // Leva os arquivos junto, senão a pasta de mídia vira um cemitério.
  for (const m of db.data.exercicios[idx].midia) {
    apagar(m.arquivo);
    apagar(m.capa);
  }
  db.data.exercicios.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

/**
 * Envio de foto ou vídeo. O corpo é o arquivo cru — sem multipart, sem base64:
 * é o que deixa gravar em fluxo, direto no disco.
 *
 *   POST /api/exercicios/:id/midia?legenda=...&capaDe=<idDaMidia>
 *   Content-Type: video/mp4
 *
 * Com `capaDe`, o arquivo entra como imagem de capa do vídeo indicado, em vez
 * de virar um item novo. É o quadro que o navegador da Nayara extrai do vídeo
 * na hora do envio, para a aluna ver uma imagem parada antes de tocar.
 */
router.post('/:id/midia', async (req, res) => {
  const tipo = req.get('content-type');
  if (!formatoAceito(tipo)) {
    return res.status(415).json({ error: 'Formato não aceito. Envie foto (JPG, PNG, WebP) ou vídeo (MP4, MOV, WebM).' });
  }

  await db.read();
  const exercicio = db.data.exercicios.find((e) => e.id === req.params.id);
  if (!exercicio) return res.status(404).json({ error: 'Exercício não encontrado' });

  const { capaDe } = req.query;
  const alvo = capaDe ? exercicio.midia.find((m) => m.id === capaDe) : null;
  if (capaDe && !alvo) return res.status(404).json({ error: 'Mídia não encontrada' });

  let gravado;
  try {
    gravado = await gravarFluxo(req, tipo);
  } catch (e) {
    if (e.limite) {
      const mb = Math.round(LIMITE_BYTES / 1024 / 1024);
      return res.status(413).json({ error: `Arquivo muito grande. O limite é ${mb} MB — grave o vídeo em qualidade menor.` });
    }
    return res.status(400).json({ error: 'Não deu para salvar o arquivo. Tente de novo.' });
  }

  // Reler: o envio pode ter demorado e outra requisição pode ter escrito no meio.
  await db.read();
  const atual = db.data.exercicios.find((e) => e.id === req.params.id);
  if (!atual) {
    apagar(gravado.arquivo);
    return res.status(404).json({ error: 'Exercício não encontrado' });
  }

  if (capaDe) {
    const item = atual.midia.find((m) => m.id === capaDe);
    if (!item) {
      apagar(gravado.arquivo);
      return res.status(404).json({ error: 'Mídia não encontrada' });
    }
    apagar(item.capa);
    item.capa = gravado.arquivo;
    await db.write();
    return res.status(201).json(item);
  }

  const item = {
    id: nanoid(10),
    tipo: ehVideo(tipo) ? 'video' : 'foto',
    arquivo: gravado.arquivo,
    capa: null,
    bytes: gravado.bytes,
    legenda: limpar(req.query.legenda),
    createdAt: new Date().toISOString(),
  };
  atual.midia.push(item);
  await db.write();
  res.status(201).json(item);
});

router.delete('/:id/midia/:midiaId', async (req, res) => {
  await db.read();
  const exercicio = db.data.exercicios.find((e) => e.id === req.params.id);
  if (!exercicio) return res.status(404).json({ error: 'Exercício não encontrado' });
  const idx = exercicio.midia.findIndex((m) => m.id === req.params.midiaId);
  if (idx === -1) return res.status(404).json({ error: 'Mídia não encontrada' });
  apagar(exercicio.midia[idx].arquivo);
  apagar(exercicio.midia[idx].capa);
  exercicio.midia.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

export default router;
