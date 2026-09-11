import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, formatarData, NIVEIS_ATIVIDADE, MEDIDAS_CAMPOS } from '../api.js';

const ANAMNESE_VAZIA = {
  queixasDor: '',
  objetivo: '',
  condicoesSaude: '',
  restricoesMedicas: '',
  medicamentos: '',
  cirurgias: '',
  historicoFamiliar: '',
  nivelAtividade: 'sedentario',
  fumante: false,
  ingereAlcool: false,
  qualidadeSono: 'boa',
  observacoes: '',
};

const DOBRAS_CAMPOS = [
  ['triceps', 'Tríceps'], ['subescapular', 'Subescapular'], ['axilarMedia', 'Axilar média'],
  ['suprailiaca', 'Suprailíaca'], ['abdominal', 'Abdominal'], ['coxa', 'Coxa'], ['peitoral', 'Peitoral'],
];

function formVazio() {
  return {
    data: new Date().toISOString().slice(0, 10),
    pesoKg: '',
    dobras: Object.fromEntries(DOBRAS_CAMPOS.map(([c]) => [c, ''])),
    medidas: Object.fromEntries(MEDIDAS_CAMPOS.map(([c]) => [c, ''])),
    observacoes: '',
    fotos: [],
  };
}

function paraNumeros(obj) {
  const out = {};
  for (const k of Object.keys(obj)) out[k] = obj[k] === '' ? null : Number(obj[k]);
  return out;
}

