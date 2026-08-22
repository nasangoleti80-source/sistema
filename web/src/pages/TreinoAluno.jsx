import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';

function linhaVazia() {
  return { id: Math.random().toString(36).slice(2, 10), nome: '', series: '', repeticoes: '', carga: '', observacao: '' };
}

export default function TreinoAluno() {
  const { id } = useParams();
  const [aluno, setAluno] = useState(null);
  const [exercicios, setExercicios] = useState([]);
  const [observacoes, setObservacoes] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    setCarregando(true);
    Promise.all([api.obterAluno(id), api.obterTreino(id)])
      .then(([a, t]) => {
        setAluno(a);
        setExercicios(t?.exercicios?.length ? t.exercicios : [linhaVazia()]);
        setObservacoes(t?.observacoes || '');
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [id]);

  function atualizarCampo(idx, campo, valor) {
    setExercicios((lista) => lista.map((ex, i) => (i === idx ? { ...ex, [campo]: valor } : ex)));
  }

  function removerLinha(idx) {
    setExercicios((lista) => lista.filter((_, i) => i !== idx));
  }

  function adicionarLinha() {
    setExercicios((lista) => [...lista, linhaVazia()]);
  }

  async function salvar() {
    setErro('');
    setSalvando(true);
    try {
      const validos = exercicios.filter((ex) => ex.nome.trim());
      await api.salvarTreino(id, { exercicios: validos, observacoes });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <p className="empty">Carregando...</p>;

  return (
    <div>
      <Link to="/alunos" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>‹ Voltar pra Alunos</Link>
      <h1>Treino de {aluno?.nome}</h1>
      <p className="subtitle">O aluno vê essa lista de exercícios no acesso dele.</p>

      {erro && <div className="error-msg">{erro}</div>}

      <div className="card">
        {exercicios.map((ex, idx) => (
          <div key={ex.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 10 }}>
            <label>Exercício</label>
            <input value={ex.nome} onChange={(e) => atualizarCampo(idx, 'nome', e.target.value)} placeholder="Ex: Agachamento livre" />
            <div className="grid-stats" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: 0 }}>
              <div>
                <label>Séries</label>
                <input value={ex.series} onChange={(e) => atualizarCampo(idx, 'series', e.target.value)} placeholder="3" />
              </div>
              <div>
                <label>Repetições</label>
                <input value={ex.repeticoes} onChange={(e) => atualizarCampo(idx, 'repeticoes', e.target.value)} placeholder="12" />
              </div>
              <div>
                <label>Carga</label>
                <input value={ex.carga} onChange={(e) => atualizarCampo(idx, 'carga', e.target.value)} placeholder="20kg" />
              </div>
            </div>
            <label>Observação</label>
            <input value={ex.observacao} onChange={(e) => atualizarCampo(idx, 'observacao', e.target.value)} placeholder="Cadência, técnica, etc." />
            <button type="button" className="btn-secondary btn-small" style={{ marginTop: 8 }} onClick={() => removerLinha(idx)}>
              Remover exercício
            </button>
          </div>
        ))}
        <button type="button" className="btn-secondary" onClick={adicionarLinha}>+ Exercício</button>
      </div>

      <label>Observações gerais do treino</label>
      <textarea rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Frequência semanal, orientações gerais..." />

      <div className="form-actions">
        <button className="btn-primary" onClick={salvar} disabled={salvando}>
          {salvando ? 'Salvando...' : salvo ? 'Salvo ✓' : 'Salvar treino'}
        </button>
      </div>
    </div>
  );
}
