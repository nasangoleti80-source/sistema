import { calcular, indexar } from '../../compartilhado/nutricao.js';

export * from '../../compartilhado/nutricao.js';

/**
 * Adaptador entre o formato das telas e o motor de cálculo.
 *
 * Na tela, uma refeição é uma lista de itens e cada item tem suas trocas
 * ("frango OU tilápia"). A primeira troca é a principal — é ela que conta no
 * total da opção; as outras existem para o aluno escolher no lugar dela.
 */

/** Índice do catálogo por id, do jeito que o motor espera. */
export const indexarAlimentos = indexar;

/** Soma de uma opção inteira, contando a troca principal de cada item. */
export function nutrientesDaOpcao(opcao, catalogo) {
  const principais = (opcao?.itens || []).map((it) => it.opcoes?.[0]).filter(Boolean);
  return calcular(principais, catalogo);
}

/** Soma de uma troca só — para mostrar quanto vale cada card do carrossel. */
export function nutrientesDaTroca(troca, catalogo) {
  return calcular(troca ? [troca] : [], catalogo);
}

/** "540 kcal · 32 P / 60 C / 14 G" — e nada quando ainda falta valor. */
export function resumoCurto(n) {
  if (!n || !n.confiavel || !n.kcal) return null;
  return `${Math.round(n.kcal)} kcal · ${Math.round(n.proteina)} P / ${Math.round(n.carboidrato)} C / ${Math.round(n.gordura)} G`;
}

/** Só as calorias, para onde não cabe a linha inteira. */
export function kcalCurto(n) {
  if (!n || !n.confiavel || !n.kcal) return null;
  return `${Math.round(n.kcal)} kcal`;
}
