import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';

const PARQ_PERGUNTAS = [
  'Algum médico já disse que você possui um problema cardíaco e que só deveria realizar atividade física supervisionada?',
  'Você sente dor no peito quando pratica atividade física?',
  'No último mês, você sentiu dor no peito quando não estava praticando atividade física?',
  'Você perde o equilíbrio por tontura ou já perdeu a consciência?',
  'Você tem algum problema ósseo ou articular que poderia piorar com a mudança de atividade física?',
  'Algum médico já recomendou o uso de medicamento para pressão arterial ou problema do coração?',
  'Você conhece algum outro motivo para não praticar atividade física?',
];

const CONDICOES = {
  hipertensao: 'Hipertensão',
  diabetes: 'Diabetes',
  problemaCardiaco: 'Problema cardíaco',
  problemaRespiratorio: 'Problema respiratório / asma',
  problemaArticular: 'Problema articular / coluna',
};

const EXPERIENCIAS = {
  nunca_treinou: 'Nunca treinou',
  ja_treinou: 'Já treinou antes',
  treina_atualmente: 'Treina atualmente',
};

const NIVEIS = { baixo: 'Baixo', medio: 'Médio', alto: 'Alto' };
const ALCOOL = { nunca: 'Nunca', socialmente: 'Socialmente', frequente: 'Frequente' };

function vazia(alunoId) {
  return {
    alunoId,
    data: new Date().toISOString().slice(0, 10),
    objetivoPrincipal: '',
    experiencia: 'nunca_treinou',
    condicoes: Object.fromEntries(Object.keys(CONDICOES).map((c) => [c, false])),
    outrasCondicoes: '',
    cirurgias: '',
    lesoes: '',
    medicamentos: '',
    dorAtual: '',
    parq: PARQ_PERGUNTAS.map(() => null),
    habitos: { sono: '', agua: '', fumante: false, alcool: 'nunca', estresse: 'medio' },
    profissaoSedentaria: false,
    atividadeAtual: '',
    observacoesProfissional: '',
  };
}

