import { useEffect, useState } from 'react';
import { api } from '../api.js';

const REFEICAO_VAZIA = { nome: '', horario: '', alimentos: '', observacao: '' };
const FORM_VAZIO = { nome: '', refeicoes: [{ ...REFEICAO_VAZIA }], observacoes: '' };

export default function Dietas() {
  const [alunos, setAlunos] = useState([]);
  const [alunoId, setAlunoId] = useState('');
  const [dietas, setDietas] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.listarAlunos(true).then((lista) => {
      setAlunos(lista);
      if (lista.length && !alunoId) setAlunoId(lista[0].id);
    });
  }, []);

  async function carregar(id) {
    setDietas(await api.listarDietas(id));
  }

  useEffect(() => { if (alunoId) carregar(alunoId); }, [alunoId]);

  function abrirNovo() {
    setForm(FORM_VAZIO);
    setErro('');
    setModalAberto(true);
  }

  function setRefeicao(i, campo, valor) {
    setForm((f) => {
      const refeicoes = [...f.refeicoes];
      refeicoes[i] = { ...refeicoes[i], [campo]: valor };
      return { ...f, refeicoes };
    });
  }

  function addRefeicao() {
    setForm((f) => ({ ...f, refeicoes: [...f.refeicoes, { ...REFEICAO_VAZIA }] }));
  }

  function removerRefeicao(i) {
    setForm((f) => ({ ...f, refeicoes: f.refeicoes.filter((_, idx) => idx !== i) }));
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      await api.criarDieta({ ...form, alunoId });
      setModalAberto(false);
      await carregar(alunoId);
    } catch (e) {
      setErro(e.message);
    }
  }

  async function excluir(dieta) {
    if (!confirm(`Excluir a dieta "${dieta.nome}"?`)) return;
    await api.removerDieta(dieta.id);
    await carregar(alunoId);
  }

  return (
    <div>
      <h1>Dieta</h1>
      <p className="subtitle">Plano alimentar do cliente dentro da plataforma</p>

      <div className="row" style={{ marginBottom: 12, gap: 8 }}>
        <select value={alunoId} onChange={(e) => setAlunoId(e.target.value)}>
          {alunos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
        <button className="btn-primary" onClick={abrirNovo} disabled={!alunoId}>+ Dieta</button>
      </div>

      {dietas.length === 0 && <p className="empty">Nenhuma dieta cadastrada para este aluno.</p>}
      {dietas.map((d) => (
        <div className="card" key={d.id}>
          <div className="row">
            <div className="name">{d.nome} {!d.ativa && <span className="badge sem-cobranca">inativa</span>}</div>
            <button className="btn-danger btn-small" onClick={() => excluir(d)}>Excluir</button>
          </div>
          {(d.refeicoes || []).map((r, i) => (
            <div key={i} className="list-item">
              <div>
                <div className="name">{r.nome} {r.horario && `· ${r.horario}`}</div>
                <div className="meta">{r.alimentos}</div>
                {r.observacao && <div className="meta">{r.observacao}</div>}
              </div>
            </div>
          ))}
          {d.observacoes && <p className="meta">{d.observacoes}</p>}
        </div>
      ))}

      {modalAberto && (
        <div className="modal-backdrop" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>Nova dieta</h1>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={salvar}>
              <label>Nome da dieta</label>
              <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Dieta de cutting" />

              <h2>Refeições</h2>
              {form.refeicoes.map((r, i) => (
                <div key={i} className="card" style={{ background: 'var(--bg)' }}>
                  <div className="row">
                    <label style={{ margin: 0 }}>Refeição {i + 1}</label>
                    {form.refeicoes.length > 1 && (
                      <button type="button" className="btn-danger btn-small" onClick={() => removerRefeicao(i)}>Remover</button>
                    )}
                  </div>
                  <input placeholder="Nome (ex: Café da manhã)" value={r.nome} onChange={(e) => setRefeicao(i, 'nome', e.target.value)} />
                  <input placeholder="Horário" value={r.horario} onChange={(e) => setRefeicao(i, 'horario', e.target.value)} />
                  <textarea rows={2} placeholder="Alimentos e quantidades" value={r.alimentos} onChange={(e) => setRefeicao(i, 'alimentos', e.target.value)} />
                  <input placeholder="Observação" value={r.observacao} onChange={(e) => setRefeicao(i, 'observacao', e.target.value)} />
                </div>
              ))}
              <button type="button" className="btn-secondary btn-small" onClick={addRefeicao}>+ Refeição</button>

              <label>Observações gerais</label>
              <textarea rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />

              <div className="form-actions">
                <button type="submit" className="btn-primary">Salvar</button>
                <button type="button" className="btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
