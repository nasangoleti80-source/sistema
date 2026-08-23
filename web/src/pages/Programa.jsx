import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, DIAS_SEMANA, GRUPOS_MUSCULARES, duracaoEstimada, volumeSemanal } from '../api.js';

/** Um treino: suas sessões, os dias de cada uma e o volume da semana. */
export default function Programa() {
  const { treinoId } = useParams();
  const navegar = useNavigate();
  const [treino, setTreino] = useState(null);
  const [exercicios, setExercicios] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [erro, setErro] = useState('');
  const [renomeando, setRenomeando] = useState(false);
  const [nome, setNome] = useState('');

  async function carregar() {
    try {
      const [t, e, a] = await Promise.all([
        api.obterTreino(treinoId),
        api.listarExercicios(),
        api.listarAlunos(),
      ]);
      setTreino(t);
      setNome(t.nome);
      setExercicios(e);
      setAlunos(a);
    } catch (e) {
      setErro(e.message);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treinoId]);

  async function acao(fn) {
    setErro('');
    try {
      await fn();
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function alternarDia(sessao, dia) {
    const dias = sessao.dias.includes(dia)
      ? sessao.dias.filter((d) => d !== dia)
      : [...sessao.dias, dia];
    await acao(() => api.atualizarSessao(treino.id, sessao.id, { dias }));
  }

  async function excluirTreino() {
    if (!confirm(`Excluir "${treino.nome}"? As sessões e os exercícios dele vão junto.`)) return;
    await api.removerTreino(treino.id);
    navegar(`/treinos/${treino.alunoId}`);
  }

  if (erro && !treino) return <div className="error-msg">{erro}</div>;
  if (!treino) return <p className="empty">Carregando…</p>;

  const aluno = alunos.find((a) => a.id === treino.alunoId);
  const volume = volumeSemanal(treino, exercicios);
  const maiorVolume = volume[0]?.[1] || 1;
  const totalSeries = volume.reduce((s, [, n]) => s + n, 0);

  return (
    <div>
      <Link to={`/treinos/${treino.alunoId}`} className="voltar">
        ‹ {aluno?.nome || 'Treinos'}
      </Link>

      {renomeando ? (
        <form
          className="row"
          style={{ marginBottom: 16 }}
          onSubmit={(e) => {
            e.preventDefault();
            acao(() => api.atualizarTreino(treino.id, { nome })).then(() => setRenomeando(false));
          }}
        >
          <input value={nome} onChange={(e) => setNome(e.target.value)} required style={{ flex: 1 }} />
          <button type="submit" className="btn-primary btn-small">
            Salvar
          </button>
        </form>
      ) : (
        <h1 onClick={() => setRenomeando(true)} style={{ cursor: 'pointer' }}>
          {treino.nome}
        </h1>
      )}

      <p className="subtitle">
        Toque no nome para renomear. Os dias marcados são quando a aluna faz aquela sessão.
      </p>

      {erro && <div className="error-msg">{erro}</div>}

      <div className="row" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <button
          className="btn-secondary btn-small"
          onClick={() => acao(() => api.atualizarTreino(treino.id, { ativo: !treino.ativo }))}
        >
          {treino.ativo ? 'Guardar' : 'Reativar'}
        </button>
        <button
          className="btn-secondary btn-small"
          onClick={() =>
            acao(async () => {
              const copia = await api.duplicarTreino(treino.id);
              navegar(`/treinos/programa/${copia.id}`);
            })
          }
        >
          Duplicar
        </button>
        <button className="btn-danger btn-small" onClick={excluirTreino} style={{ marginLeft: 'auto' }}>
          Excluir
        </button>
      </div>

      {/* ------------------------------------------------ volume da semana */}
      {totalSeries > 0 && (
        <>
          <h2>Volume da semana</h2>
          <div className="card">
            <div className="row" style={{ marginBottom: 12 }}>
              <span className="meta">Séries por grupo, já contando os dias</span>
              <span className="badge sem-cobranca">{totalSeries} séries</span>
            </div>
            {volume.map(([grupo, series]) => (
              <div className="barra" key={grupo}>
                <span className="barra-nome">{GRUPOS_MUSCULARES[grupo] || grupo}</span>
                <span className="barra-trilho">
                  <span
                    className={`barra-preenche ${series < 10 ? 'baixo' : ''}`}
                    style={{ width: `${Math.round((series / maiorVolume) * 100)}%` }}
                  />
                </span>
                <span className="barra-num num">{series}</span>
              </div>
            ))}
            <p className="dica" style={{ marginTop: 12 }}>
              Referência usual para hipertrofia: 10 a 20 séries por grupo na semana. Abaixo de 10
              costuma ser pouco estímulo — as barras em cinza estão nessa faixa.
            </p>
          </div>
        </>
      )}

      {/* ----------------------------------------------------- as sessões */}
      <h2>Sessões</h2>

      {treino.sessoes.length === 0 && (
        <p className="empty">
          Nenhuma sessão ainda. Uma sessão é um dia de treino — A, B, C.
        </p>
      )}

      {treino.sessoes.map((sessao) => (
        <div className="card sessao" key={sessao.id}>
          <div className="row">
            <span className="letra">{sessao.letra}</span>
            <Link to={`/treinos/programa/${treino.id}/sessao/${sessao.id}`} className="link-limpo" style={{ flex: 1 }}>
              <div className="name">{sessao.nome}</div>
              <div className="meta">
                <span className="num">{sessao.itens.length}</span> exercício(s)
                {sessao.itens.length > 0 && (
                  <>
                    {' · ~'}
                    <span className="num">{duracaoEstimada(sessao)}</span> min
                  </>
                )}
              </div>
            </Link>
            <button
              className="btn-danger btn-small"
              onClick={() => {
                if (confirm(`Excluir a sessão "${sessao.nome}"?`))
                  acao(() => api.removerSessao(treino.id, sessao.id));
              }}
            >
              ✕
            </button>
          </div>

          <div className="dias">
            <span className="dias-rotulo">Dias</span>
            {DIAS_SEMANA.map((d) => (
              <button
                key={d.valor}
                type="button"
                title={d.nome}
                aria-label={d.nome}
                aria-pressed={sessao.dias.includes(d.valor)}
                className={`dia ${sessao.dias.includes(d.valor) ? 'on' : ''}`}
                onClick={() => alternarDia(sessao, d.valor)}
              >
                {d.letra}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button
        className="btn-secondary"
        style={{ width: '100%' }}
        onClick={() => acao(() => api.criarSessao(treino.id, {}))}
      >
        + Nova sessão
      </button>
    </div>
  );
}
