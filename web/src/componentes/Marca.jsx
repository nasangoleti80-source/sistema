/**
 * Símbolo da marca — "as três subidas" (símbolo B do manual).
 *
 * Três curvas que sobem em alturas diferentes e nunca voltam ao ponto de partida:
 *   1. Coragem   — a mais longa e difícil, entrar na academia (osso)
 *   2. Método    — a do meio, azul: a Nayara no processo (azul claro)
 *   3. Autonomia — a menor e mais alta, ela já sabe treinar (osso)
 *
 * Nunca inverter a ordem das cores nem esticar o desenho.
 * Ver docs/marca/marca-nayara.md.
 */
export function Simbolo({ tamanho = 28, titulo }) {
  return (
    <svg
      width={tamanho}
      height={Math.round((tamanho * 132) / 130)}
      viewBox="0 0 130 132"
      fill="none"
      strokeLinecap="round"
      role={titulo ? 'img' : 'presentation'}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      <path d="M20 118 C20 62 44 22 92 8" stroke="var(--osso)" strokeWidth="14" />
      <path d="M52 118 C52 82 66 54 98 40" stroke="var(--azul-claro)" strokeWidth="14" />
      <path d="M84 118 C84 102 92 86 108 76" stroke="var(--osso)" strokeWidth="14" />
    </svg>
  );
}

/** Assinatura horizontal: símbolo à esquerda, nome em duas linhas. */
export function Assinatura({ tamanho = 26 }) {
  return (
    <span className="assinatura">
      <Simbolo tamanho={tamanho} titulo="Nayara Sangoleti" />
      <span className="assinatura-nome">
        NAYARA
        <br />
        SANGOLETI
      </span>
    </span>
  );
}
