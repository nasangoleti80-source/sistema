import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { apagar, ehVideo, formatoAceito, gravarFluxo, LIMITE_BYTES } from '../midia.js';

const router = Router();

router.get('/', async (req, res) => {
  await db.read();
  const { alunoId } = req.query;
  let mensagens = db.data.mensagens;
  if (alunoId) mensagens = mensagens.filter((m) => m.alunoId === alunoId);
  res.json(mensagens.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1)));
});

router.post('/', async (req, res) => {
  const { alunoId, remetente, texto } = req.body;
  // Sem texto é permitido: a mensagem pode ser só uma foto ou vídeo, anexado
  // logo em seguida pelo POST /:id/midia.
  if (!alunoId) return res.status(400).json({ error: 'alunoId é obrigatório' });
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === alunoId);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
  const mensagem = {
    id: nanoid(10),
    alunoId,
    remetente: remetente === 'aluno' ? 'aluno' : 'trainer',
    texto: texto?.trim() || '',
    midia: null,
    lida: false,
    createdAt: new Date().toISOString(),
  };
  db.data.mensagens.push(mensagem);
  await db.write();
  res.status(201).json(mensagem);
});

/**
 * Foto ou vídeo dentro da conversa. Mesmo esquema dos exercícios: corpo cru,
 * gravado em fluxo direto no disco.
 *
 *   POST /api/mensagens/:id/midia?capaDe=true
 *   Content-Type: image/jpeg | video/mp4 | ...
 *
 * Com `capaDe=true`, o arquivo vira a imagem de capa do vídeo já anexado a
 * esta mensagem, em vez de substituir o anexo.
 */
router.post('/:id/midia', async (req, res) => {
  const tipo = req.get('content-type');
  if (!formatoAceito(tipo)) {
    return res.status(415).json({ error: 'Formato não aceito. Envie foto (JPG, PNG, WebP) ou vídeo (MP4, MOV, WebM).' });
  }

  await db.read();
  const mensagem = db.data.mensagens.find((m) => m.id === req.params.id);
  if (!mensagem) return res.status(404).json({ error: 'Mensagem não encontrada' });

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

  // Reler: o envio pode ter demorado e outra requisição pode ter mudado a mensagem.
  await db.read();
  const atual = db.data.mensagens.find((m) => m.id === req.params.id);
  if (!atual) {
    apagar(gravado.arquivo);
    return res.status(404).json({ error: 'Mensagem não encontrada' });
  }

  if (req.query.capaDe === 'true') {
    if (!atual.midia) {
      apagar(gravado.arquivo);
      return res.status(404).json({ error: 'Esta mensagem ainda não tem um vídeo para receber a capa.' });
    }
    apagar(atual.midia.capa);
    atual.midia.capa = gravado.arquivo;
    await db.write();
    return res.status(201).json(atual);
  }

  if (atual.midia) {
    apagar(atual.midia.arquivo);
    apagar(atual.midia.capa);
  }
  atual.midia = {
    tipo: ehVideo(tipo) ? 'video' : 'foto',
    arquivo: gravado.arquivo,
    capa: null,
    bytes: gravado.bytes,
  };
  await db.write();
  res.status(201).json(atual);
});

router.put('/:id/lida', async (req, res) => {
  await db.read();
  const idx = db.data.mensagens.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Mensagem não encontrada' });
  db.data.mensagens[idx].lida = true;
  await db.write();
  res.json(db.data.mensagens[idx]);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.mensagens.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Mensagem não encontrada' });
  const midia = db.data.mensagens[idx].midia;
  if (midia) {
    apagar(midia.arquivo);
    apagar(midia.capa);
  }
  db.data.mensagens.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

export default router;