export default function AnamneseAluno() {
  const { id } = useParams();
  const [aluno, setAluno] = useState(null);
  const [form, setForm] = useState(vazia(id));
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setCarregando(true);
    Promise.all([api.obterAluno(id), api.obterAnamnese(id)])
      .then(([a, an]) => {
        setAluno(a);
        setForm(an || vazia(id));
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [id]);

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const salva = await api.salvarAnamnese(id, form);
      setForm(salva);
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <p className="empty">Carregando...</p>;

  const temAlertaParq = form.parq.some((r) => r === true);

  return (
    <div>
      <Link to="/alunos" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>‹ Voltar pra Alunos</Link>
      <h1>Anamnese de {aluno?.nome}</h1>
      <p className="subtitle">Preencha depois da conversa inicial com o aluno. Só você vê isso.</p>

      {erro && <div className="error-msg">{erro}</div>}

      {temAlertaParq && (
        <div className="error-msg" style={{ background: '#fef3c7', color: '#92400e' }}>
          ⚠️ Esse aluno respondeu "sim" a pelo menos uma pergunta do PAR-Q. Considere pedir liberação médica antes de prescrever esforço mais intenso.
        </div>
      )}

      <form onSubmit={salvar}>
        <label>Data do preenchimento</label>
        <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />

        <label>Objetivo principal</label>
        <input value={form.objetivoPrincipal} onChange={(e) => setForm({ ...form, objetivoPrincipal: e.target.value })} placeholder="Emagrecimento, hipertrofia, condicionamento..." />

        <label>Experiência com exercício</label>
        <select value={form.experiencia} onChange={(e) => setForm({ ...form, experiencia: e.target.value })}>
          {Object.entries(EXPERIENCIAS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <h2>Histórico de saúde</h2>
        <div className="card">
          {Object.entries(CONDICOES).map(([chave, label]) => (
            <label key={chave} className="checkbox-row" style={{ marginTop: 8 }}>
              <input
                type="checkbox"
                checked={form.condicoes[chave] || false}
                onChange={(e) => setForm({ ...form, condicoes: { ...form.condicoes, [chave]: e.target.checked } })}
              />
              {label}
            </label>
          ))}
          <label>Outras condições</label>
          <input value={form.outrasCondicoes} onChange={(e) => setForm({ ...form, outrasCondicoes: e.target.value })} />

          <label>Cirurgias</label>
          <input value={form.cirurgias} onChange={(e) => setForm({ ...form, cirurgias: e.target.value })} placeholder="Quais, quando" />

          <label>Lesões musculares/articulares</label>
          <input value={form.lesoes} onChange={(e) => setForm({ ...form, lesoes: e.target.value })} />

          <label>Medicamentos de uso contínuo</label>
          <input value={form.medicamentos} onChange={(e) => setForm({ ...form, medicamentos: e.target.value })} />

          <label>Dor atual</label>
          <input value={form.dorAtual} onChange={(e) => setForm({ ...form, dorAtual: e.target.value })} placeholder="Onde e desde quando" />
        </div>

        <h2>PAR-Q</h2>
        <p className="subtitle">Questionário de prontidão pra atividade física</p>
        <div className="card">
          {PARQ_PERGUNTAS.map((pergunta, idx) => (
            <div key={idx} style={{ borderBottom: idx < PARQ_PERGUNTAS.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: 10, marginBottom: 10 }}>
              <p style={{ margin: '0 0 8px', fontSize: 14 }}>{pergunta}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className={form.parq[idx] === true ? 'btn-danger btn-small' : 'btn-secondary btn-small'}
                  onClick={() => setForm({ ...form, parq: form.parq.map((r, i) => (i === idx ? true : r)) })}
                >
                  Sim
                </button>
                <button
                  type="button"
                  className={form.parq[idx] === false ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
                  onClick={() => setForm({ ...form, parq: form.parq.map((r, i) => (i === idx ? false : r)) })}
                >
                  Não
                </button>
              </div>
            </div>
          ))}
        </div>

        <h2>Hábitos e rotina</h2>
        <div className="card">
          <label>Horas de sono</label>
          <input value={form.habitos.sono} onChange={(e) => setForm({ ...form, habitos: { ...form.habitos, sono: e.target.value } })} placeholder="Ex: 6-7h" />

          <label>Consumo de água por dia</label>
          <input value={form.habitos.agua} onChange={(e) => setForm({ ...form, habitos: { ...form.habitos, agua: e.target.value } })} placeholder="Ex: 1,5L" />

          <label className="checkbox-row" style={{ marginTop: 10 }}>
            <input
              type="checkbox"
              checked={form.habitos.fumante}
              onChange={(e) => setForm({ ...form, habitos: { ...form.habitos, fumante: e.target.checked } })}
            />
            Fumante
          </label>

          <label>Consumo de álcool</label>
          <select value={form.habitos.alcool} onChange={(e) => setForm({ ...form, habitos: { ...form.habitos, alcool: e.target.value } })}>
            {Object.entries(ALCOOL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <label>Nível de estresse</label>
          <select value={form.habitos.estresse} onChange={(e) => setForm({ ...form, habitos: { ...form.habitos, estresse: e.target.value } })}>
            {Object.entries(NIVEIS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <label className="checkbox-row" style={{ marginTop: 10 }}>
            <input
              type="checkbox"
              checked={form.profissaoSedentaria}
              onChange={(e) => setForm({ ...form, profissaoSedentaria: e.target.checked })}
            />
            Profissão sedentária (trabalha sentado a maior parte do dia)
          </label>

          <label>Atividade física atual (fora do seu acompanhamento)</label>
          <input value={form.atividadeAtual} onChange={(e) => setForm({ ...form, atividadeAtual: e.target.value })} />
        </div>

        <label>Observações (só você vê)</label>
        <textarea
          rows={3}
          value={form.observacoesProfissional}
          onChange={(e) => setForm({ ...form, observacoesProfissional: e.target.value })}
          placeholder="Pontos de atenção pro treino e pra dieta"
        />

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={salvando}>
            {salvando ? 'Salvando...' : salvo ? 'Salvo ✓' : 'Salvar anamnese'}
          </button>
        </div>
      </form>
    </div>
  );
}
