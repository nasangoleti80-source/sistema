import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, TIPOS_REFEICAO, UNIDADES_ALIMENTO } from '../api.js';
import ConstrutorDieta from '../components/ConstrutorDieta.jsx';

function formVazio() {
  return { nome: '', observacoes: '', refeicoesPorTipo: {}, opcoesPorTipo: {}, bancoOrigemPorTipo: {} };
}

// Um alimento dentro de uma opção, no texto corrido "1 fatia de pão + 15g de
// doce de leite" — usa a alternativa já escolhida quando o item tiver mais
// de uma (ou a primeira, por padrão).
function textoItem(item) {
  const op = item.opcoes?.[item.escolhaAtual || 0] || item.opcoes?.[0];
  if (!op?.nome) return '';
  return `${op.quantidade} ${UNIDADES_ALIMENTO[op.unidade] || op.unidade} de ${op.nome}`;
}

function resumoOpcao(opcao) {
  return (opcao.itens || []).map(textoItem).filter(Boolean).join(' + ');
}

export default function Dietas() {
  const [searchParams] = useSearchParams();
  const [alunos, setAlunos] = useState([]);
  const [alunoId, setAlunoId] = useState('');
  const [dietas, setDietas] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null); // id da dieta em edição, ou null para nova
  const [form, setForm] = useState(formVazio());
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.listarAlunos(true).then((lista) => {
      setAlunos(lista);
      if (lista.length && !alunoId) setAlunoId(searchParams.get('alunoId') || lista[0].id);
    });
    api.listarAlimentos().then(setCatalogo);
    api.listarBancosOpcoes().then(setBancos);
    api.listarModelosDieta().then(setModelos);
  }, []);

  async function carregar(id) {
    setDietas(await api.listarDietas(id));
  }

  useEffect(() => { if (alunoId) carregar(alunoId); }, [alunoId]);

  function abrirNovo() {
    setEditando(null);
    setForm(formVazio());
    setErro('');
    setModalAberto(true);
  }

  // Desmonta uma dieta (ou modelo) já salvo de volta no formato do
  // formulário. Uma refeição vinculada por bancoId antigo (formato anterior,
  // sem cópia própria) é clonada aqui na hora — a partir daí passa a ter
  // vida própria, como qualquer refeição criada no formato novo.
  function formDe(origem) {
    const refeicoesPorTipo = {};
    const opcoesPorTipo = {};
    const bancoOrigemPorTipo = {};
    for (const r of origem.refeicoes || []) {
      if (r.opcoes) {
        opcoesPorTipo[r.tipo] = r.opcoes;
        if (r.bancoOrigemId) bancoOrigemPorTipo[r.tipo] = r.bancoOrigemId;
      } else if (r.bancoId) {
        const banco = bancos.find((b) => b.id === r.bancoId);
        opcoesPorTipo[r.tipo] = banco ? JSON.parse(JSON.stringify(banco.opcoes)) : [];
        bancoOrigemPorTipo[r.tipo] = r.bancoId;
      } else {
        refeicoesPorTipo[r.tipo] = r.itens || [];
      }
    }
    return { nome: origem.nome, observacoes: origem.observacoes || '', refeicoesPorTipo, opcoesPorTipo, bancoOrigemPorTipo };
  }

  function abrirEdicao(dieta) {
    setEditando(dieta.id);
    setForm(formDe(dieta));
    setErro('');
    setModalAberto(true);
  }

  function usarModelo(e) {
    const modeloId = e.target.value;
    if (!modeloId) return;
    const modelo = modelos.find((m) => m.id === modeloId);
    if (!modelo) return;
    const { refeicoesPorTipo, opcoesPorTipo, bancoOrigemPorTipo } = formDe(modelo);
    setForm((f) => ({ ...f, nome: f.nome || modelo.nome, refeicoesPorTipo, opcoesPorTipo, bancoOrigemPorTipo }));
    e.target.value = '';
  }

  function toggleTipo(tipo) {
    setForm((f) => {
      const ativo = f.refeicoesPorTipo[tipo] !== undefined || f.opcoesPorTipo[tipo] !== undefined;
      if (ativo) {
        const { [tipo]: _r, ...refeicoesPorTipo } = f.refeicoesPorTipo;
        const { [tipo]: _o, ...opcoesPorTipo } = f.opcoesPorTipo;
        const { [tipo]: _b, ...bancoOrigemPorTipo } = f.bancoOrigemPorTipo;
        return { ...f, refeicoesPorTipo, opcoesPorTipo, bancoOrigemPorTipo };
      }
      return { ...f, refeicoesPorTipo: { ...f.refeicoesPorTipo, [tipo]: [] } };
    });
  }

  function setItens(tipo, itens) {
    setForm((f) => ({ ...f, refeicoesPorTipo: { ...f.refeicoesPorTipo, [tipo]: itens } }));
  }

  function setOpcoes(tipo, opcoes) {
    setForm((f) => ({ ...f, opcoesPorTipo: { ...f.opcoesPorTipo, [tipo]: opcoes } }));
  }

  // Escolher um banco aqui copia todas as opções dele para dentro da dieta
  // de uma vez só — não precisa escolher opção por opção, e dá para ajustar
  // quantidade depois sem alterar o banco original nem outros alunos.
  function escolherBanco(tipo, bancoId) {
    setForm((f) => {
      const opcoesPorTipo = { ...f.opcoesPorTipo };
      const bancoOrigemPorTipo = { ...f.bancoOrigemPorTipo };
      const refeicoesPorTipo = { ...f.refeicoesPorTipo };
      if (bancoId) {
        const banco = bancos.find((b) => b.id === bancoId);
        opcoesPorTipo[tipo] = banco ? JSON.parse(JSON.stringify(banco.opcoes)) : [];
        bancoOrigemPorTipo[tipo] = bancoId;
        delete refeicoesPorTipo[tipo];
      } else {
        delete opcoesPorTipo[tipo];
        delete bancoOrigemPorTipo[tipo];
        refeicoesPorTipo[tipo] = [];
      }
      return { ...f, opcoesPorTipo, bancoOrigemPorTipo, refeicoesPorTipo };
    });
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      const tiposAtivos = [...new Set([...Object.keys(form.refeicoesPorTipo), ...Object.keys(form.opcoesPorTipo)])];
      const refeicoes = tiposAtivos
        .map((tipo) => {
          if (form.opcoesPorTipo[tipo]) {
            const opcoes = form.opcoesPorTipo[tipo]
              .map((op) => ({
                ...op,
                itens: op.itens
                  .map((it) => ({ ...it, opcoes: it.opcoes.filter((o) => o.nome?.trim()) }))
                  .filter((it) => it.opcoes.length > 0),
              }))
              .filter((op) => op.itens.length > 0);
            return { tipo, nome: TIPOS_REFEICAO[tipo], bancoOrigemId: form.bancoOrigemPorTipo[tipo] || null, opcoes };
          }
          const itens = (form.refeicoesPorTipo[tipo] || [])
            .map((it) => ({ ...it, opcoes: it.opcoes.filter((op) => op.nome?.trim()) }))
            .filter((it) => it.opcoes.length > 0);
          return { tipo, nome: TIPOS_REFEICAO[tipo], itens };
        })
        .filter((r) => (r.opcoes && r.opcoes.length > 0) || (r.itens && r.itens.length > 0));

      if (editando) {
        await api.atualizarDieta(editando, { nome: form.nome, observacoes: form.observacoes, refeicoes });
      } else {
        await api.criarDieta({ alunoId, nome: form.nome, observacoes: form.observacoes, refeicoes });
      }
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

  const tiposAtivos = [...new Set([...Object.keys(form.refeicoesPorTipo), ...Object.keys(form.opcoesPorTipo)])];

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
            <div className="row" style={{ width: 'auto', gap: 6 }}>
              <button className="btn-secondary btn-small" onClick={() => abrirEdicao(d)}>✎ Editar</button>
              <button className="btn-danger btn-small" onClick={() => excluir(d)}>Excluir</button>
            </div>
          </div>
          {(d.refeicoes || []).map((r, i) => (
            <div key={i} className="card" style={{ background: 'var(--bg)' }}>
              <div className="name">{TIPOS_REFEICAO[r.tipo] || r.nome}</div>
              {r.opcoes && r.opcoes.map((op, j) => (
                <div key={j} className="meta" style={{ marginTop: 4 }}>
                  <strong>{op.nome}:</strong> {resumoOpcao(op) || '(sem alimentos ainda)'}
                </div>
              ))}
              {!r.opcoes && (r.itens || []).map((item, j) => (
                <div key={j} className="meta" style={{ marginTop: 4 }}>
                  {item.opcoes.map((op, k) => (
                    <span key={k}>
                      {k > 0 && ' ou '}
                      {op.nome} ({op.quantidade} {UNIDADES_ALIMENTO[op.unidade] || op.unidade})
                    </span>
                  ))}
                </div>
              ))}
              {/* Compatibilidade com dietas antigas: banco linkado por id, sem cópia própria (não abertas para edição ainda) */}
              {!r.opcoes && !r.itens && r.bancoId && (
                <div className="meta">📚 Banco vinculado — abra em "Editar" para trazer as opções para esta dieta.</div>
              )}
              {!r.opcoes && !r.itens && !r.bancoId && r.alimentos && <div className="meta">{r.alimentos}</div>}
            </div>
          ))}
          {d.observacoes && <p className="meta">{d.observacoes}</p>}
        </div>
      ))}

      {modalAberto && (
        <div className="modal-backdrop" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>{editando ? 'Editar dieta' : 'Nova dieta'}</h1>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={salvar}>
              {!editando && modelos.length > 0 && (
                <>
                  <label>Começar a partir de um modelo</label>
                  <select defaultValue="" onChange={usarModelo}>
                    <option value="">Selecione um modelo pronto...</option>
                    {modelos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                </>
              )}

              <label>Nome da dieta</label>
              <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Dieta de cutting" />

              <ConstrutorDieta
                tiposAtivos={tiposAtivos}
                onToggleTipo={toggleTipo}
                refeicoesPorTipo={form.refeicoesPorTipo}
                onSetItens={setItens}
                opcoesPorTipo={form.opcoesPorTipo}
                bancoOrigemPorTipo={form.bancoOrigemPorTipo}
                onEscolherBanco={escolherBanco}
                onSetOpcoes={setOpcoes}
                bancos={bancos}
                catalogo={catalogo}
              />

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
