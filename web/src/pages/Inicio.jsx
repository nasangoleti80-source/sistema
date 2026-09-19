import { Link } from 'react-router-dom';
import { Icone, DESENHOS } from '../componentes/Modulo.jsx';

/**
 * Índice do sistema — só 2 escolhas, de propósito.
 *
 * Muita opção de uma vez atrapalha. Em vez de listar todo módulo aqui, o
 * Início pergunta uma coisa só: "treino ou financeiro?" — e cada resposta
 * abre a lista certa, sem nada mais na tela pra decidir.
 */

const GRUPOS = [
  {
    para: '/grupo/treino',
    icone: 'treinos',
    nome: 'Treino',
    oQueE: 'Alunos, treinos, dieta e mensagens',
  },
  {
    para: '/grupo/financeiro',
    icone: 'cobranca',
    nome: 'Financeiro',
    oQueE: 'Cobrança, pacotes, agenda e consultoria',
  },
];

export default function Inicio() {
  return (
    <div>
      <div className="lbl-sistema">Sistema Nayara Personal</div>
      <h1>
        <em>Início</em>
      </h1>
      <p className="subtitle">O que você vai fazer agora?</p>

      <div className="escolha-grupos">
        {GRUPOS.map((g) => (
          <Link to={g.para} key={g.para} className="card-grupo">
            <span className="card-grupo-ic">
              <Icone d={DESENHOS[g.icone]} />
            </span>
            <span className="card-grupo-nome">{g.nome}</span>
            <span className="card-grupo-oque">{g.oQueE}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
