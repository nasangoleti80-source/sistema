import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatarMoeda, mesAtual } from '../api.js';

/**
 * Índice do sistema.
 *
 * A barra de abas misturava tudo numa fila só. Aqui os módulos aparecem
 * separados por quem usa: o que é da treinadora, o que ela monta, e o que
 * chega no celular da aluna. Cada cartão mostra um número vivo, para a tela
 * servir de painel e não só de menu.
 */

/** "1 aluno" / "3 alunos" — evita o "aluno(s)" que aparecia na tela. */
const plural = (n, um, muitos) => `${n} ${n === 1 ? um : muitos}`;

const traco = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' };
const Icone = ({ d }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...traco}>
    {d.map((p, i) => (
      <path key={i} d={p} />
    ))}
  </svg>
);

const DESENHOS = {
  alunos: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8', 'M22 21v-2a4 4 0 0 0-3-3.9'],
  presenca: ['M3 4h18v18H3z', 'M16 2v4M8 2v4M3 10h18', 'm9 15 2 2 3-3'],
  cobranca: ['M12 2v20', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  pacotes: ['M21 8v13H3V8', 'M1 3h22v5H1z', 'M10 12h4'],
  resumo: ['M3 3v18h18', 'M8 17V9M13 17V5M18 17v-6'],
  treinos: ['M6.5 6.5h11M6.5 17.5h11', 'M4 9V6a2 2 0 1 1 4 0v12a2 2 0 1 1-4 0v-3', 'M16 9V6a2 2 0 1 1 4 0v12a2 2 0 1 1-4 0v-3'],
  endurance: ['M22 12h-4l-3 9L9 3l-3 9H2'],
  dieta: ['M3 11h18', 'M6 11V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4', 'M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8'],
  exercicios: ['M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z', 'M12 9.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7'],
  avaliacoes: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z', 'M14 2v6h6M9 13h6M9 17h4'],
  alimentos: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20', 'M12 6v6l4 2'],
  bancos: ['M3 5h18v4H3zM3 11h18v4H3zM3 17h18v4H3z'],
  modelos: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z'],
  mensagens: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z'],
  portal: ['M6 2h12a2.5 2.5 0 0 1 2.5 2.5v15A2.5 2.5 0 0 1 18 22H6a2.5 2.5 0 0 1-2.5-2.5v-15A2.5 2.5 0 0 1 6 2Z', 'M11 18h2'],
};

export default function Inicio() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState('');

  useEffect(() => {
    Promise.all([
      api.listarAlunos(),
      api.listarTreinos(),
      api.listarPagamentos({ mes: mesAtual() }),
      api.listarExercicios(),
      api.listarMensagens(''),
      api.listarEndurance(),
      api.listarPacotes(),
      api.listarAlimentos().catch(() => []),
      api.listarModelosDieta().catch(() => []),
    ])
      .then(([alunos, treinos, pagamentos, exercicios, mensagens, endurance, pacotes, alimentos, modelos]) =>
        setDados({ alunos, treinos, pagamentos, exercicios, mensagens, endurance, pacotes, alimentos, modelos })
      )
      .catch((e) => setErro(e.message));
  }, []);

  async function copiarPortal(aluno) {
    const link = `${window.location.origin}/portal/${aluno.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(aluno.id);
      setTimeout(() => setCopiado(''), 2200);
    } catch {
      prompt('Copie o link do portal da aluna:', link);
    }
  }

  const d = dados;
  const ativos = d ? d.alunos.filter((a) => a.ativo) : [];
  const aReceber = d ? d.pagamentos.filter((p) => p.status !== 'pago').reduce((s, p) => s + p.valor, 0) : 0;
  const treinosAtivos = d ? d.treinos.filter((t) => t.ativo).length : 0;
  const naoLidas = d ? d.mensagens.filter((m) => m.remetente === 'aluno' && !m.lida).length : 0;
  const semTreino = d ? ativos.filter((a) => !d.treinos.some((t) => t.alunoId === a.id && t.ativo)).length : 0;
  const semMidia = d ? d.exercicios.filter((e) => !e.midia?.length).length : 0;

  /** Um módulo: para onde vai, o que faz e o número que importa nele. */
  const Modulo = ({ para, icone, nome, oQueE, contagem, alerta }) => (
    <Link to={para} className="modulo">
      <span className="modulo-ic">
        <Icone d={DESENHOS[icone]} />
      </span>
      <span className="modulo-txt">
        <span className="modulo-nome">{nome}</span>
        <span className="modulo-oque">{oQueE}</span>
      </span>
      {contagem !== undefined && contagem !== null && (
        <span className={`modulo-num num ${alerta ? 'alerta' : ''}`}>{contagem}</span>
      )}
    </Link>
  );

  return (
    <div>
      <div className="lbl-sistema">Sistema Nayara Personal</div>
      <h1>
        <em>Início</em>
      </h1>
      <p className="subtitle">Tudo que o sistema faz, separado por quem usa.</p>

      {erro && <div className="error-msg">{erro}</div>}
      {!d && !erro && <p className="empty">Carregando…</p>}

      {d && (
        <>
          <div className="grid-stats">
            <div className="stat">
              <div className="value">{ativos.length}</div>
              <div className="label">Alunos ativos</div>
            </div>
            <div className={`stat ${aReceber > 0 ? 'amber' : 'green'}`}>
              <div className="value">{formatarMoeda(aReceber)}</div>
              <div className="label">A receber no mês</div>
            </div>
          </div>

          {/* ------------------------------------------------ o que é meu */}
          <h2>Meu dia a dia</h2>
          <div className="modulos">
            <Modulo para="/alunos" icone="alunos" nome="Alunos" oQueE="Cadastro, anamnese e link do portal" contagem={ativos.length} />
            <Modulo para="/presenca" icone="presenca" nome="Presença" oQueE="Quem treinou e quem faltou" />
            <Modulo para="/pagamentos" icone="cobranca" nome="Cobrança" oQueE="Mensalidade de cada aluno" contagem={d.pagamentos.filter((p) => p.status !== 'pago').length || null} alerta />
            <Modulo para="/pacotes" icone="pacotes" nome="Pacotes" oQueE="Venda fechada, com parcelas" contagem={d.pacotes.length || null} />
            <Modulo para="/resumo" icone="resumo" nome="Resumo do mês" oQueE="Quanto entrou, quanto falta, quantas aulas" />
          </div>

          {/* --------------------------------------------- o que eu monto */}
          <h2>O que eu monto</h2>
          <div className="modulos">
            <Modulo
              para="/treinos"
              icone="treinos"
              nome="Treinos"
              oQueE={semTreino ? `${plural(semTreino, 'aluno ativo', 'alunos ativos')} sem treino` : 'Musculação, com volume e métodos'}
              contagem={treinosAtivos}
              alerta={semTreino > 0}
            />
            <Modulo para="/endurance" icone="endurance" nome="Endurance" oQueE="Corrida, bike e natação por prova" contagem={d.endurance.length || null} />
            <Modulo para="/dietas" icone="dieta" nome="Dieta" oQueE="Plano alimentar de cada aluno" />
            <Modulo para="/alimentos" icone="alimentos" nome="Alimentos" oQueE="Catálogo que alimenta as dietas" contagem={d.alimentos.length || null} />
            <Modulo para="/bancos-opcoes" icone="bancos" nome="Bancos de opções" oQueE="Trocas prontas de café, lanche e jantar" />
            <Modulo para="/modelos-dieta" icone="modelos" nome="Modelos de dieta" oQueE="Monte uma vez, aplique em qualquer aluno" contagem={d.modelos.length || null} />
            <Modulo
              para="/exercicios"
              icone="exercicios"
              nome="Exercícios"
              oQueE={semMidia ? `${plural(semMidia, 'exercício', 'exercícios')} sem foto ou vídeo` : 'Catálogo com foto, vídeo e onde fica'}
              contagem={d.exercicios.length}
              alerta={semMidia > 0}
            />
            <Modulo para="/alunos" icone="avaliacoes" nome="Avaliações" oQueE="Dobras, medidas e anamnese — abre na ficha do aluno" />
          </div>

          {/* ------------------------------------- o que chega até a aluna */}
          <h2>O que a aluna vê no celular dela</h2>
          <div className="modulos">
            <Modulo
              para="/mensagens"
              icone="mensagens"
              nome="Mensagens"
              oQueE={naoLidas ? `${plural(naoLidas, 'mensagem', 'mensagens')} sem resposta` : 'Conversa direta com o aluno'}
              contagem={naoLidas || null}
              alerta={naoLidas > 0}
            />
          </div>

          <div className="card portais">
            <div className="row portais-topo">
              <span className="modulo-ic">
                <Icone d={DESENHOS.portal} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="name">Portal do aluno</div>
                <div className="meta">
                  Cada um tem um endereço próprio. Mande pelo WhatsApp e ele abre no celular — vê o
                  treino do dia, a foto do aparelho e a evolução.
                </div>
              </div>
            </div>

            {ativos.length === 0 && <p className="empty">Nenhum aluno ativo ainda.</p>}

            {ativos.map((a) => (
              <div className="list-item" key={a.id}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="name">{a.nome}</div>
                  <div className="meta mono portal-link">/portal/{a.id}</div>
                </div>
                <button className="btn-secondary btn-small" onClick={() => copiarPortal(a)}>
                  {copiado === a.id ? 'Copiado ✓' : 'Copiar link'}
                </button>
                <Link to={`/portal/${a.id}`} className="btn-secondary btn-small link-botao">
                  Abrir
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
