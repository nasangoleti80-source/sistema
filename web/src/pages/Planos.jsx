import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, PERIODICIDADES, formatarMoeda } from '../api.js';

const MESES_PERIODICIDADE = { mensal: 1, bimestral: 2, trimestral: 3, semestral: 6, anual: 12 };

export default function Planos() {
  const [planos, setPlanos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [novoPlano, setNovoPlano] = useState('');
  const [valores, setValores] = useState({});
  const [salvandoChave, setSalvandoChave] = useState('');

  async function carregar() {
    try {
      const dados = await api.listarPlanos();
      setPlanos(dados);
      const v = {};
      for (const plano of dados) {
        for (const periodicidade of Object.keys(PERIODICIDADES)) {
          const chave = `${plano.id}:${periodicidade}`;
          v[chave] = {
            valorCheio: plano.precos[periodicidade]?.valorCheio ?? '',
            valorDesconto: plano.precos[periodicidade]?.valorDesconto ?? '',
          };
        }
      }
      setValores(v);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function criarPlano(e) {
    e.preventDefault();
    if (!novoPlano.trim()) return;
    try {
      await api.criarPlano(novoPlano.trim());
      setNovoPlano('');
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function removerPlano(id) {
    if (!confirm('Remover esse plano? Alunos que usam ele não serão afetados, só perde a referência de preço.')) return;
    await api.removerPlano(id);
    await carregar();
  }

  async function salvarPreco(planoId, periodicidade) {
    const chave = `${planoId}:${periodicidade}`;
    setSalvandoChave(chave);
    try {
      await api.salvarPrecoPlano(planoId, periodicidade, valores[chave]);
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvandoChave('');
    }
  }

  return (
    <div>
      <Link to="/alunos" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>‹ Voltar pra Alunos</Link>
      <h1>Planos e preços</h1>
      <p className="subtitle">Edite os valores quando quiser. Use "com desconto" pra pix, Black Friday ou eventos.</p>

      {erro && <div className="error-msg">{erro}</div>}

      <form onSubmit={criarPlano} className="row" style={{ marginBottom: 14, gap: 8 }}>
        <input value={novoPlano} onChange={(e) => setNovoPlano(e.target.value)} placeholder="Novo plano (ex: Personal em dupla)" />
        <button type="submit" className="btn-primary btn-small">+ Plano</button>
      </form>

      {carregando && <p className="empty">Carregando...</p>}

      {planos.map((plano) => (
        <div className="card" key={plano.id}>
          <div className="row" style={{ marginBottom: 10 }}>
            <div className="name">{plano.nome}</div>
            <button className="btn-secondary btn-small" onClick={() => removerPlano(plano.id)}>Remover</button>
          </div>

          {Object.entries(PERIODICIDADES).map(([periodicidade, label]) => {
            const chave = `${plano.id}:${periodicidade}`;
            const v = valores[chave] || { valorCheio: '', valorDesconto: '' };
            return (
              <div key={periodicidade} style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
                <div className="meta" style={{ marginBottom: 6, fontWeight: 700 }}>{label}</div>
                <div className="row" style={{ gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ marginTop: 0 }}>Valor cheio (R$)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={v.valorCheio}
                      onChange={(e) => setValores({ ...valores, [chave]: { ...v, valorCheio: e.target.value } })}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ marginTop: 0 }}>Com desconto (pix/black/evento)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={v.valorDesconto}
                      onChange={(e) => setValores({ ...valores, [chave]: { ...v, valorDesconto: e.target.value } })}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-secondary btn-small"
                  style={{ marginTop: 8 }}
                  onClick={() => salvarPreco(plano.id, periodicidade)}
                  disabled={salvandoChave === chave}
                >
                  {salvandoChave === chave ? 'Salvando...' : 'Salvar'}
                </button>
                {plano.precos[periodicidade]?.valorCheio != null && (
                  <span className="meta" style={{ marginLeft: 10 }}>
                    Atual: {formatarMoeda(plano.precos[periodicidade].valorCheio)}
                    {` (≈${formatarMoeda(plano.precos[periodicidade].valorCheio / MESES_PERIODICIDADE[periodicidade])}/mês)`}
                    {plano.precos[periodicidade].valorDesconto != null && ` · com desconto ${formatarMoeda(plano.precos[periodicidade].valorDesconto)}`}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
