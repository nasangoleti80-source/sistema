import { useEffect, useState } from 'react';
import { api, mesAtual, formatarMoeda, formatarMesLabel as formatarMes, somarMes } from '../api.js';

const STATUS_LABEL = { pago: 'Pago', pendente: 'Pendente', atrasado: 'Atrasado' };

export default function Pagamentos() {
  const [mes, setMes] = useState(mesAtual());
  const [alunos, setAlunos] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState('');
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ valor: '', status: 'pendente', formaPagamento: '' });

  async function carregar() {
    setCarregando(true);
    try {
      const [listaAlunos, listaPagamentos] = await Promise.all([
        api.listarAlunos('true'),
        api.listarPagamentos({ mes }),
      ]);
      setAlunos(listaAlunos);
      setPagamentos(listaPagamentos);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes]);

  async function gerarCobrancas() {
    setGerando(true);
    setErro('');
    try {
      const resultado = await api.gerarCobrancas(mes);
      await carregar();
      if (resultado.criados === 0) {
        alert('Todos os alunos ativos já têm cobrança gerada neste mês.');
      }
    } catch (e) {
      setErro(e.message);
    } finally {
      setGerando(false);
    }
  }

  function abrirEdicao(pagamento) {
    setEditando(pagamento);
    setForm({
      valor: String(pagamento.valor),
      status: pagamento.status,
      formaPagamento: pagamento.formaPagamento || '',
    });
    setErro('');
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      await api.atualizarPagamento(editando.id, form);
      setEditando(null);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  function nomeAluno(id) {
    return alunos.find((a) => a.id === id)?.nome || '(aluno removido)';
  }

  const alunosSemCobranca = alunos.filter((a) => !pagamentos.some((p) => p.alunoId === a.id));
  const totalRecebido = pagamentos.filter((p) => p.status === 'pago').reduce((s, p) => s + p.valor, 0);
  const totalEmAberto = pagamentos.filter((p) => p.status !== 'pago').reduce((s, p) => s + p.valor, 0);

  return (
    <div>
      <h1>
        A <em>cobrança</em> do mês
      </h1>
      <p className="subtitle">Gere as cobranças de uma vez e marque quem já pagou.</p>

      <div className="month-nav">
        <button onClick={() => setMes(somarMes(mes, -1))}>‹</button>
        <span className="month-label">{formatarMes(mes)}</span>
        <button onClick={() => setMes(somarMes(mes, 1))}>›</button>
      </div>

      {erro && <div className="error-msg">{erro}</div>}

      <div className="grid-stats">
        <div className="stat green">
          <div className="value">{formatarMoeda(totalRecebido)}</div>
          <div className="label">Recebido no mês</div>
        </div>
        <div className="stat amber">
          <div className="value">{formatarMoeda(totalEmAberto)}</div>
          <div className="label">Em aberto</div>
        </div>
      </div>

      {alunosSemCobranca.length > 0 && (
        <div className="card">
          <div className="row">
            <div>
              <strong className="num">{alunosSemCobranca.length}</strong> aluno(s) ainda sem cobrança neste mês
            </div>
            <button className="btn-primary" onClick={gerarCobrancas} disabled={gerando}>
              {gerando ? 'Gerando...' : 'Gerar cobranças'}
            </button>
          </div>
        </div>
      )}

      {carregando && <p className="empty">Carregando...</p>}
      {!carregando && pagamentos.length === 0 && alunosSemCobranca.length === 0 && (
        <p className="empty">Cadastre alunos ativos na aba Alunos para gerar as cobranças do mês.</p>
      )}

      {!carregando && pagamentos.length > 0 && (
        <div className="card">
          {pagamentos.map((p) => (
            <div className="list-item" key={p.id} onClick={() => abrirEdicao(p)} style={{ cursor: 'pointer' }}>
              <div>
                <div className="name">{nomeAluno(p.alunoId)}</div>
                <div className="meta">
                  <span className="num">{formatarMoeda(p.valor)}</span> · vence dia <span className="num">{p.diaVencimento}</span>
                </div>
              </div>
              <span className={`badge ${p.status}`}>{STATUS_LABEL[p.status]}</span>
            </div>
          ))}
        </div>
      )}

      {editando && (
        <div className="modal-backdrop" onClick={() => setEditando(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>{nomeAluno(editando.alunoId)}</h1>
            <p className="subtitle">{formatarMes(mes)}</p>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={salvar}>
              <label>Valor (R$)</label>
              <input type="number" min="0" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />

              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="atrasado">Atrasado</option>
              </select>

              <label>Forma de pagamento</label>
              <input value={form.formaPagamento} onChange={(e) => setForm({ ...form, formaPagamento: e.target.value })} placeholder="Pix, dinheiro, cartão..." />

              <div className="form-actions">
                <button type="submit" className="btn-primary">Salvar</button>
                <button type="button" className="btn-secondary" onClick={() => setEditando(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
