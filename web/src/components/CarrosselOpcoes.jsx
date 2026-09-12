/**
 * Fileira que desliza para o lado. A escolhida vai para a frente e fica presa
 * na esquerda, enquanto o resto passa por trás dela.
 *
 * Há dois usos e eles não podem parecer a mesma coisa: escolher a refeição
 * inteira ("Opção 03") e trocar um alimento dentro dela ("ovo ou tapioca").
 * Empilhados com o mesmo desenho, o aluno não sabe o que está escolhendo — daí
 * a variante `miudo`, com cartão menor e sem peso visual, para o nível de
 * dentro.
 */
export default function CarrosselOpcoes({ opcoes, escolhida, onEscolher, render, miudo = false }) {
  const ordem = [escolhida, ...opcoes.map((_, i) => i).filter((i) => i !== escolhida)];
  return (
    <div className={`carrossel-opcoes ${miudo ? 'miudo' : ''}`}>
      {ordem.map((i) => (
        <button
          key={i}
          type="button"
          className={`opcao-card ${i === escolhida ? 'principal' : ''}`}
          aria-pressed={i === escolhida}
          onClick={() => onEscolher(i)}
        >
          {render(opcoes[i], i === escolhida)}
        </button>
      ))}
    </div>
  );
}
