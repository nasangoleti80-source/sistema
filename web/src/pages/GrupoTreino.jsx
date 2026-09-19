import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, mesAtual, aniversariantesDoMes } from '../api.js';
import { Icone, DESENHOS, Modulo, plural } from '../componentes/Modulo.jsx';

export default function GrupoTreino() {
  const [dados, setDados] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [desafios, setDesafios] = useState([]);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState('');

  useEffect(() => {
    const mes = mesAtual();
    Promise.all([
      api.listarAlunos(),
      api.listarTreinos(),
      api.listarExercicios(),
      api.listarMensagens(''),
      api.listarEndurance(),
      api.listarAlimentos().catch(() => []),
      api.listarModelosDieta().catch(() => []),
      api.listarConteudos().catch(() => []),
      api.obterDashboard(mes).catch(() => null),
      api.listarDesafios().catch(() => []),
    ])
      .then(([alunos, treinos, exercicios, mensagens, endurance, alimentos, modelos, conteudos, dash, des]) => {
        setDados({ alunos, treinos, exercicios, mensagens, endurance, alimentos, modelos, conteudos });
        setDashboard(dash);
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
  const treinosAtivos = d ? d.treinos.filter((t) => t.ativo).length : 0;
  const naoLidas = d ? d.mensagens.filter((m) => m.remetente === 'aluno' && !m.lida).length : 0;
  const semTreino = d ? ativos.filter((a) => !d.treinos.some((t) => t.alunoId === a.id && t.ativo)).length : 0;
  const aniversariantes = d ? aniversariantesDoMes(d.alunos) : [];
  const treinosConcluidosNoMes = dashboard ? dashboard.treinoStatusPorAluno.reduce((s, t) => s + t.treinosNoMes, 0) : 0;
  const desafiosAtivos = desafios.filter((ds) => {
    const hoje = new Date().toISOString().slice(0, 10);
    return hoje >= ds.dataInicio && hoje <= ds.dataFim;
  });

  return (
    <div>
      <Link to="/">&larr; Início</Link>
      <h1>Treino</h1>
      <p className="subtitle">Alunos, treinos, dieta e mensagens.</p>

      {erro && <div className="error-msg">{erro}</div>}
      {!d && !erro && <p className="empty">Carregando…</p>}

      {d && (
        <>
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

          <h2>Avaliação e resultado</h2>
          <div className="modulos">
            <Modulo para="/alunos" icone="avaliacoes" nome="Avaliações" oQueE="Dobras, medidas, anamnese e fotos — abre na ficha do aluno" />
            <Modulo
              para="/resumo"
              icone="resumo"
              nome="Resumo do mês"
              oQueE="Treinos concluídos, feedback de cada aluno"
              contagem={dashboard ? treinosConcluidosNoMes : null}
            />
          </div>

          <h2>Desafios e PlayFlix</h2>
          <div className="modulos">
            <Modulo
              para="/desafios"
              icone="desafios"
              nome="Desafios"
              oQueE="Desafios de treino ou dieta, com prazo"
              contagem={desafiosAtivos.length || null}
            />
            <Modulo
              para="/conteudos"
              icone="conteudos"
              nome="PlayFlix"
              oQueE="Vídeos exclusivos para quem tem pacote ativo"
              contagem={d.conteudos.length || null}
            />
          </div>

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
            <Modulo para="/exercicios" icone="exercicios" nome="Exercícios" oQueE="Catálogo com vídeo de execução" contagem={d.exercicios.length} />
          </div>

          <div className="card portais">
            <div className="row portais-topo">
              <span className="modulo-ic">
                <Icone d={DESENHOS.portal} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="name">Portal do aluno</div>
                <div className="meta">
                  Cada um tem um endereço próprio e uma senha. Mande pelo WhatsApp e ele abre no
                  celular — vê o treino do dia, a foto do aparelho e a evolução.
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
