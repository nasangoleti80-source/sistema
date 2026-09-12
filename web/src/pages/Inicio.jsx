import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatarMoeda, mesAtual, aniversariantesDoMes, CANAIS_CAPTACAO } from '../api.js';

/**
 * Índice do sistema.
 *
 * Reorganizado por prioridade de uso: no topo, o que ela precisa olhar assim
 * que abre o app (alunos, mensagens, aniversariantes). Depois, os outros
 * grupos de função — Aluno, Financeiro, Desafios, de onde vêm os alunos — e
 * por fim o que ela monta e o que chega no celular da aluna.
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
  conteudos: ['M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z', 'm10 9 5 3-5 3Z'],
  portal: ['M6 2h12a2.5 2.5 0 0 1 2.5 2.5v15A2.5 2.5 0 0 1 18 22H6a2.5 2.5 0 0 1-2.5-2.5v-15A2.5 2.5 0 0 1 6 2Z', 'M11 18h2'],
  desafios: ['M8 21h8', 'M12 17v4', 'M7 4h10v4a5 5 0 0 1-10 0Z', 'M7 6H4a3 3 0 0 0 3 3', 'M17 6h3a3 3 0 0 1-3 3'],
  bolo: ['M4 21v-8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8', 'M4 21h16', 'M9 11V7a3 3 0 0 1 6 0v4', 'M12 4v.01'],
};

export default function Inicio() {
  const [dados, setDados] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [desafios, setDesafios] = useState([]);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState('');

  useEffect(() => {
    const mes = mesAtual();
    Promise.all([
      api.listarAlunos(),
      api.listarTreinos(),
      api.listarPagamentos({ mes }),
      api.listarExercicios(),
      api.listarMensagens(''),
      api.listarEndurance(),
      api.listarPacotes(),
      api.listarAlimentos().catch(() => []),
      api.listarModelosDieta().catch(() => []),
      api.listarConteudos().catch(() => []),
      api.obterDashboard(mes).catch(() => null),
      api.obterHistoricoFinanceiro().catch(() => []),
      api.listarDesafios().catch(() => []),
    ])
      .then(([alunos, treinos, pagamentos, exercicios, mensagens, endurance, pacotes, alimentos, modelos, conteudos, dash, hist, des]) => {
        setDados({ alunos, treinos, pagamentos, exercicios, mensagens, endurance, pacotes, alimentos, modelos, conteudos });
        setDashboard(dash);
        setHistorico(hist);
        setDesafios(des);
      })
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
  const aniversariantes = d ? aniversariantesDoMes(d.alunos) : [];
  const treinosConcluidosNoMes = dashboard ? dashboard.treinoStatusPorAluno.reduce((s, t) => s + t.treinosNoMes, 0) : 0;
  const desafiosAtivos = desafios.filter((ds) => {
    const hoje = new Date().toISOString().slice(0, 10);
    return hoje >= ds.dataInicio && hoje <= ds.dataFim;
  });
  const historicoRecente = historico.slice(-6);
  const maiorRecebido = Math.max(1, ...historicoRecente.map((h) => h.recebido || 0));
  const canaisComContagem = dashboard
    ? Object.entries(dashboard.porCanal).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])
    : [];
  const maiorCanal = Math.max(1, ...canaisComContagem.map(([, n]) => n));

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
          {/* ------------------------------------------------- prioridade do dia */}
          <div className="modulos">
            <Modulo para="/alunos" icone="alunos" nome="Alunos" oQueE="Revisão de quem você acompanha" contagem={ativos.length} />
            <Modulo
              para="/mensagens"
              icone="mensagens"
              nome="Mensagens"
              oQueE={naoLidas ? `${plural(naoLidas, 'mensagem', 'mensagens')} sem resposta` : 'Conversa direta com o aluno'}
              contagem={naoLidas || null}
              alerta={naoLidas > 0}
            />
          </div>

          <div className="card aniversariantes-card">
            <div className="row" style={{ marginBottom: aniversariantes.length ? 10 : 0 }}>
              <span className="modulo-ic"><Icone d={DESENHOS.bolo} /></span>
              <div className="name" style={{ flex: 1 }}>Aniversariantes do mês</div>
            </div>
            {aniversariantes.length === 0 && <p className="empty">Nenhum aniversário este mês.</p>}
            {aniversariantes.map((a) => (
              <div className="list-item" key={a.aluno.id}>
                <div>
                  <div className="name">{a.aluno.nome}</div>
                  <div className="meta">Dia {String(a.dia).padStart(2, '0')}</div>
                </div>
                <span className={`badge ${a.diasRestantes === 0 ? 'pago' : 'sem-cobranca'}`}>
                  {a.diasRestantes === 0 ? 'É hoje! 🎉' : `Faltam ${a.diasRestantes} dia${a.diasRestantes === 1 ? '' : 's'}`}
                </span>
              </div>
            ))}
          </div>

          {/* --------------------------------------------------------- aluno */}
          <h2>Aluno</h2>
          <div className="modulos">
            <Modulo para="/presenca" icone="presenca" nome="Presença" oQueE="Quem treinou e quem faltou" />
            <Modulo para="/alunos" icone="avaliacoes" nome="Avaliações" oQueE="Dobras, medidas, anamnese e fotos — abre na ficha do aluno" />
            <Modulo
              para="/resumo"
              icone="resumo"
              nome="Resumo do mês"
              oQueE="Treinos concluídos, feedback de cada aluno"
              contagem={dashboard ? treinosConcluidosNoMes : null}
            />
          </div>

          {/* ----------------------------------------------------- financeiro */}
          <h2>Financeiro</h2>
          <div className="modulos">
            <Modulo para="/pagamentos" icone="cobranca" nome="Cobrança" oQueE="Mensalidade de cada aluno" contagem={d.pagamentos.filter((p) => p.status !== 'pago').length || null} alerta />
            <Modulo para="/pacotes" icone="pacotes" nome="Pacotes" oQueE="Venda fechada, com parcelas e vencimento" contagem={d.pacotes.length || null} />
          </div>
          <div className={`grid-stats ${historicoRecente.length ? '' : ''}`} style={{ marginBottom: 12 }}>
            <div className={`stat ${aReceber > 0 ? 'amber' : 'green'}`}>
              <div className="value">{formatarMoeda(aReceber)}</div>
              <div className="label">A receber no mês</div>
            </div>
          </div>
          {historicoRecente.length > 0 && (
            <div className="card">
              <div className="name" style={{ marginBottom: 10 }}>Quanto entrou por mês</div>
              <div className="grafico-barras">
                {historicoRecente.map((h) => (
                  <div key={h.mes} className="grafico-barra-item">
                    <div className="grafico-barra-trilha">
                      <div className="grafico-barra-fill" style={{ height: `${Math.max(6, (h.recebido / maiorRecebido) * 100)}%` }} />
                    </div>
                    <div className="grafico-barra-valor num">{formatarMoeda(h.recebido || 0)}</div>
                    <div className="grafico-barra-label">{h.mes.slice(5)}/{h.mes.slice(2, 4)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------ desafios */}
          <h2>Desafios</h2>
          <div className="modulos">
            <Modulo
              para="/desafios"
              icone="desafios"
              nome="Desafios"
              oQueE="Desafios de treino ou dieta, com prazo"
              contagem={desafiosAtivos.length || null}
            />
          </div>

          {/* --------------------------------------------- de onde vêm os alunos */}
          {canaisComContagem.length > 0 && (
            <>
              <h2>De onde vêm os alunos</h2>
              <div className="card">
                <div className="grafico-canais">
                  {canaisComContagem.map(([canal, n]) => (
                    <div key={canal} className="grafico-canal-linha">
                      <div className="grafico-canal-label">{CANAIS_CAPTACAO[canal] || canal}</div>
                      <div className="grafico-canal-trilha">
                        <div className="grafico-canal-fill" style={{ width: `${Math.max(6, (n / maiorCanal) * 100)}%` }} />
                      </div>
                      <div className="grafico-canal-valor num">{n}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

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
          </div>

          {/* ------------------------------------- o que chega até a aluna */}
          <h2>O que a aluna vê no celular dela</h2>
          <div className="modulos">
            <Modulo
              para="/conteudos"
              icone="conteudos"
              nome="PlayFlix"
              oQueE="Vídeos exclusivos para quem tem pacote ativo"
              contagem={d.conteudos.length || null}
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
