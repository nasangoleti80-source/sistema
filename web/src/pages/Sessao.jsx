import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, GRUPOS_MUSCULARES, duracaoEstimada, volumeSessao } from '../api.js';

const ITEM_VAZIO = { series: 3, reps: '12', descanso: 60, rir: 3, observacao: '' };

/** Uma sessão: a lista de exercícios com séries, reps, descanso e RIR. */
export default function Sessao() {
  const { treinoId, sessaoId } = useParams();
  const [treino, setTreino] = useState(null);
  const [exercicios, setExercicios] = useState([]);
  const [erro, setErro] = useState('');
  const [editando, setEditando] = useState(null); // item em edição
  const [form, setForm] = useState(ITEM_VAZIO);
  const [adicionando, setAdicionando] = useState(false);
  const [busca, setBusca] = useState('');

  async function carregar() {
    try {
      const [t, e] = await Promise.all([api.obterTreino(treinoId), api.listarExercicios()]);
      setTreino(t);
      setExercicios(e);
    } catch (e) {
      setErro(e.message);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treinoId, sessaoId]);

  async function acao(fn) {
    setErro('');
    try {
      await fn();
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function mover(item, direcao) {
    const ids = sessao.itens.map((i) => i.id);
    const de = ids.indexOf(item.id);
    const para = de + direcao;
    if (para < 0 || para >= ids.length) return;
    [ids[de], ids[para]] = [ids[para], ids[de]];
    await acao(() => api.reordenarItens(treinoId, sessaoId, ids));
  }

  function abrirEdicao(item) {
    setEditando(item);
    setForm({
      series: item.series,
      reps: item.reps,
      descanso: item.descanso,
      rir: item.rir ?? '',
      observacao: item.observacao || '',
    });
  }

  if (erro && !treino) return <div className="error-msg">{erro}</div>;
  if (!treino) return <p className="empty">Carregando…</p>;

  const sessao = treino.sessoes.find((s) => s.id === sessaoId);
  if (!sessao) return <p className="empty">Sessão não encontrada.</p>;

  const porId = new Map(exercicios.map((e) => [e.id, e]));
  const volume = volumeSessao(sessao, exercicios);
  const maior = volume[0]?.[1] || 1;
  const totalSeries = volume.reduce((s, [, n]) => s + n, 0);

  const jaNaSessao = new Set(sessao.itens.map((i) => i.exercicioId));
  const termo = busca.trim().toLowerCase();
  const candidatos = exercicios.filter(
    (e) => !jaNaSessao.has(e.id) && (!termo || e.nome.toLowerCase().includes(termo))
  );

  return (
    <div>
      <Link to={`/treinos/programa/${treinoId}`} className="voltar">
        ‹ {treino.nome}
      </Link>
      <h1>
        <em>{sessao.nome}</em>
      </h1>
      <p className="subtitle">
        Sessão <span className="num">{sessao.letra}</span> ·{' '}
        <span className="num">{sessao.itens.length}</span> exercício(s)
        {sessao.itens.length > 0 && (
          <>
            {' · cerca de '}
            <span className="num">{duracaoEstimada(sessao)}</span> min
          </>
        )}
      </p>

      {erro && <div className="error-msg">{erro}</div>}

      {totalSeries > 0 && (
        <div className="card">
          <div className="row" style={{ marginBottom: 12 }}>
            <span className="meta">Volume desta sessão</span>
            <span className="badge sem-cobranca">{totalSeries} séries</span>
          </div>
          {volume.map(([grupo, series]) => (
            <div className="barra" key={grupo}>
              <span className="barra-nome">{GRUPOS_MUSCULARES[grupo] || grupo}</span>
              <span className="barra-trilho">
                <span className="barra-preenche" style={{ width: `${Math.round((series / maior) * 100)}%` }} />
              </span>
              <span className="barra-num num">{series}</span>
            </div>
          ))}
        </div>
      )}

      <h2>Exercícios</h2>

      {sessao.itens.length === 0 && (
        <p className="empty">Nenhum exercício nesta sessão. Adicione o primeiro abaixo.</p>
      )}

      {sessao.itens.map((item, i) => {
        const exercicio = porId.get(item.exercicioId);
        const capa = exercicio?.midia.find((m) => m.tipo === 'foto') || exercicio?.midia[0];
        return (
          <div className="card item-treino" key={item.id}>
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <span className="ordem">
                <button type="button" onClick={() => mover(item, -1)} disabled={i === 0} aria-label="Subir">
                  ▲
                </button>
                <span className="num">{i + 1}</span>
                <button
                  type="button"
                  onClick={() => mover(item, 1)}
                  disabled={i === sessao.itens.length - 1}
                  aria-label="Descer"
                >
                  ▼
                </button>
              </span>

              <span className="miniatura" style={{ width: 46, height: 46 }}>
                {capa ? (
                  <img src={`/midia/${capa.capa || capa.arquivo}`} alt="" loading="lazy" />
                ) : (
                  <span className="miniatura-vazia">sem foto</span>
                )}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="name">{exercicio?.nome || '(exercício removido)'}</div>
                <div className="meta">
                  {exercicio ? GRUPOS_MUSCULARES[exercicio.grupo] : '—'}
                  {item.observacao && ` · ${item.observacao}`}
                </div>
              </div>

              <button className="btn-secondary btn-small" onClick={() => abrirEdicao(item)}>
                Editar
              </button>
            </div>

            <div className="metricas">
              <div>
                <div className="valor num">{item.series}</div>
                <div className="rotulo">Séries</div>
              </div>
              <div>
                <div className="valor num">{item.reps}</div>
                <div className="rotulo">Reps</div>
              </div>
              <div>
                <div className="valor num">{item.descanso}s</div>
                <div className="rotulo">Descanso</div>
              </div>
              <div>
                <div className="valor num">{item.rir ?? '—'}</div>
                <div className="rotulo">RIR</div>
              </div>
            </div>
          </div>
        );
      })}

      <button className="btn-primary" style={{ width: '100%' }} onClick={() => setAdicionando(true)}>
        + Adicionar exercício
      </button>

      {/* --------------------------------------------- escolher exercício */}
      {adicionando && (
        <div className="modal-backdrop" onClick={() => setAdicionando(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>Adicionar exercício</h1>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar no seu catálogo…"
              autoFocus
            />

            {exercicios.length === 0 && (
              <p className="empty">
                Seu catálogo está vazio.{' '}
                <Link to="/exercicios" style={{ color: 'var(--azul-claro)' }}>
                  Cadastre um exercício
                </Link>{' '}
                primeiro.
              </p>
            )}

            {exercicios.length > 0 && candidatos.length === 0 && (
              <p className="empty">
                {termo ? `Nada encontrado para “${busca}”.` : 'Todos os exercícios já estão nesta sessão.'}
              </p>
            )}

            {candidatos.length > 0 && (
              <div className="card" style={{ marginTop: 12, maxHeight: '46vh', overflowY: 'auto' }}>
                {candidatos.map((e) => (
                  <button
                    type="button"
                    className="list-item link-limpo"
                    style={{ width: '100%', background: 'none', border: 'none', borderRadius: 0 }}
                    key={e.id}
                    onClick={() =>
                      acao(async () => {
                        await api.criarItem(treinoId, sessaoId, { exercicioId: e.id, ...ITEM_VAZIO });
                        setAdicionando(false);
                        setBusca('');
                      })
                    }
                  >
                    <div style={{ textAlign: 'left' }}>
                      <div className="name">{e.nome}</div>
                      <div className="meta">{GRUPOS_MUSCULARES[e.grupo]}</div>
                    </div>
                    <span className="chevron">+</span>
                  </button>
                ))}
              </div>
            )}

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setAdicionando(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------- séries, reps, descanso, RIR */}
      {editando && (
        <div className="modal-backdrop" onClick={() => setEditando(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>{porId.get(editando.exercicioId)?.nome || 'Exercício'}</h1>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                acao(async () => {
                  await api.atualizarItem(treinoId, sessaoId, editando.id, form);
                  setEditando(null);
                });
              }}
            >
              <div className="quatro">
                <div>
                  <label>Séries</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={form.series}
                    onChange={(e) => setForm({ ...form, series: e.target.value })}
                  />
                </div>
                <div>
                  <label>Reps</label>
                  <input
                    value={form.reps}
                    onChange={(e) => setForm({ ...form, reps: e.target.value })}
                    placeholder="12 ou 12-15"
                  />
                </div>
                <div>
                  <label>Descanso</label>
                  <input
                    type="number"
                    min="0"
                    max="600"
                    step="15"
                    value={form.descanso}
                    onChange={(e) => setForm({ ...form, descanso: e.target.value })}
                  />
                </div>
                <div>
                  <label>RIR</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={form.rir}
                    onChange={(e) => setForm({ ...form, rir: e.target.value })}
                    placeholder="—"
                  />
                </div>
              </div>

              <label>Observação para a aluna</label>
              <input
                value={form.observacao}
                onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                placeholder="Desce devagar, sem travar o joelho…"
              />

              <p className="dica">
                RIR é quantas repetições ela ainda conseguiria fazer no fim da série. RIR 3 é
                confortável, bom para quem está começando; RIR 0 é até falhar.
              </p>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Salvar
                </button>
                <button type="button" className="btn-secondary" onClick={() => setEditando(null)}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => {
                    if (confirm('Tirar este exercício da sessão?'))
                      acao(async () => {
                        await api.removerItem(treinoId, sessaoId, editando.id);
                        setEditando(null);
                      });
                  }}
                >
                  Remover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
