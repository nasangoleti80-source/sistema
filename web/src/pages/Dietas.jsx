import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, TIPOS_REFEICAO, UNIDADES_ALIMENTO } from '../api.js';
import ConstrutorDieta from '../components/ConstrutorDieta.jsx';

function formVazio() {
  return { nome: '', observacoes: '', refeicoesPorTipo: {}, bancoPorTipo: {} };
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
    setForm(formVazio());
    setErro('');
    setModalAberto(true);
  }

  function usarModelo(e) {
    const modeloId = e.target.value;
    if (!modeloId) return;
    const modelo = modelos.find((m) => m.id === modeloId);
    if (!modelo) return;
    const refeicoesPorTipo = {};
    const bancoPorTipo = {};
    for (const r of modelo.refeicoes || []) {
      if (r.bancoId) bancoPorTipo[r.tipo] = r.bancoId;
      else refeicoesPorTipo[r.tipo] = r.itens || [];
    }
    setForm((f) => ({ ...f, nome: f.nome || modelo.nome, refeicoesPorTipo, bancoPorTipo }));
    e.target.value = '';
  }

  function toggleTipo(tipo) {
    setForm((f) => {
      const ativo = f.refeicoesPorTipo[tipo] !== undefined || f.bancoPorTipo[tipo] !== undefined;
      if (ativo) {
        const { [tipo]: _r, ...refeicoesPorTipo } = f.refeicoesPorTipo;
        const { [tipo]: _b, ...bancoPorTipo } = f.bancoPorTipo;
        return { ...f, refeicoesPorTipo, bancoPorTipo };
      }
      return { ...f, refeicoesPorTipo: { ...f.refeicoesPorTipo, [tipo]: [] } };
    });
  }

  function setItens(tipo, itens) {
    setForm((f) => ({ ...f, refeicoesPorTipo: { ...f.refeicoesPorTipo, [tipo]: itens } }));
  }

  function setBanco(tipo, bancoId) {
    setForm((f) => {
      const bancoPorTipo = { ...f.bancoPorTipo };
      const refeicoesPorTipo = { ...f.refeicoesPorTipo };
      if (bancoId) {
        bancoPorTipo[tipo] = bancoId;
        delete refeicoesPorTipo[tipo];
      } else {
        delete bancoPorTipo[tipo];
        refeicoesPorTipo[tipo] = [];
      }
      return { ...f, bancoPorTipo, refeicoesPorTipo };
    });
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      const tiposAtivos = [...new Set([...Object.keys(form.refeicoesPorTipo), ...Object.keys(form.bancoPorTipo)])];
      const refeicoes = tiposAtivos
        .map((tipo) => {
          if (form.bancoPorTipo[tipo]) return { tipo, nome: TIPOS_REFEICAO[tipo], bancoId: form.bancoPorTipo[tipo] };
          const itens = (form.refeicoesPorTipo[tipo] || [])
            .map((it) => ({ ...it, opcoes: it.opcoes.filter((op) => op.alimentoId) }))
            .filter((it) => it.opcoes.length > 0);
          return { tipo, nome: TIPOS_REFEICAO[tipo], itens };
        })
        .filter((r) => r.bancoId || (r.itens && r.itens.length > 0));

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

  const tiposAtivos = [...new Set([...Object.keys(form.refeicoesPorTipo), ...Object.keys(form.bancoPorTipo)])];

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
          {(d.refeicoes || []).map((r, i) => {
            const banco = r.bancoId ? bancos.find((b) => b.id === r.bancoId) : null;
            return (
              <div key={i} className="card" style={{ background: 'var(--bg)' }}>
                <div className="name">{TIPOS_REFEICAO[r.tipo] || r.nome}</div>
                {banco && (
                  <div className="meta">
                    📚 Banco "{banco.nome}" — {banco.opcoes?.length || 0} opção(ões): {banco.opcoes?.map((o) => o.nome).join(', ')}
                  </div>
                )}
                {!banco && (r.itens || []).map((item, j) => (
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
                {!r.itens && !banco && r.alimentos && <div className="meta">{r.alimentos}</div>}
              </div>
            );
          })}
          {d.observacoes && <p className="meta">{d.observacoes}</p>}
        </div>
      ))}

      {modalAberto && (
        <div className="modal-backdrop" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>Nova dieta</h1>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={salvar}>
              {modelos.length > 0 && (
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
                bancoPorTipo={form.bancoPorTipo}
                onSetBanco={setBanco}
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