export default function Avaliacoes() {
  const { alunoId } = useParams();
  const [aluno, setAluno] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState(formVazio());
  const [erro, setErro] = useState('');
  const [fotosComparadas, setFotosComparadas] = useState([null, null]);
  const [idsComparados, setIdsComparados] = useState([]);
  const [anamnese, setAnamneseState] = useState(ANAMNESE_VAZIA);
  const [anamneseAberta, setAnamneseAberta] = useState(false);
  const [salvandoAnamnese, setSalvandoAnamnese] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const [a, avals] = await Promise.all([api.obterAluno(alunoId), api.listarAvaliacoes(alunoId)]);
      setAluno(a);
      setAvaliacoes(avals);
      setAnamneseState({ ...ANAMNESE_VAZIA, ...a.anamnese });
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, [alunoId]);

  function setAnamnese(campo, valor) {
    setAnamneseState((a) => ({ ...a, [campo]: valor }));
  }

  async function salvarAnamnese(e) {
    e.preventDefault();
    setErro('');
    setSalvandoAnamnese(true);
    try {
      const atualizado = await api.atualizarAluno(alunoId, { anamnese });
      setAluno(atualizado);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvandoAnamnese(false);
    }
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      await api.criarAvaliacao({
        alunoId,
        data: form.data,
        pesoKg: form.pesoKg,
        dobras: paraNumeros(form.dobras),
        medidas: paraNumeros(form.medidas),
        observacoes: form.observacoes,
        fotos: form.fotos,
      });
      setForm(formVazio());
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  function onFoto(e) {
    const arquivos = Array.from(e.target.files || []);
    arquivos.forEach((arquivo) => {
      const reader = new FileReader();
      reader.onload = () => {
        setForm((f) => ({ ...f, fotos: [...f.fotos, { url: reader.result, tipo: 'geral' }] }));
      };
      reader.readAsDataURL(arquivo);
    });
  }

  function removerFotoDoForm(indice) {
    setForm((f) => ({ ...f, fotos: f.fotos.filter((_, i) => i !== indice) }));
  }

  async function removerFotoSalva(avaliacao, indice) {
    if (!confirm('Excluir esta foto?')) return;
    const fotos = avaliacao.fotos.filter((_, i) => i !== indice);
    await api.atualizarAvaliacao(avaliacao.id, { fotos });
    await carregar();
  }

  async function excluir(id) {
    if (!confirm('Excluir esta avaliação?')) return;
    await api.removerAvaliacao(id);
    await carregar();
  }

  if (carregando) return <p className="empty">Carregando...</p>;
  if (!aluno) return <p className="empty">Aluno não encontrado.</p>;

  // Todas as fotos de todas as avaliações, numa lista só, para o treinador
  // escolher quaisquer duas — não precisam ser da mesma dupla de avaliações.
  const todasFotos = avaliacoes
    .flatMap((a) => (a.fotos || []).map((f, i) => ({ avaliacaoId: a.id, indice: i, url: f.url, data: a.data })))
    .sort((x, y) => (x.data < y.data ? -1 : 1));

  function chaveFoto(f) {
    return `${f.avaliacaoId}-${f.indice}`;
  }

  function alternarFotoComparada(foto) {
    setFotosComparadas(([a, b]) => {
      const k = chaveFoto(foto);
      if (a && chaveFoto(a) === k) return [null, b];
      if (b && chaveFoto(b) === k) return [a, null];
      if (!a) return [foto, b];
      if (!b) return [a, foto];
      // As duas posições já estão ocupadas: a mais antiga sai, a nova entra.
      return [b, foto];
    });
  }

  const [fotoA, fotoB] = fotosComparadas;
  const avaliacaoDaFotoA = fotoA && avaliacoes.find((a) => a.id === fotoA.avaliacaoId);
  const avaliacaoDaFotoB = fotoB && avaliacoes.find((a) => a.id === fotoB.avaliacaoId);

  // Até 5 avaliações, sempre em ordem cronológica na tabela — não na ordem
  // em que o treinador clicou.
  function alternarComparacao(id) {
    setIdsComparados((ids) => {
      if (ids.includes(id)) return ids.filter((x) => x !== id);
      if (ids.length >= 5) return ids;
      return [...ids, id];
    });
  }

  const avaliacoesComparadas = avaliacoes
    .filter((a) => idsComparados.includes(a.id))
    .sort((a, b) => (a.data < b.data ? -1 : 1));

  const linhasMedidas = MEDIDAS_CAMPOS.filter(([c]) => avaliacoesComparadas.some((a) => a.medidas?.[c] != null));
  const linhasDobras = DOBRAS_CAMPOS.filter(([c]) => avaliacoesComparadas.some((a) => a.dobras?.[c] != null));

  return (
    <div>
      <Link to="/alunos">&larr; Voltar para alunos</Link>
      <h1>Avaliação física — {aluno.nome}</h1>
      <p className="subtitle">Altura cadastrada: {aluno.altura || '—'} cm · Sexo: {aluno.sexo}</p>
      {erro && <div className="error-msg">{erro}</div>}

      <div className="card">
        <div className="row" style={{ cursor: 'pointer' }} onClick={() => setAnamneseAberta((v) => !v)}>
          <h2 style={{ margin: 0 }}>Anamnese de saúde</h2>
          <button type="button" className="btn-secondary btn-small">{anamneseAberta ? 'Fechar' : 'Ver / editar'}</button>
        </div>

        {!anamneseAberta && (
          <p className="meta" style={{ marginTop: 8 }}>
            {anamnese.objetivo || anamnese.queixasDor
              ? `Objetivo: ${anamnese.objetivo || '—'} · Queixas: ${anamnese.queixasDor || 'nenhuma'}`
              : 'Nenhuma anamnese preenchida ainda.'}
          </p>
        )}

        {anamneseAberta && (
          <form onSubmit={salvarAnamnese}>
            <label>Objetivo do aluno</label>
            <input value={anamnese.objetivo} onChange={(e) => setAnamnese('objetivo', e.target.value)} placeholder="Emagrecimento, hipertrofia, saúde, performance..." />

            <label>Dores / queixas atuais</label>
            <textarea rows={2} value={anamnese.queixasDor} onChange={(e) => setAnamnese('queixasDor', e.target.value)} placeholder="Ex: dor lombar ao agachar, dor no ombro direito..." />

            <label>Condições de saúde (doenças, cardiopatias, diabetes...)</label>
            <textarea rows={2} value={anamnese.condicoesSaude} onChange={(e) => setAnamnese('condicoesSaude', e.target.value)} />

            <label>Restrições médicas</label>
            <input value={anamnese.restricoesMedicas} onChange={(e) => setAnamnese('restricoesMedicas', e.target.value)} />

            <label>Medicamentos em uso</label>
            <input value={anamnese.medicamentos} onChange={(e) => setAnamnese('medicamentos', e.target.value)} />

            <label>Cirurgias / lesões anteriores</label>
            <input value={anamnese.cirurgias} onChange={(e) => setAnamnese('cirurgias', e.target.value)} />

            <label>Histórico familiar relevante</label>
            <input value={anamnese.historicoFamiliar} onChange={(e) => setAnamnese('historicoFamiliar', e.target.value)} />

            <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <label>Nível de atividade atual</label>
                <select value={anamnese.nivelAtividade} onChange={(e) => setAnamnese('nivelAtividade', e.target.value)}>
                  {Object.entries(NIVEIS_ATIVIDADE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label>Qualidade do sono</label>
                <select value={anamnese.qualidadeSono} onChange={(e) => setAnamnese('qualidadeSono', e.target.value)}>
                  <option value="ruim">Ruim</option>
                  <option value="regular">Regular</option>
                  <option value="boa">Boa</option>
                </select>
              </div>
            </div>

            <div className="row" style={{ gap: 16, marginTop: 10 }}>
              <label className="checkbox-row" style={{ margin: 0 }}>
                <input type="checkbox" checked={anamnese.fumante} onChange={(e) => setAnamnese('fumante', e.target.checked)} />
                Fumante
              </label>
              <label className="checkbox-row" style={{ margin: 0 }}>
                <input type="checkbox" checked={anamnese.ingereAlcool} onChange={(e) => setAnamnese('ingereAlcool', e.target.checked)} />
                Ingere álcool
              </label>
            </div>

            <label>Observações gerais da anamnese</label>
            <textarea rows={2} value={anamnese.observacoes} onChange={(e) => setAnamnese('observacoes', e.target.value)} />

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={salvandoAnamnese}>
                {salvandoAnamnese ? 'Salvando...' : 'Salvar anamnese'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Nova avaliação</h2>
        <form onSubmit={salvar}>
          <div className="row" style={{ gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Data</label>
              <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Peso (kg)</label>
              <input type="number" step="0.1" value={form.pesoKg} onChange={(e) => setForm({ ...form, pesoKg: e.target.value })} required />
            </div>
          </div>

          <h2>Dobras cutâneas — protocolo 7 dobras (mm)</h2>
          <div className="grid-stats" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            {DOBRAS_CAMPOS.map(([campo, label]) => (
              <div key={campo}>
                <label>{label}</label>
                <input type="number" step="0.1" value={form.dobras[campo]}
                  onChange={(e) => setForm({ ...form, dobras: { ...form.dobras, [campo]: e.target.value } })} />
              </div>
            ))}
          </div>

          <h2>Medidas de fita (cm)</h2>
          <div className="grid-stats" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            {MEDIDAS_CAMPOS.map(([campo, label]) => (
              <div key={campo}>
                <label>{label}</label>
                <input type="number" step="0.1" value={form.medidas[campo]}
                  onChange={(e) => setForm({ ...form, medidas: { ...form.medidas, [campo]: e.target.value } })} />
              </div>
            ))}
          </div>

          <label>Fotos da avaliação</label>
          <input type="file" accept="image/*" multiple onChange={onFoto} />
          {form.fotos.length > 0 && (
            <div className="row" style={{ gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
              {form.fotos.map((f, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={f.url} alt="" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 8 }} />
                  <button
                    type="button"
                    onClick={() => removerFotoDoForm(i)}
                    title="Remover foto"
                    style={{
                      position: 'absolute', top: -6, right: -6, width: 22, height: 22, padding: 0,
                      borderRadius: '50%', background: 'var(--negativo)', color: 'var(--noite)',
                      fontSize: 12, lineHeight: 1, fontWeight: 700,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <label>Observações</label>
          <textarea rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />

          <div className="form-actions">
            <button type="submit" className="btn-primary">Salvar avaliação</button>
          </div>
        </form>
      </div>

      <h2>Histórico</h2>
      {avaliacoes.length === 0 && <p className="empty">Nenhuma avaliação registrada ainda.</p>}
      {avaliacoes.map((a) => (
        <div className="card" key={a.id}>
          <div className="row">
            <div className="name">{formatarData(a.data)} · {a.pesoKg}kg</div>
            <button className="btn-danger btn-small" onClick={() => excluir(a.id)}>Excluir</button>
          </div>
          <div className="grid-stats" style={{ marginTop: 10 }}>
            <div className="stat">
              <div className="value">{a.calculado?.imc ?? '—'}</div>
              <div className="label">IMC · {a.calculado?.classificacaoImc}</div>
            </div>
            <div className="stat green">
              <div className="value">{a.calculado?.percentualGordura ?? '—'}%</div>
              <div className="label">Gordura corporal · {a.calculado?.classificacaoGordura}</div>
            </div>
            <div className="stat">
              <div className="value">{a.calculado?.massaGordaKg ?? '—'}kg</div>
              <div className="label">Massa gorda</div>
            </div>
            <div className="stat green">
              <div className="value">{a.calculado?.massaMagraKg ?? '—'}kg</div>
              <div className="label">Massa magra</div>
            </div>
          </div>
          {a.fotos?.length > 0 && (
            <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
              {a.fotos.map((f, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={f.url} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                  <button
                    type="button"
                    onClick={() => removerFotoSalva(a, i)}
                    title="Remover foto"
                    style={{
                      position: 'absolute', top: -6, right: -6, width: 20, height: 20, padding: 0,
                      borderRadius: '50%', background: 'var(--negativo)', color: 'var(--noite)',
                      fontSize: 11, lineHeight: 1, fontWeight: 700,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {a.observacoes && <p className="meta" style={{ marginTop: 8 }}>{a.observacoes}</p>}
        </div>
      ))}

      {avaliacoes.length >= 2 && (
        <>
          <h2>Comparar avaliações</h2>
          <div className="card">
            <p className="meta" style={{ marginBottom: 10 }}>
              Escolha de 2 a 5 avaliações para comparar lado a lado.
            </p>

            <div className="row" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'flex-start', marginBottom: 4 }}>
              {avaliacoes.map((a) => {
                const pos = avaliacoesComparadas.findIndex((x) => x.id === a.id);
                return (
                  <button
                    type="button"
                    key={a.id}
                    className={`chip-avaliacao ${pos !== -1 ? 'selecionada' : ''}`}
                    onClick={() => alternarComparacao(a.id)}
                    disabled={pos === -1 && idsComparados.length >= 5}
                  >
                    {pos !== -1 && <span className="chip-avaliacao-badge">{pos + 1}</span>}
                    {formatarData(a.data)}
                  </button>
                );
              })}
            </div>

            {avaliacoesComparadas.length >= 2 && (
              <>
                <div className="tabela-comparativo-wrap">
                  <table className="tabela-comparativo">
                    <thead>
                      <tr>
                        <th></th>
                        {avaliacoesComparadas.map((a, i) => <th key={a.id}>Avaliação {i + 1}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Data</td>
                        {avaliacoesComparadas.map((a) => <td key={a.id}>{formatarData(a.data)}</td>)}
                      </tr>
                      <tr>
                        <td>Peso (kg)</td>
                        {avaliacoesComparadas.map((a) => <td key={a.id}>{a.pesoKg ?? '—'}</td>)}
                      </tr>
                      <tr>
                        <td>IMC</td>
                        {avaliacoesComparadas.map((a) => <td key={a.id}>{a.calculado?.imc ?? '—'}</td>)}
                      </tr>
                      <tr className="destaque">
                        <td>% Gordura</td>
                        {avaliacoesComparadas.map((a) => <td key={a.id}>{a.calculado?.percentualGordura ?? '—'}</td>)}
                      </tr>
                      <tr>
                        <td>Massa gorda (kg)</td>
                        {avaliacoesComparadas.map((a) => <td key={a.id}>{a.calculado?.massaGordaKg ?? '—'}</td>)}
                      </tr>
                      <tr className="destaque">
                        <td>Massa magra (kg)</td>
                        {avaliacoesComparadas.map((a) => <td key={a.id}>{a.calculado?.massaMagraKg ?? '—'}</td>)}
                      </tr>

                      {linhasMedidas.length > 0 && (
                        <tr className="secao">
                          <td colSpan={avaliacoesComparadas.length + 1}>Perimetria</td>
                        </tr>
                      )}
                      {linhasMedidas.map(([c, label]) => (
                        <tr key={c}>
                          <td>{label}</td>
                          {avaliacoesComparadas.map((a) => <td key={a.id}>{a.medidas?.[c] ?? '—'}</td>)}
                        </tr>
                      ))}

                      {linhasDobras.length > 0 && (
                        <tr className="secao">
                          <td colSpan={avaliacoesComparadas.length + 1}>Dobras cutâneas</td>
                        </tr>
                      )}
                      {linhasDobras.map(([c, label]) => (
                        <tr key={c}>
                          <td>{label}</td>
                          {avaliacoesComparadas.map((a) => <td key={a.id}>{a.dobras?.[c] ?? '—'}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button type="button" className="btn-secondary btn-small" style={{ marginTop: 10 }} onClick={() => setIdsComparados([])}>
                  Limpar seleção
                </button>
              </>
            )}
          </div>
        </>
      )}

      {todasFotos.length >= 2 && (
        <>
          <h2>Comparar fotos</h2>
          <div className="card">
            <p className="meta" style={{ marginBottom: 10 }}>
              Toque em duas fotos para colocar uma do lado da outra — não precisam ser da mesma avaliação.
            </p>

            <div className="row" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
              {todasFotos.map((f) => {
                const k = chaveFoto(f);
                const posicao = fotoA && chaveFoto(fotoA) === k ? 1 : fotoB && chaveFoto(fotoB) === k ? 2 : null;
                return (
                  <button
                    type="button"
                    key={k}
                    className={`foto-selecionavel ${posicao ? `selecionada pos-${posicao}` : ''}`}
                    onClick={() => alternarFotoComparada(f)}
                  >
                    <img src={f.url} alt="" />
                    <span className="foto-selecionavel-data">{formatarData(f.data)}</span>
                    {posicao && <span className="foto-selecionavel-badge">{posicao}</span>}
                  </button>
                );
              })}
            </div>

            {fotoA && fotoB && (
              <>
                <div className="row" style={{ gap: 12, marginTop: 16, alignItems: 'flex-start' }}>
                  {[fotoA, fotoB].map((f, i) => (
                    <div key={i} style={{ flex: 1 }}>
                      <img src={f.url} alt="" style={{ width: '100%', aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: 10 }} />
                      <div className="meta" style={{ marginTop: 6, textAlign: 'center' }}>
                        {i === 0 ? 'Antes' : 'Depois'} · {formatarData(f.data)}
                      </div>
                    </div>
                  ))}
                </div>

                {avaliacaoDaFotoA && avaliacaoDaFotoB && avaliacaoDaFotoA.id !== avaliacaoDaFotoB.id && (
                  <p className="meta" style={{ marginTop: 10 }}>
                    Variação: {(avaliacaoDaFotoB.pesoKg - avaliacaoDaFotoA.pesoKg).toFixed(1)}kg de peso ·{' '}
                    {((avaliacaoDaFotoB.calculado?.percentualGordura ?? 0) - (avaliacaoDaFotoA.calculado?.percentualGordura ?? 0)).toFixed(1)}% de gordura ·{' '}
                    {((avaliacaoDaFotoB.calculado?.massaMagraKg ?? 0) - (avaliacaoDaFotoA.calculado?.massaMagraKg ?? 0)).toFixed(1)}kg de massa magra
                  </p>
                )}

                <button type="button" className="btn-secondary btn-small" style={{ marginTop: 10 }} onClick={() => setFotosComparadas([null, null])}>
                  Limpar seleção
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
