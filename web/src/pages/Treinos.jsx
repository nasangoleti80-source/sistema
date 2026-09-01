import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  api, OBJETIVOS_TREINO, TIPOS_PERIODIZACAO, NIVEIS_ALUNO, DIVISOES_TREINO,
  DURACOES_SESSAO, SEMANAS_MESOCICLO, MODALIDADES_TREINO, OPCOES_AEROBIO,
  GRUPOS_MUSCULARES, METODOS_TREINO, INTENSIDADES_TREINO, formatarData,
  indexarCatalogo, acharNoCatalogo, capaDoExercicio, volumeDoTreino, FAIXA_HIPERTROFIA,
} from '../api.js';
import TimerDescanso from '../components/TimerDescanso.jsx';

const CONFIG_VAZIA = {
  objetivo: 'hipertrofia',
  tipoPeriodizacao: 'linear',
  nivel: 'intermediario',
  diasPorSemana: 3,
  divisao: 'ABC',
  duracaoSessaoMin: 60,
  semanasMesociclo: 4,
  modalidade: 'musculacao',
  aerobio: 'automatico',
  enfaseMuscular: [],
};

export default function Treinos() {
  const [searchParams] = useSearchParams();
  const [alunos, setAlunos] = useState([]);
  const [alunoId, setAlunoId] = useState('');
  const [treinos, setTreinos] = useState([]);
  const [expandido, setExpandido] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [gerando, setGerando] = useState(false);
  const [modalIA, setModalIA] = useState(false);
  const [config, setConfig] = useState(CONFIG_VAZIA);
  const [modalRegistro, setModalRegistro] = useState(null);
  const [historico, setHistorico] = useState({});
  const [catalogo, setCatalogo] = useState(() => new Map());

  useEffect(() => {
    // Catálogo: dá foto, vídeo e a dica de onde o aparelho fica a cada exercício.
    api.listarExercicios().then((lista) => setCatalogo(indexarCatalogo(lista)));
  }, []);

  useEffect(() => {
    api.listarAlunos(true).then((lista) => {
      setAlunos(lista);
      if (lista.length && !alunoId) setAlunoId(searchParams.get('alunoId') || lista[0].id);
    });
  }, []);

  async function carregarTreinos(id) {
    setCarregando(true);
    try {
      setTreinos(await api.listarTreinos(id));
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (alunoId) carregarTreinos(alunoId);
  }, [alunoId]);

  function alternarEnfase(grupo) {
    setConfig((c) => {
      const atual = c.enfaseMuscular;
      if (atual.includes(grupo)) return { ...c, enfaseMuscular: atual.filter((g) => g !== grupo) };
      if (atual.length >= 3) return c;
      return { ...c, enfaseMuscular: [...atual, grupo] };
    });
  }

  async function gerarComIA(e) {
    e.preventDefault();
    setErro('');
    setGerando(true);
    try {
      await api.gerarTreinoIA({ alunoId, configuracao: config });
      setModalIA(false);
      setConfig(CONFIG_VAZIA);
      await carregarTreinos(alunoId);
    } catch (e) {
      setErro(e.message);
    } finally {
      setGerando(false);
    }
  }

  async function excluir(treino) {
    if (!confirm(`Excluir o treino "${treino.nome}"?`)) return;
    await api.removerTreino(treino.id);
    await carregarTreinos(alunoId);
  }

  async function verHistorico(nomeExercicio) {
    const dados = await api.historicoCarga(alunoId, nomeExercicio);
    setHistorico((h) => ({ ...h, [nomeExercicio]: dados }));
  }

  return (
    <div>
      <h1>Treinos</h1>
      <p className="subtitle">Montagem de treino de musculação, com volume, carga e métodos avançados</p>

      <div className="row" style={{ marginBottom: 12, gap: 8 }}>
        <select value={alunoId} onChange={(e) => setAlunoId(e.target.value)}>
          {alunos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
        <button className="btn-primary" onClick={() => setModalIA(true)} disabled={!alunoId}>✨ Montar com IA</button>
      </div>

      {erro && <div className="error-msg">{erro}</div>}
      {carregando && <p className="empty">Carregando...</p>}
      {!carregando && treinos.length === 0 && <p className="empty">Nenhum treino cadastrado para este aluno.</p>}

      {treinos.map((t) => (
        <div className="card" key={t.id}>
          <div className="row">
            <div>
              <div className="name">{t.nome} {t.geradoPorIA && <span className="badge pago">IA</span>} {!t.ativo && <span className="badge sem-cobranca">inativo</span>}</div>
              <div className="meta">
                {OBJETIVOS_TREINO[t.configuracao?.objetivo]} · {TIPOS_PERIODIZACAO[t.configuracao?.tipoPeriodizacao]} ·{' '}
                {NIVEIS_ALUNO[t.configuracao?.nivel]} · {t.configuracao?.diasPorSemana}x/semana · {DIVISOES_TREINO[t.configuracao?.divisao]} ·{' '}
                {t.configuracao?.duracaoSessaoMin}min · mesociclo {t.configuracao?.semanasMesociclo} semanas
              </div>
            </div>
            <button className="btn-secondary btn-small" onClick={() => setExpandido(expandido === t.id ? null : t.id)}>
              {expandido === t.id ? 'Fechar' : 'Ver treino'}
            </button>
          </div>

          {/* Séries por grupo no treino inteiro: mostra se está equilibrado. */}
          {expandido === t.id && volumeDoTreino(t).length > 0 && (() => {
            const volume = volumeDoTreino(t);
            const maior = volume[0][1];
            const total = volume.reduce((soma, [, n]) => soma + n, 0);
            return (
              <div className="card volume-treino">
                <div className="row" style={{ marginBottom: 10 }}>
                  <span className="meta">Séries por grupo neste treino</span>
                  <span className="badge sem-cobranca">{total} séries</span>
                </div>
                {volume.map(([grupo, series]) => (
                  <div className="barra" key={grupo}>
                    <span className="barra-nome">{GRUPOS_MUSCULARES[grupo] || grupo}</span>
                    <span className="barra-trilho">
                      <span
                        className={`barra-preenche ${series < FAIXA_HIPERTROFIA.minimo ? 'baixo' : ''}`}
                        style={{ width: `${Math.round((series / maior) * 100)}%` }}
                      />
                    </span>
                    <span className="barra-num num">{series}</span>
                  </div>
                ))}
                <p className="dica" style={{ marginTop: 10 }}>
                  Referência para hipertrofia: {FAIXA_HIPERTROFIA.minimo} a {FAIXA_HIPERTROFIA.maximo} séries
                  por grupo na semana. As barras em cinza estão abaixo disso.
                </p>
              </div>
            );
          })()}

          {expandido === t.id && (
            <div style={{ marginTop: 12 }}>
              {t.orientacoesGerais && <p className="meta">{t.orientacoesGerais}</p>}
              {(t.dias || []).map((dia, i) => (
                <div key={i} className="card" style={{ background: 'var(--bg)' }}>
                  <div className="name">Treino {dia.letra} — {dia.nome}</div>
                  {(dia.exercicios || []).map((ex, j) => {
                    const doCatalogo = acharNoCatalogo(catalogo, ex.nome);
                    const capa = capaDoExercicio(doCatalogo);
                    return (
                    <div key={j} className="list-item" style={{ display: 'block' }}>
                      <div className="row">
                        <span className="miniatura" style={{ width: 40, height: 40 }}>
                          {capa ? <img src={capa} alt="" loading="lazy" />
                                : <span className="miniatura-vazia">sem foto</span>}
                        </span>
                        <div className="name" style={{ flex: 1, minWidth: 0 }}>{ex.nome}</div>
                        <button type="button" className="btn-secondary btn-small" onClick={() => verHistorico(ex.nome)}>
                          Carga anterior
                        </button>
                      </div>
                      <div className="meta">
                        {ex.series}x{ex.repeticoes} · descanso {ex.descansoSeg}s
                        {ex.metodo && ex.metodo !== 'convencional' && <> · <strong>{METODOS_TREINO[ex.metodo] || ex.metodo}</strong></>}
                        {ex.cargaAlvoKg ? ` · carga alvo ${ex.cargaAlvoKg}kg` : ''}
                      </div>
                      {doCatalogo?.ondeFica && (
                        <div className="onde-fica">Onde fica: {doCatalogo.ondeFica}</div>
                      )}
                      {!doCatalogo && (
                        <div className="meta fora-catalogo">
                          Fora do catálogo — a aluna não vê foto nem vídeo deste.
                        </div>
                      )}
                      {ex.observacao && <div className="meta">{ex.observacao}</div>}
                      <TimerDescanso segundos={ex.descansoSeg || 60} />
                      {historico[ex.nome] && (
                        <div className="meta" style={{ marginTop: 4 }}>
                          {historico[ex.nome].length === 0
                            ? 'Sem histórico ainda.'
                            : historico[ex.nome].slice(-3).map((h, k) => (
                                <div key={k}>
                                  {formatarData(h.data)}: {h.series.map((s) => `${s.peso}kg x${s.repeticoes}`).join(', ')}
                                </div>
                              ))}
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              ))}
              <button className="btn-primary btn-small" onClick={() => setModalRegistro(t)}>Registrar treino executado</button>
              <button className="btn-danger btn-small" style={{ marginLeft: 8 }} onClick={() => excluir(t)}>Excluir treino</button>
            </div>
          )}
        </div>
      ))}

      {modalIA && (
        <div className="modal-backdrop" onClick={() => !gerando && setModalIA(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>Montar treino com IA</h1>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={gerarComIA}>
              <label>Objetivo</label>
              <select value={config.objetivo} onChange={(e) => setConfig({ ...config, objetivo: e.target.value })}>
                {Object.entries(OBJETIVOS_TREINO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>

              <label>Tipo de periodização</label>
              <select value={config.tipoPeriodizacao} onChange={(e) => setConfig({ ...config, tipoPeriodizacao: e.target.value })}>
                {Object.entries(TIPOS_PERIODIZACAO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>

              <label>Nível do cliente</label>
              <select value={config.nivel} onChange={(e) => setConfig({ ...config, nivel: e.target.value })}>
                {Object.entries(NIVEIS_ALUNO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>

              <div className="row" style={{ gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label>Dias por semana</label>
                  <input type="number" min="1" max="7" value={config.diasPorSemana} onChange={(e) => setConfig({ ...config, diasPorSemana: Number(e.target.value) })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Divisão</label>
                  <select value={config.divisao} onChange={(e) => setConfig({ ...config, divisao: e.target.value })}>
                    {Object.entries(DIVISOES_TREINO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="row" style={{ gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label>Duração da sessão (min)</label>
                  <select value={config.duracaoSessaoMin} onChange={(e) => setConfig({ ...config, duracaoSessaoMin: Number(e.target.value) })}>
                    {DURACOES_SESSAO.map((d) => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label>Semanas do mesociclo</label>
                  <select value={config.semanasMesociclo} onChange={(e) => setConfig({ ...config, semanasMesociclo: Number(e.target.value) })}>
                    {SEMANAS_MESOCICLO.map((s) => <option key={s} value={s}>{s} semanas</option>)}
                  </select>
                </div>
              </div>

              <label>Modalidade</label>
              <select value={config.modalidade} onChange={(e) => setConfig({ ...config, modalidade: e.target.value })}>
                {Object.entries(MODALIDADES_TREINO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>

              <label>Aeróbio</label>
              <select value={config.aerobio} onChange={(e) => setConfig({ ...config, aerobio: e.target.value })}>
                {Object.entries(OPCOES_AEROBIO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>

              <label>Ênfase muscular principal (até 3)</label>
              <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'flex-start', gap: 6 }}>
                {Object.entries(GRUPOS_MUSCULARES).map(([v, l]) => (
                  <button type="button" key={v}
                    className={config.enfaseMuscular.includes(v) ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
                    onClick={() => alternarEnfase(v)}>
                    {l}
                  </button>
                ))}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={gerando}>{gerando ? 'Gerando...' : 'Gerar treino'}</button>
                <button type="button" className="btn-secondary" onClick={() => setModalIA(false)} disabled={gerando}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalRegistro && (
        <ModalRegistroTreino
          treino={modalRegistro}
          alunoId={alunoId}
          onClose={() => setModalRegistro(null)}
          onSalvo={() => { setModalRegistro(null); }}
        />
      )}
    </div>
  );
}

function ModalRegistroTreino({ treino, alunoId, onClose, onSalvo }) {
  const [diaLetra, setDiaLetra] = useState(treino.dias?.[0]?.letra || '');
  const [duracaoMin, setDuracaoMin] = useState(treino.configuracao?.duracaoSessaoMin || 60);
  const [intensidadePercebida, setIntensidade] = useState('moderada');
  const [cansaco, setCansaco] = useState(3);
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const diaAtual = treino.dias?.find((d) => d.letra === diaLetra);
  const [cargas, setCargas] = useState({});

  function setSerie(exNome, idx, campo, valor) {
    setCargas((c) => {
      const series = c[exNome] ? [...c[exNome]] : [];
      series[idx] = { ...(series[idx] || {}), [campo]: valor };
      return { ...c, [exNome]: series };
    });
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const cargasArr = Object.entries(cargas).map(([exercicioNome, series]) => ({
        exercicioNome,
        series: series.filter(Boolean).map((s) => ({ peso: Number(s.peso) || 0, repeticoes: Number(s.repeticoes) || 0 })),
      }));
      const registro = await api.registrarTreino({
        alunoId, treinoId: treino.id, diaLetra, duracaoMin: Number(duracaoMin),
        intensidadePercebida, cansaco, cargas: cargasArr, observacoes,
      });
      setResultado(registro);
      onSalvo();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h1>Registrar treino executado</h1>
        {erro && <div className="error-msg">{erro}</div>}
        {resultado ? (
          <div>
            <div className="grid-stats">
              <div className="stat green"><div className="value">{resultado.volumeTotal}kg</div><div className="label">Volume total</div></div>
              <div className="stat"><div className="value">{resultado.caloriasGastas ?? '—'}</div><div className="label">Calorias estimadas</div></div>
            </div>
            <button className="btn-primary" onClick={onClose}>Fechar</button>
          </div>
        ) : (
          <form onSubmit={salvar}>
            <label>Dia do treino</label>
            <select value={diaLetra} onChange={(e) => setDiaLetra(e.target.value)}>
              {(treino.dias || []).map((d) => <option key={d.letra} value={d.letra}>{d.letra} — {d.nome}</option>)}
            </select>

            {diaAtual?.exercicios?.map((ex, i) => (
              <div key={i} style={{ marginTop: 10 }}>
                <label>{ex.nome} ({ex.series}x{ex.repeticoes})</label>
                {Array.from({ length: ex.series || 1 }).map((_, s) => (
                  <div className="row" key={s} style={{ gap: 6 }}>
                    <input type="number" placeholder="kg" style={{ flex: 1 }}
                      onChange={(e) => setSerie(ex.nome, s, 'peso', e.target.value)} />
                    <input type="number" placeholder="reps" style={{ flex: 1 }}
                      onChange={(e) => setSerie(ex.nome, s, 'repeticoes', e.target.value)} />
                  </div>
                ))}
              </div>
            ))}

            <div className="row" style={{ gap: 10, marginTop: 10 }}>
              <div style={{ flex: 1 }}>
                <label>Duração (min)</label>
                <input type="number" value={duracaoMin} onChange={(e) => setDuracaoMin(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label>Intensidade percebida</label>
                <select value={intensidadePercebida} onChange={(e) => setIntensidade(e.target.value)}>
                  {Object.entries(INTENSIDADES_TREINO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>

            <label>Nível de cansaço (1 a 5)</label>
            <input type="range" min="1" max="5" value={cansaco} onChange={(e) => setCansaco(Number(e.target.value))} />
            <div className="meta">Cansaço: {cansaco}/5</div>

            <label>Observações</label>
            <textarea rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
              <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
