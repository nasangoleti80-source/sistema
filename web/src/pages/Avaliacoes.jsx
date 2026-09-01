import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, formatarData, NIVEIS_ATIVIDADE } from '../api.js';

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

const MEDIDAS_CAMPOS = [
  ['pescoco', 'Pescoço'], ['ombro', 'Ombro'], ['torax', 'Tórax'], ['cintura', 'Cintura'], ['abdomen', 'Abdômen'],
  ['quadril', 'Quadril'], ['bracoDireito', 'Braço direito'], ['bracoEsquerdo', 'Braço esquerdo'],
  ['antebracoDireito', 'Antebraço direito'], ['antebracoEsquerdo', 'Antebraço esquerdo'],
  ['coxaDireita', 'Coxa direita'], ['coxaEsquerda', 'Coxa esquerda'],
  ['panturrilhaDireita', 'Panturrilha direita'], ['panturrilhaEsquerda', 'Panturrilha esquerda'],
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
  const [comparar, setComparar] = useState([null, null]);
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

  async function excluir(id) {
    if (!confirm('Excluir esta avaliação?')) return;
    await api.removerAvaliacao(id);
    await carregar();
  }

  if (carregando) return <p className="empty">Carregando...</p>;
  if (!aluno) return <p className="empty">Aluno não encontrado.</p>;

  const avaliacaoA = avaliacoes.find((a) => a.id === comparar[0]);
  const avaliacaoB = avaliacoes.find((a) => a.id === comparar[1]);

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
            <div className="row" style={{ gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {form.fotos.map((f, i) => (
                <img key={i} src={f.url} alt="" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 8 }} />
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
            <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {a.fotos.map((f, i) => (
                <img key={i} src={f.url} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
              ))}
            </div>
          )}
          {a.observacoes && <p className="meta" style={{ marginTop: 8 }}>{a.observacoes}</p>}
        </div>
      ))}

      {avaliacoes.length >= 2 && (
        <>
          <h2>Comparar evolução</h2>
          <div className="card">
            <div className="row" style={{ gap: 10 }}>
              <select value={comparar[0] || ''} onChange={(e) => setComparar([e.target.value, comparar[1]])}>
                <option value="">Antes...</option>
                {avaliacoes.map((a) => <option key={a.id} value={a.id}>{formatarData(a.data)}</option>)}
              </select>
              <select value={comparar[1] || ''} onChange={(e) => setComparar([comparar[0], e.target.value])}>
                <option value="">Depois...</option>
                {avaliacoes.map((a) => <option key={a.id} value={a.id}>{formatarData(a.data)}</option>)}
              </select>
            </div>
            {avaliacaoA && avaliacaoB && (
              <div className="row" style={{ gap: 16, marginTop: 14, alignItems: 'flex-start' }}>
                {[avaliacaoA, avaliacaoB].map((a, i) => (
                  <div key={i} style={{ flex: 1 }}>
                    <div className="name">{formatarData(a.data)}</div>
                    <div className="meta">{a.pesoKg}kg · IMC {a.calculado?.imc} · {a.calculado?.percentualGordura}% gordura</div>
                    <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      {(a.fotos || []).map((f, j) => (
                        <img key={j} src={f.url} alt="" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8 }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {avaliacaoA && avaliacaoB && (
              <p className="meta" style={{ marginTop: 10 }}>
                Variação: {(avaliacaoB.pesoKg - avaliacaoA.pesoKg).toFixed(1)}kg de peso ·{' '}
                {((avaliacaoB.calculado?.percentualGordura ?? 0) - (avaliacaoA.calculado?.percentualGordura ?? 0)).toFixed(1)}% de gordura ·{' '}
                {((avaliacaoB.calculado?.massaMagraKg ?? 0) - (avaliacaoA.calculado?.massaMagraKg ?? 0)).toFixed(1)}kg de massa magra
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
