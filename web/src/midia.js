/**
 * Preparo de foto e vídeo no navegador, antes de enviar.
 *
 * Dois problemas do mundo real que isso resolve:
 *
 * 1. Foto de iPhone vem em HEIC, que o navegador não exibe, e com 4 MB. Passar
 *    pelo canvas converte para JPEG e reduz para uns 200 KB.
 * 2. Vídeo tocando sozinho queima o 4G da aluna. Extraindo um quadro como capa,
 *    ela vê uma imagem parada e só baixa o vídeo se tocar.
 */

const LADO_MAXIMO = 1600;
const QUALIDADE = 0.82;

const desenhar = (fonte, largura, altura) => {
  const escala = Math.min(1, LADO_MAXIMO / Math.max(largura, altura));
  const tela = document.createElement('canvas');
  tela.width = Math.round(largura * escala);
  tela.height = Math.round(altura * escala);
  tela.getContext('2d').drawImage(fonte, 0, 0, tela.width, tela.height);
  return new Promise((resolve) => tela.toBlob(resolve, 'image/jpeg', QUALIDADE));
};

/**
 * Reduz a foto e converte para JPEG. Se o navegador não souber abrir o arquivo
 * (HEIC fora do Safari, por exemplo), devolve o original — aí o servidor recusa
 * com uma mensagem clara, o que é melhor que falhar em silêncio.
 */
export async function prepararFoto(arquivo) {
  const url = URL.createObjectURL(arquivo);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('navegador não abriu a imagem'));
      el.src = url;
    });
    const blob = await desenhar(img, img.naturalWidth, img.naturalHeight);
    return blob || arquivo;
  } catch {
    return arquivo;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Extrai um quadro do vídeo para servir de capa. Devolve null quando o
 * navegador não consegue decodificar (MOV em HEVC fora do Safari é o caso
 * comum) — o vídeo continua valendo, só fica sem imagem parada.
 */
export function extrairCapa(arquivo, segundo = 0.5) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(arquivo);
    const video = document.createElement('video');
    let encerrado = false;

    const encerrar = (valor) => {
      if (encerrado) return;
      encerrado = true;
      clearTimeout(prazo);
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
      resolve(valor);
    };

    // Sem isso um vídeo que não decodifica deixa o envio pendurado para sempre.
    const prazo = setTimeout(() => encerrar(null), 10000);

    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      // Vídeo curto demais para buscar meio segundo à frente.
      video.currentTime = Math.min(segundo, Math.max(0, (video.duration || 1) / 2));
    };
    video.onseeked = async () => {
      try {
        const blob = await desenhar(video, video.videoWidth, video.videoHeight);
        encerrar(blob);
      } catch {
        encerrar(null);
      }
    };
    video.onerror = () => encerrar(null);
    video.src = url;
  });
}

export const ehVideo = (arquivo) => arquivo.type.startsWith('video/');
