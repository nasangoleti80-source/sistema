import { useEffect, useState } from 'react';
import { api, TIPOS_REFEICAO, UNIDADES_ALIMENTO } from '../api.js';

function novoItem() {
  return { id: crypto.randomUUID(), opcoes: [{ alimentoId: '', nome: '', quantidade: '', unidade: 'g' }] };
}

function formVazio() {
  return { nome: '', observacoes: '', refeicoesPorTipo: {} };
}

export default function Dietas() {
  const [alunos, setAlunos] = useState([]);
  const [alunoId, setAlunoId] = useState('');
  const [dietas, setDietas] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(formVazio());
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.listarAlunos(true).then((lista) => {
      setAlunos(lista);
      if (lista.length && !alunoId) setAlunoId(lista[0].id);
    });
    api.listarAlimentos().then(setCatalogo);
  }, []);

  async function carregar(id) {
    setDietas(await api.listarDietas(id));
  }

  useEffect(() => { if (alunoId) carregar(alunoId); }, [alunoId]);

  function abrirNovo() {
    setForm(formVazio());
    setErro('');
    setModalAberto(true);
  }

  function alternarTipo(tipo) {
    setForm((f) => {
      const refeicoesPorTipo = { ...f.refeicoesPorTipo };
      if (refeicoesPorTipo[tipo]) {
        delete refeicoesPorTipo[tipo];
      } else {
        refeicoesPorTipo[tipo] = [novoItem()];
      }
      return { ...f, refeicoesPorTipo };
    });
  }

  function addItem(tipo) {
    setForm((f) => ({
      ...f,
      refeicoesPorTipo: { ...f.refeicoesPorTipo, [tipo]: [...f.refeicoesPorTipo[tipo], novoItem()] },
    }));
  }

  function removerItem(tipo, itemId) {
    setForm((f) => ({
      ...f,
      refeicoesPorTipo: { ...f.refeicoesPorTipo, [tipo]: f.refeicoesPorTipo[tipo].filter((it) => it.id !== itemId) },
    }));
  }

  function addOpcao(tipo, itemId) {
    setForm((f) => ({
      ...f,
      refeicoesPorTipo: {
        ...f.refeicoesPorTipo,
        [tipo]: f.refeicoesPorTipo[tipo].map((it) =>
          it.id === itemId
            ? { ...it, opcoes: [...it.opcoes, { alimentoId: '', nome: '', quantidade: '', unidade: 'g' }] }
            : it
        ),
      },
    }));
  }

  function removerOpcao(tipo, itemId, idx) {
    setForm((f) => ({
      ...f,
      refeicoesPorTipo: {
        ...f.refeicoesPorTipo,
        [tipo]: f.refeicoesPorTipo[tipo].map((it) =>
          it.id === itemId ? { ...it, opcoes: it.opcoes.filter((_, i) => i !== idx) } : it
        ),
      },
    }));
  }

  function setOpcao(tipo, itemId, idx, campo, valor) {
    setForm((f) => ({
      ...f,
      refeicoesPorTipo: {
        ...f.refeicoesPorTipo,
        [tipo]: f.refeicoesPorTipo[tipo].map((it) => {
          if (it.id !== itemId) return it;
          const opcoes = [...it.opcoes];
          opcoes[idx] = { ...opcoes[idx], [campo]: valor };
          return { ...it, opcoes };
        }),
      },
    }));
  }

  function selecionarAlimento(tipo, itemId, idx, alimentoId) {
    const alimento = catalogo.find((a) => a.id === alimentoId);
    setForm((f) => ({
      ...f,
      refeicoesPorTipo: {
        ...f.refeicoesPorTipo,
        [tipo]: f.refeicoesPorTipo[tipo].map((it) => {
          if (it.id !== itemId) return it;
          const opcoes = [...it.opcoes];
          opcoes[idx] = alimento
            ? { alimentoId: alimento.id, nome: alimento.nome, quantidade: alimento.quantidadePadrao ?? '', unidade: alimento.unidade }
            : { alimentoId: '', nome: '', quantidade: '', unidade: 'g' };
          return { ...it, opcoes };
        }),
      },
    }));
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      const refeicoes = Object.entries(form.refeicoesPorTipo)
        .map(([tipo, itens]) => ({
          tipo,
          nome: TIPOS_REFEICAO[tipo],
          itens: itens
            .map((it) => ({ ...it, opcoes: it.opcoes.filter((op) => op.alimentoId) }))
            .filter((it) => it.opcoes.length > 0),
        }))
        .filter((r) => r.itens.length > 0);
      await api.criarDieta({ alunoId, nome: form.nome, observacoes: form.observacoes, refeicoes });
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

  const tiposAtivos = Object.keys(TIPOS_REFEICAO).filter((t) => form.refeicoesPorTipo[t]);

  return (
    <div>
      <h1>Dieta</h1>
      <p className="subtitle">Plano alimentar do cliente, montado a partir do catálogo de alimentos</p>

      <div className="row" style={{ marginBottom: 12, gap: 8 }}>
        <select value={alunoId} onChange={(e) => setAlunoId(e.target.value)}>
          {alunos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
        <button className="btn-primary" onClick={abrirNovo} disabled={!alunoId}>+ Dieta</button>
      </div>

      {catalogo.length === 0 && (
        <div className="card">
          <p className="meta">
            Você ainda não tem alimentos cadastrados no catálogo. Cadastre em <strong>Alimentos</strong> as
            opções que quer usar (ex: peito de frango, arroz, batata doce) para montar as dietas mais rápido.
          </p>
        </div>
      )}

      {dietas.length === 0 && <p className="empty">Nenhuma dieta cadastrada para este aluno.</p>}
      {dietas.map((d) => (
        <div className="card" key={d.id}>
          <div className="row">
            <div className="name">{d.nome} {!d.ativa && <span className="badge sem-cobranca">inativa</span>}</div>
            <button className="btn-danger btn-small" onClick={() => excluir(d)}>Excluir</button>
          </div>
          {(d.refeicoes || []).map((r, i) => (
            <div key={i} className="card" style={{ background: 'var(--bg)' }}>
              <div className="name">{TIPOS_REFEICAO[r.tipo] || r.nome}</div>
              {(r.itens || []).map((item, j) => (
                <div key={j} className="meta" style={{ marginTop: 4 }}>
                  {item.opcoes.map((op, k) => (
                    <span key={k}>
                      {k > 0 && ' ou '}
                      {op.nome} ({op.quantidade} {UNIDADES_ALIMENTO[op.unidade] || op.unidade})
                    </span>
                  ))}
                </div>
              ))}
              {/* Compatibilidade com dietas antigas em texto livre */}
              {!r.itens && r.alimentos && <div className="meta">{r.alimentos}</div>}
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

              <label>Refeições deste plano</label>
              <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'flex-start', gap: 6 }}>
                {Object.entries(TIPOS_REFEICAO).map(([tipo, label]) => (
                  <button type="button" key={tipo}
                    className={form.refeicoesPorTipo[tipo] ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
                    onClick={() => alternarTipo(tipo)}>
                    {label}
                  </button>
                ))}
              </div>

              {tiposAtivos.map((tipo) => (
                <div key={tipo} className="card" style={{ background: 'var(--bg)', marginTop: 12 }}>
                  <div className="name">{TIPOS_REFEICAO[tipo]}</div>

                  {form.refeicoesPorTipo[tipo].map((item) => (
                    <div key={item.id} className="card" style={{ marginTop: 8 }}>
                      {item.opcoes.map((op, idx) => (
                        <div key={idx} style={{ marginBottom: idx < item.opcoes.length - 1 ? 10 : 0 }}>
                          {idx > 0 && <div className="meta" style={{ marginBottom: 4 }}>ou:</div>}
                          <div className="row" style={{ gap: 6 }}>
                            <select
                              style={{ flex: 2 }}
                              value={op.alimentoId}
                              onChange={(e) => selecionarAlimento(tipo, item.id, idx, e.target.value)}
                            >
                              <option value="">Selecione um alimento...</option>
                              {catalogo.map((al) => <option key={al.id} value={al.id}>{al.nome}</option>)}
                            </select>
                            <input
                              type="number" min="0" step="0.1" style={{ flex: 1 }}
                              value={op.quantidade}
                              onChange={(e) => setOpcao(tipo, item.id, idx, 'quantidade', e.target.value)}
                              placeholder="qtd"
                            />
                            <select
                              style={{ flex: 1 }}
                              value={op.unidade}
                              onChange={(e) => setOpcao(tipo, item.id, idx, 'unidade', e.target.value)}
                            >
                              {Object.entries(UNIDADES_ALIMENTO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                            {item.opcoes.length > 1 && (
                              <button type="button" className="btn-danger btn-small" onClick={() => removerOpcao(tipo, item.id, idx)}>×</button>
                            )}
                          </div>
                        </div>
                      ))}

                      <div className="row" style={{ marginTop: 8, gap: 6 }}>
                        <button type="button" className="btn-secondary btn-small" onClick={() => addOpcao(tipo, item.id)}>
                          🔀 Opção de troca
                        </button>
                        <button type="button" className="btn-danger btn-small" onClick={() => removerItem(tipo, item.id)}>
                          Remover item
                        </button>
                      </div>
                    </div>
                  ))}

                  <button type="button" className="btn-secondary btn-small" style={{ marginTop: 8 }} onClick={() => addItem(tipo)}>
                    + Item nesta refeição
                  </button>
                </div>
              ))}

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
