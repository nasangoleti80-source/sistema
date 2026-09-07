import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  api, GRUPOS_MUSCULARES, METODOS_TREINO, FAIXA_HIPERTROFIA, formatarData,
  indexarCatalogo, acharNoCatalogo, capaDoExercicio, volumeDoDia, duracaoEstimadaDia,
} from '../api.js';
import TimerDescanso from '../components/TimerDescanso.jsx';
import ModalExercicioTreino from '../components/ModalExercicioTreino.jsx';

export default function TreinoSessaoDetalhe() {
  const { treinoId, letra } = useParams();
  const [treino, setTreino] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [catalogo, setCatalogo] = useState(() => new Map());
  const [historico, setHistorico] = useState({});
  const [reordenando, setReordenando] = useState(false);
  const [modoCircuito, setModoCircuito] = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const [modalExercicio, setModalExercicio] = useState(null); // { indice } ou 'novo'

  async function carregar() {
    setCarregando(true);
    try {
      setTreino(await api.obterTreino(treinoId));
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, [treinoId]);
  useEffect(() => {
    api.listarExercicios().then((lista) => setCatalogo(indexarCatalogo(lista)));
  }, []);

  const dia = treino?.dias?.find((d) => d.letra === letra);

  async function salvarExercicios(novosExercicios) {
    const novosDias = treino.dias.map((d) => (d.letra === letra ? { ...d, exercicios: novosExercicios } : d));
    const atualizado = await api.atualizarTreino(treinoId, { dias: novosDias });
    setTreino(atualizado);
  }

  function moverExercicio(indice, direcao) {
    const exercicios = [...dia.exercicios];
    const alvo = indice + direcao;
    if (alvo < 0 || alvo >= exercicios.length) return;
    [exercicios[indice], exercicios[alvo]] = [exercicios[alvo], exercicios[indice]];
    salvarExercicios(exercicios);
  }

  function removerExercicio(indice) {
    if (!confirm('Remover este exercício da sessão?')) return;
    salvarExercicios(dia.exercicios.filter((_, i) => i !== indice));
  }

  function salvarExercicioModal(dados) {
    if (modalExercicio === 'novo') {
      salvarExercicios([...(dia.exercicios || []), dados]);
    } else {
      salvarExercicios(dia.exercicios.map((ex, i) => (i === modalExercicio.indice ? dados : ex)));
    }
    setModalExercicio(null);
  }

  async function verHistorico(nomeExercicio) {
    const dados = await api.historicoCarga(treino.alunoId, nomeExercicio);
    setHistorico((h) => ({ ...h, [nomeExercicio]: dados }));
  }

  function alternarSelecao(indice) {
    setSelecionados((s) => (s.includes(indice) ? s.filter((i) => i !== indice) : [...s, indice]));
  }

  function confirmarCircuito() {
    if (selecionados.length < 2) {
      setModoCircuito(false);
      setSelecionados([]);
      return;
    }
    const numeroCircuito = 1 + Math.max(0, ...dia.exercicios.map((e) => e.circuito || 0));
    const exercicios = dia.exercicios.map((ex, i) => (selecionados.includes(i) ? { ...ex, circuito: numeroCircuito } : ex));
    salvarExercicios(exercicios);
    setModoCircuito(false);
    setSelecionados([]);
  }

  function removerDoCircuito(indice) {
    const exercicios = dia.exercicios.map((ex, i) => (i === indice ? { ...ex, circuito: null } : ex));
    salvarExercicios(exercicios);
  }

  if (carregando) return <p className="empty">Carregando...</p>;
  if (erro) return <p className="empty">{erro}</p>;
  if (!treino || !dia) return <p className="empty">Sessão não encontrada.</p>;

  const volume = volumeDoDia(dia);
  const maiorVolume = volume[0]?.[1] || 1;
  const totalSeries = volume.reduce((s, [, n]) => s + n, 0);
  const duracaoMin = duracaoEstimadaDia(dia);

  return (
    <div>
      <Link to={`/treinos/${treinoId}`}>&larr; {treino.nome}</Link>
      <h1>{dia.letra} — {dia.nome}</h1>
      <p className="subtitle">🏋️ {(dia.exercicios || []).length} exercícios · 🕐 ~{duracaoMin} min</p>

      {volume.length > 0 && (
        <div className="card volume-treino">
          <div className="row" style={{ marginBottom: 10 }}>
            <span className="meta">Volume da sessão</span>
            <span className="badge sem-cobranca">{totalSeries} séries</span>
          </div>
          {volume.map(([grupo, series]) => (
            <div className="barra" key={grupo}>
              <span className="barra-nome">{GRUPOS_MUSCULARES[grupo] || grupo}</span>
              <span className="barra-trilho">
                <span
                  className={`barra-preenche ${series < FAIXA_HIPERTROFIA.minimo ? 'baixo' : ''}`}
                  style={{ width: `${Math.round((series / maiorVolume) * 100)}%` }}
                />
              </span>
              <span className="barra-num num">{series}</span>
            </div>
          ))}
        </div>
      )}

      <div className="row" style={{ marginTop: 16, marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Lista de exercícios</h2>
        <button
          type="button"
          className={reordenando ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
          onClick={() => setReordenando((v) => !v)}
        >
          {reordenando ? 'Concluir' : '≡ Reordenar'}
        </button>
      </div>

      {(dia.exercicios || []).length === 0 && <p className="empty">Nenhum exercício nesta sessão ainda.</p>}

      {(dia.exercicios || []).map((ex, i) => {
        const doCatalogo = acharNoCatalogo(catalogo, ex.nome);
        const capa = capaDoExercicio(doCatalogo);
        return (
          <div className="card exercicio-card" key={i}>
            <div className="row" style={{ alignItems: 'flex-start' }}>
              {modoCircuito ? (
                <input type="checkbox" checked={selecionados.includes(i)} onChange={() => alternarSelecao(i)} style={{ width: 'auto', marginTop: 4 }} />
              ) : (
                <span className="numero-exercicio">{i + 1}</span>
              )}
              <span className="miniatura" style={{ width: 40, height: 40 }}>
                {capa ? <img src={capa} alt="" loading="lazy" /> : <span className="miniatura-vazia">sem foto</span>}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="name">
                  {ex.circuito && <span className="badge pendente" style={{ marginRight: 6 }}>Circuito {ex.circuito}</span>}
                  {ex.nome}
                </div>
              </div>
              {reordenando ? (
                <div className="mover-sessao">
                  <button type="button" onClick={() => moverExercicio(i, -1)} disabled={i === 0}>▲</button>
                  <button type="button" onClick={() => moverExercicio(i, 1)} disabled={i === dia.exercicios.length - 1}>▼</button>
                </div>
              ) : (
                <div className="row" style={{ width: 'auto', gap: 4 }}>
                  <button type="button" className="btn-secondary btn-small" onClick={() => setModalExercicio({ indice: i })} title="Editar">✎</button>
                  <button type="button" className="btn-danger btn-small" onClick={() => removerExercicio(i)} title="Remover">🗑</button>
                </div>
              )}
            </div>

            <div className="stats-exercicio">
              <div><span className="stats-valor">{ex.series}</span><span className="stats-rotulo">SÉRIES</span></div>
              <div><span className="stats-valor">{ex.repeticoes}</span><span className="stats-rotulo">REPS</span></div>
              <div><span className="stats-valor">{ex.descansoSeg}s</span><span className="stats-rotulo">DESCANSO</span></div>
              <div><span className="stats-valor">{ex.rir ?? '—'}</span><span className="stats-rotulo">RIR</span></div>
            </div>

            {ex.metodo && ex.metodo !== 'convencional' && (
              <div className="meta">Método: <strong>{METODOS_TREINO[ex.metodo] || ex.metodo}</strong></div>
            )}
            {ex.cargaAlvoKg ? <div className="meta">Carga alvo: {ex.cargaAlvoKg}kg</div> : null}
            {ex.circuito && (
              <button type="button" className="btn-secondary btn-small" style={{ marginTop: 6 }} onClick={() => removerDoCircuito(i)}>
                Tirar do circuito
              </button>
            )}
            {doCatalogo?.ondeFica && <div className="onde-fica">Onde fica: {doCatalogo.ondeFica}</div>}
            {!doCatalogo && <div className="meta fora-catalogo">Fora do catálogo — a aluna não vê foto nem vídeo deste.</div>}
            {ex.observacao && <div className="meta">{ex.observacao}</div>}

            <TimerDescanso segundos={ex.descansoSeg || 60} />

            <button type="button" className="btn-secondary btn-small" style={{ marginTop: 6 }} onClick={() => verHistorico(ex.nome)}>
              Carga anterior
            </button>
            {historico[ex.nome] && (
              <div className="meta" style={{ marginTop: 4 }}>
                {historico[ex.nome].length === 0
                  ? 'Sem histórico ainda.'
                  : historico[ex.nome].slice(-3).map((h, k) => (
                      <div key={k}>{formatarData(h.data)}: {h.series.map((s) => `${s.peso}kg x${s.repeticoes}`).join(', ')}</div>
                    ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="row" style={{ gap: 8, marginTop: 12 }}>
        <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setModalExercicio('novo')}>
          + Exercício
        </button>
        {!modoCircuito ? (
          <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setModoCircuito(true)} disabled={(dia.exercicios || []).length < 2}>
            🔁 Circuito
          </button>
        ) : (
          <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={confirmarCircuito}>
            Agrupar ({selecionados.length})
          </button>
        )}
      </div>

      {modalExercicio && (
        <ModalExercicioTreino
          exercicio={modalExercicio === 'novo' ? null : dia.exercicios[modalExercicio.indice]}
          onSalvar={salvarExercicioModal}
          onClose={() => setModalExercicio(null)}
        />
      )}
    </div>
  );
}
