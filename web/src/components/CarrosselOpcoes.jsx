// Fileira de opções que desliza para o lado — a opção escolhida (principal)
// sempre aparece primeiro e fica fixa na esquerda enquanto o resto desliza
// por baixo/atrás dela ao arrastar.
export default function CarrosselOpcoes({ opcoes, escolhida, onEscolher, render }) {
  const ordem = [escolhida, ...opcoes.map((_, i) => i).filter((i) => i !== escolhida)];
  return (
    <div className="carrossel-opcoes">
      {ordem.map((i) => (
        <button
          key={i}
          type="button"
          className={`opcao-card ${i === escolhida ? 'principal' : ''}`}
          onClick={() => onEscolher(i)}
        >
          {render(opcoes[i], i === escolhida)}
        </button>
      ))}
    </div>
  );
}
