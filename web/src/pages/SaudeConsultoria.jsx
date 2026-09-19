import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatarData } from '../api.js';

/**
 * Saúde da consultoria — visão da semana de quem é acompanhado à distância.
 *
 * Em vez de um checklist pra marcar na mão (fácil de esquecer com o corre do
 * dia a dia), cada aluno ganha 4 sinais calculados sozinhos pelas datas:
 * vídeo recente, avaliação em dia, treino/dieta ajustado depois da última
 * avaliação, e pacote perto de vencer. Quem está tudo verde fica recolhido —
 * só quem precisa de alguma coisa aparece em destaque.
 */

const HOJE = new Date().toISOString().slice(0, 10);
const diasEntre = (de, ate) => Math.round((new Date(ate) - new Date(de)) / 86400000);

function SinalChip({ cor, icone, texto }) {
  return <span className={`sinal-chip sinal-${cor}`}>{icone} {texto}</span>;
}

export default function SaudeConsultoria() {
  const [alunos, setAlunos] = useState(null);
  const [pacotes, setPacotes] = useState([]);
  const [treinos, setTreinos] = useState([]);
  const [dietas, setDietas] = useState([]);
  const [mensagens, setMensagens] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [erro, setErro] = useState('');
  const [tipoConsultoria, setTipoConsultoria] = useState('online');
  const [editandoAvaliacao, setEditandoAvaliacao] = useState(null);

  useEffect(() => {
    Promise.all([
      api.listarAlunos(true),
      api.listarPacotes(),
      api.listarTreinos(),
      api.listarDietas(''),
      api.listarMensagens(''),
      api.listarAvaliacoes(),
    ])
      .then(([listaAlunos, listaPacotes, listaTreinos, listaDietas, listaMensagens, listaAvaliacoes]) => {
        setAlunos(listaAlunos);
        setPacotes(listaPacotes);
        setTreinos(listaTreinos);
        setDietas(listaDietas);
        setMensagens(listaMensagens);
        setAvaliacoes(listaAvaliacoes);
      })
      .catch((e) => setErro(e.message));
  }, []);

  const ehOnline = (tipo) => tipo?.startsWith('consultoria_online');
  const ehSemipresencial = (tipo) => tipo === 'consultoria_semipresencial';

  /** Um sinal: cor (verde/amarelo/vermelho) + o que mostrar. */
  function calcularSinais(aluno) {
    // Vídeo: última vez que o aluno mandou vídeo pelo chat.
    const videosDoAluno = mensagens
      .filter((m) => m.alunoId === aluno.id && m.remetente === 'aluno' && m.midia?.tipo === 'video')
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const diasSemVideo = videosDoAluno[0] ? diasEntre(videosDoAluno[0].createdAt, HOJE) : null;
    const video =
      diasSemVideo == null || diasSemVideo >= 14 ? 'vermelho' : diasSemVideo >= 8 ? 'amarelo' : 'verde';

    // Avaliação: cadência de 45 dias, com a data já calculada em Saúde da consultoria antiga.
    const diasProximaAvaliacao = aluno.proximaAvaliacaoData ? diasEntre(HOJE, aluno.proximaAvaliacaoData) : null;
    const avaliacao =
      diasProximaAvaliacao == null || diasProximaAvaliacao < 0
        ? 'vermelho'
        : diasProximaAvaliacao <= 7
        ? 'amarelo'
        : 'verde';

    // Treino/dieta ajustado depois da última avaliação feita (não a próxima, a que já rolou).
    const ultimaAvaliacaoFeita = avaliacoes
      .filter((a) => a.alunoId === aluno.id)
      .sort((a, b) => (a.data < b.data ? 1 : -1))[0];
    let treino = 'verde';
    if (ultimaAvaliacaoFeita) {
      const treinoAtivo = treinos
        .filter((t) => t.alunoId === aluno.id && t.ativo)
        .sort((a, b) => (a.atualizadoEm < b.atualizadoEm ? 1 : -1))[0];
      const dietaAtiva = dietas
        .filter((d) => d.alunoId === aluno.id && d.ativa)
        .sort((a, b) => (a.atualizadoEm < b.atualizadoEm ? 1 : -1))[0];
      const treinoOk = !treinoAtivo || treinoAtivo.atualizadoEm?.slice(0, 10) >= ultimaAvaliacaoFeita.data;
      const dietaOk = !dietaAtiva || dietaAtiva.atualizadoEm?.slice(0, 10) >= ultimaAvaliacaoFeita.data;
      if (!treinoOk || !dietaOk) {
        const diasDesdeAvaliacao = diasEntre(ultimaAvaliacaoFeita.data, HOJE);
        treino = diasDesdeAvaliacao >= 14 ? 'vermelho' : 'amarelo';
      }
    }

    // Pacote: quantos dias faltam pro vencimento do pacote em aberto.
    const pacote = pacotes
      .filter((p) => p.alunoId === aluno.id)
      .sort((a, b) => (a.dataVencimento < b.dataVencimento ? -1 : 1))
      .find((p) => p.status !== 'pago') || null;
    const diasPacote = pacote ? diasEntre(HOJE, pacote.dataVencimento) : null;
    const pacoteSinal = diasPacote == null ? 'verde' : diasPacote < 0 ? 'vermelho' : diasPacote <= 14 ? 'amarelo' : 'verde';

    return {
      video: { cor: video, diasSemVideo },
      avaliacao: { cor: avaliacao, diasProximaAvaliacao },
      treino: { cor: treino, ultimaAvaliacaoFeita },
      pacote: { cor: pacoteSinal, pacote, diasPacote },
    };
  }

  async function salvarProximaAvaliacao(alunoId, novaData) {
    const atualizado = await api.atualizarAluno(alunoId, { proximaAvaliacaoData: novaData || null });
    setAlunos((prev) => prev.map((a) => (a.id === alunoId ? atualizado : a)));
    setEditandoAvaliacao(null);
  }

  const todosConsultoria = alunos ? alunos.filter((a) => ehOnline(a.tipo) || ehSemipresencial(a.tipo)) : [];
  const daLista = todosConsultoria
    .filter((a) => (tipoConsultoria === 'online' ? ehOnline(a.tipo) : ehSemipresencial(a.tipo)))
    .map((aluno) => ({ aluno, sinais: calcularSinais(aluno) }))
    .map((x) => ({
      ...x,
      precisaAtencao: Object.values(x.sinais).some((s) => s.cor !== 'verde'),
      pior: Object.values(x.sinais).filter((s) => s.cor === 'vermelho').length,
    }))
    .sort((a, b) => b.pior - a.pior || (b.precisaAtencao ? 1 : 0) - (a.precisaAtencao ? 1 : 0));

  const precisamAtencao = daLista.filter((x) => x.precisaAtencao);
  const tudoEmDia = daLista.filter((x) => !x.precisaAtencao);

  return (
    <div>
      <h1>Saúde da consultoria</h1>
      <p className="subtitle">Sua visão da semana — quem precisa de você agora.</p>

      {erro && <div className="error-msg">{erro}</div>}
      {!alunos && !erro && <p className="empty">Carregando…</p>}

      {alunos && (
        <div className="card">
          <div className="row" style={{ gap: 6, marginBottom: 14 }}>
            <button
              type="button"
              className={tipoConsultoria === 'online' ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
              onClick={() => setTipoConsultoria('online')}
            >
              Online
            </button>
            <button
              type="button"
              className={tipoConsultoria === 'semipresencial' ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
              onClick={() => setTipoConsultoria('semipresencial')}
            >
              Semipresencial
            </button>
          </div>

          {daLista.length === 0 && (
            <p className="empty">Nenhum aluno {tipoConsultoria === 'online' ? 'de consultoria online' : 'semipresencial'} ativo.</p>
          )}

          {precisamAtencao.map(({ aluno, sinais }) => (
            <div className="card-aluno-consultoria" key={aluno.id}>
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <Link to={`/alunos/${aluno.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}>
                  <div className="name">{aluno.nome}</div>
                </Link>
                <Link to={`/mensagens?alunoId=${aluno.id}`} className="btn-secondary btn-small link-botao">Chamar</Link>
              </div>

              <div className="row" style={{ marginTop: 8, gap: 6, flexWrap: 'wrap' }}>
                <SinalChip
                  cor={sinais.video.cor}
                  icone="🎥"
                  texto={sinais.video.diasSemVideo == null ? 'nunca mandou vídeo' : `vídeo há ${sinais.video.diasSemVideo}d`}
                />
                <SinalChip
                  cor={sinais.avaliacao.cor}
                  icone="📋"
                  texto={
                    aluno.proximaAvaliacaoData
                      ? sinais.avaliacao.diasProximaAvaliacao < 0
                        ? `avaliação atrasada ${-sinais.avaliacao.diasProximaAvaliacao}d`
                        : `avaliação em ${sinais.avaliacao.diasProximaAvaliacao}d`
                      : 'avaliação não agendada'
                  }
                />
                <SinalChip
                  cor={sinais.treino.cor}
                  icone="🔄"
                  texto={sinais.treino.cor === 'verde' ? 'treino/dieta em dia' : 'ajustar treino/dieta pós-avaliação'}
                />
                <SinalChip
                  cor={sinais.pacote.cor}
                  icone="💳"
                  texto={
                    sinais.pacote.pacote
                      ? sinais.pacote.diasPacote < 0
                        ? `pacote vencido ${-sinais.pacote.diasPacote}d`
                        : `pacote vence em ${sinais.pacote.diasPacote}d`
                      : 'sem pacote em aberto'
                  }
                />
              </div>

              <div className="row" style={{ marginTop: 8, gap: 8, flexWrap: 'wrap' }}>
                <span className="meta">
                  Próxima avaliação: {aluno.proximaAvaliacaoData ? formatarData(aluno.proximaAvaliacaoData) : 'não agendada'}
                </span>
                {editandoAvaliacao === aluno.id ? (
                  <input
                    type="date"
                    autoFocus
                    defaultValue={aluno.proximaAvaliacaoData || ''}
                    onBlur={(e) => salvarProximaAvaliacao(aluno.id, e.target.value)}
                    style={{ padding: '2px 6px', fontSize: 12 }}
                  />
                ) : (
                  <button type="button" className="link-editar" onClick={() => setEditandoAvaliacao(aluno.id)}>editar</button>
                )}
              </div>
            </div>
          ))}

          {tudoEmDia.length > 0 && (
            <div style={{ marginTop: precisamAtencao.length ? 14 : 0 }}>
              {precisamAtencao.length > 0 && <div className="meta" style={{ marginBottom: 8 }}>Tudo em dia:</div>}
              {tudoEmDia.map(({ aluno }) => (
                <Link
                  to={`/alunos/${aluno.id}`}
                  key={aluno.id}
                  className="list-item"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="name">✅ {aluno.nome}</div>
                  <span className="meta">tudo em dia</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
