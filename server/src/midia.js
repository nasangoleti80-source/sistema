import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Fotos e vídeos ficam ao lado do db.json — é a pasta que precisa de backup. */
export const PASTA_MIDIA = path.join(__dirname, '..', 'data', 'midia');

if (!fs.existsSync(PASTA_MIDIA)) fs.mkdirSync(PASTA_MIDIA, { recursive: true });

/**
 * Só estes formatos. A extensão vem daqui e nunca do nome que o navegador manda,
 * senão um envio malicioso escolheria a extensão do arquivo gravado no disco.
 */
const FORMATOS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/webm': '.webm',
};

/** Vídeo de celular é pesado; acima disso a aluna não consegue nem carregar. */
export const LIMITE_BYTES = 60 * 1024 * 1024; // 60 MB

export const formatoAceito = (tipo) => Boolean(FORMATOS[tipo]);
export const ehVideo = (tipo) => tipo?.startsWith('video/');

/**
 * Grava o corpo da requisição direto no disco, sem carregar tudo na memória —
 * um vídeo de 60 MB não pode virar 60 MB de RAM por envio.
 *
 * Resolve com o nome do arquivo gravado; rejeita se estourar o limite, e nesse
 * caso remove o pedaço já escrito.
 */
export function gravarFluxo(req, tipo) {
  return new Promise((resolve, reject) => {
    const arquivo = nanoid(16) + FORMATOS[tipo];
    const caminho = path.join(PASTA_MIDIA, arquivo);
    const destino = fs.createWriteStream(caminho);
    let bytes = 0;

    const abortar = (erro) => {
      req.unpipe(destino);
      destino.destroy();
      fs.rm(caminho, { force: true }, () => reject(erro));
    };

    req.on('data', (pedaco) => {
      bytes += pedaco.length;
      if (bytes > LIMITE_BYTES) abortar(Object.assign(new Error('excedeu o limite'), { limite: true }));
    });
    req.on('error', abortar);
    destino.on('error', abortar);

    destino.on('finish', () => {
      if (!bytes) return fs.rm(caminho, { force: true }, () => reject(new Error('arquivo vazio')));
      resolve({ arquivo, bytes });
    });

    req.pipe(destino);
  });
}

/** Apaga um arquivo da pasta de mídia. Ignora nome que tente sair dela. */
export function apagar(arquivo) {
  if (!arquivo) return;
  const caminho = path.join(PASTA_MIDIA, path.basename(arquivo));
  if (path.dirname(caminho) !== PASTA_MIDIA) return;
  fs.rm(caminho, { force: true }, () => {});
}
