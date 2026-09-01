import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, FORMAS_PAGAMENTO, formatarMoeda, formatarData } from '../api.js';

const FORM_VAZIO = {
  nomePacote: '', dataInicio: new Date().toISOString().slice(0, 10), duracaoMeses: '1',
  valorTotal: '', formaPagamento: 'pix', parcelas: '1', dataVencimento: new Date().toISOString().slice(0, 10),
  observacoes: '',
};

export default function Pacotes() {
  const [searchParams] = useSearchParams();
  const [alunos, setAlunos] = useState([]);
  const [alunoId, setAlunoId] = useState('');
  const [pacotes, setPacotes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.listarAlunos(true).then((lista) => {
      setAlunos(lista);
      if (lista.length && !alunoId) setAlunoId(searchParams.get('alunoId') || lista[0].id);
    });
    if (searchParams.get('novo') === '1') {
      setForm(FORM_VAZIO);
      setModalAberto(true);
    }
  }, []);

  async function carregar(id) {
    setCarregando(true);
    try {
      setPacotes(await api.listarPacotes(id));
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { if (alunoId) carregar(alunoId); }, [alunoId]);

  function abrirNovo() {
    setForm(FORM_VAZIO);
    setErro('');
    setModalAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      await api.criarPacote({ ...form, alunoId });
      setModalAberto(false);
      await carregar(alunoId);
    } catch (e) {
      setErro(e.message);
    }
  }

  async function marcarPago(pacote) {
    await api.atualizarPacote(pacote.id, { status: 'pago' });
    await carregar(alunoId);
  }

  async function excluir(pacote) {
    if (!confirm(`Excluir o pacote "${pacote.nomePacote}"?`)) return;
    await api.removerPacote(pacote.id);
    await carregar(alunoId);
  }

  return (
    <div>
      <h1>Pacotes e pagamentos</h1>
      <p className="subtitle">Planos vinculados ao tempo pago pelo aluno — PIX ou cartão parcelado, sem taxa da plataforma</p>

      <div className="row" style={{ marginBottom: 12, gap: 8 }}>
        <select value={alunoId} onChange={(e) => setAlunoId(e.target.value)}>
          {alunos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
        <button className="btn-primary" onClick={abrirNovo} disabled={!alunoId}>+ Pacote</button>
      </div>

      {erro && <div className="error-msg">{erro}</div>}
      {carregando && <p className="empty">Carregando...</p>}
      {!carregando && pacotes.length === 0 && <p className="empty">Nenhum pacote cadastrado para este aluno.</p>}

      <div className="card">
        {pacotes.map((p) => (
          <div className="list-item" key={p.id}>
            <div>
              <div className="name">{p.nomePacote} <span className={`badge ${p.status}`}>{p.status}</span></div>
              <div className="meta">
                {formatarMoeda(p.valorTotal)} · {FORMAS_PAGAMENTO[p.formaPagamento]}
                {p.formaPagamento === 'cartao' && p.parcelas > 1 ? ` em ${p.parcelas}x` : ''} ·{' '}
                {p.duracaoMeses} {p.duracaoMeses === 1 ? 'mês' : 'meses'} · vence em {formatarData(p.dataVencimento)} · válido até {formatarData(p.dataFim)}
              </div>
            </div>
            <div className="row" style={{ gap: 6, width: 'auto' }}>
              {p.status !== 'pago' && <button className="btn-secondary btn-small" onClick={() => marcarPago(p)}>Marcar pago</button>}
              <button className="btn-danger btn-small" onClick={() => excluir(p)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>

      {modalAberto && (
        <div className="modal-backdrop" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>Novo pacote</h1>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={salvar}>
              <label>Nome do pacote</label>
              <input required value={form.nomePacote} onChange={(e) => setForm({ ...form, nomePacote: e.target.value })} placeholder="Ex: Consultoria trimestral" />

              <div className="row" style={{ gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label>Início</label>
                  <input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Duração (meses)</label>
                  <input type="number" min="1" value={form.duracaoMeses} onChange={(e) => setForm({ ...form, duracaoMeses: e.target.value })} />
                </div>
              </div>

              <label>Valor total (R$)</label>
              <input type="number" min="0" step="0.01" value={form.valorTotal} onChange={(e) => setForm({ ...form, valorTotal: e.target.value })} />

              <div className="row" style={{ gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label>Forma de pagamento</label>
                  <select value={form.formaPagamento} onChange={(e) => setForm({ ...form, formaPagamento: e.target.value })}>
                    {Object.entries(FORMAS_PAGAMENTO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                {form.formaPagamento === 'cartao' && (
                  <div style={{ flex: 1 }}>
                    <label>Parcelas</label>
                    <input type="number" min="1" max="12" value={form.parcelas} onChange={(e) => setForm({ ...form, parcelas: e.target.value })} />
                  </div>
                )}
              </div>

              <label>Data de vencimento</label>
              <input type="date" value={form.dataVencimento} onChange={(e) => setForm({ ...form, dataVencimento: e.target.value })} />

              <label>Observações</label>
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
