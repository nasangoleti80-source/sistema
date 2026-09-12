import { useEffect, useState } from 'react';
import { api, PERIODICIDADES, formatarMoeda } from '../api.js';

const FORM_VAZIO = { titulo: '', categoria: '', videoUrl: '', capaUrl: '' };
const PLANO_VAZIO = { nome: '', preco: '', periodicidade: 'mensal', destaque: false };

export default function Conteudos() {
  const [secao, setSecao] = useState('videos');

  const [conteudos, setConteudos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState('');

  const [planos, setPlanos] = useState([]);
  const [modalPlanoAberto, setModalPlanoAberto] = useState(false);
  const [editandoPlano, setEditandoPlano] = useState(null);
  const [formPlano, setFormPlano] = useState(PLANO_VAZIO);
  const [erroPlano, setErroPlano] = useState('');

  async function carregar() {
    setCarregando(true);
    try {
      const [c, p] = await Promise.all([api.listarConteudos(), api.listarPlanos()]);
      setConteudos(c);
      setPlanos(p);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  function abrirNovo(categoria) {
    setEditando(null);
    setForm({ ...FORM_VAZIO, categoria: categoria || '' });
    setErro('');
    setModalAberto(true);
  }

  function abrirEdicao(c) {
    setEditando(c);
    setForm({ titulo: c.titulo, categoria: c.categoria, videoUrl: c.videoUrl, capaUrl: c.capaUrl || '' });
    setErro('');
    setModalAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      if (editando) await api.atualizarConteudo(editando.id, form);
      else await api.criarConteudo(form);
      setModalAberto(false);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function excluir(c) {
    if (!confirm(`Excluir "${c.titulo}"?`)) return;
    await api.removerConteudo(c.id);
    await carregar();
  }

  function abrirNovoPlano() {
    setEditandoPlano(null);
    setFormPlano(PLANO_VAZIO);
    setErroPlano('');
    setModalPlanoAberto(true);
  }

  function abrirEdicaoPlano(p) {
    setEditandoPlano(p);
    setFormPlano({ nome: p.nome, preco: String(p.preco), periodicidade: p.periodicidade, destaque: !!p.destaque });
    setErroPlano('');
    setModalPlanoAberto(true);
  }

  async function salvarPlano(e) {
    e.preventDefault();
    setErroPlano('');
    try {
      if (editandoPlano) await api.atualizarPlano(editandoPlano.id, formPlano);
      else await api.criarPlano(formPlano);
      setModalPlanoAberto(false);
      await carregar();
    } catch (e) {
      setErroPlano(e.message);
    }
  }

  async function excluirPlano(p) {
    if (!confirm(`Excluir o plano "${p.nome}"?`)) return;
    await api.removerPlano(p.id);
    await carregar();
  }

  const categorias = [...new Set(conteudos.map((c) => c.categoria))];

  return (
    <div>
      <h1>PlayFlix</h1>
      <p className="subtitle">
        Vídeos que ficam liberados no portal para quem tem pacote ativo, organizados por categoria — estilo Netflix.
        Quem não tem pacote ativo vê a vitrine de vendas, com os planos abaixo, sem acesso aos vídeos.
      </p>

      <div className="row" style={{ gap: 6, marginBottom: 12 }}>
        <button className={secao === 'videos' ? 'btn-primary btn-small' : 'btn-secondary btn-small'} onClick={() => setSecao('videos')}>Vídeos</button>
        <button className={secao === 'planos' ? 'btn-primary btn-small' : 'btn-secondary btn-small'} onClick={() => setSecao('planos')}>Planos (vitrine de preços)</button>
      </div>

      {carregando && <p className="empty">Carregando...</p>}

      {!carregando && secao === 'videos' && (
        <>
          <div className="row" style={{ marginBottom: 12, gap: 8 }}>
            <button className="btn-primary" onClick={() => abrirNovo()}>+ Vídeo</button>
          </div>

          {conteudos.length === 0 && (
            <p className="empty">Nenhum vídeo cadastrado ainda. Cole o link do YouTube e escolha uma categoria — ela vira uma fileira no portal do aluno.</p>
          )}

          {categorias.map((cat) => (
            <div className="card" key={cat}>
              <div className="row">
                <div className="name">{cat}</div>
                <button className="btn-secondary btn-small" onClick={() => abrirNovo(cat)}>+ Nessa categoria</button>
              </div>
              {conteudos.filter((c) => c.categoria === cat).map((c) => (
                <div className="list-item" key={c.id}>
                  {c.capaUrl && <img src={c.capaUrl} alt="" style={{ width: 64, height: 36, objectFit: 'cover', borderRadius: 6, marginRight: 10 }} />}
                  <div onClick={() => abrirEdicao(c)} style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}>
                    <div className="name">{c.titulo}</div>
                  </div>
                  <button className="btn-danger btn-small" onClick={() => excluir(c)}>Excluir</button>
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {!carregando && secao === 'planos' && (
        <>
          <p className="meta" style={{ marginBottom: 10 }}>
            Esses planos aparecem só como vitrine de vendas na tela de quem não tem pacote ativo. Ao clicar em
            "Quero esse plano", a aluna manda uma mensagem pra você pelo chat — o fechamento e o pagamento
            continuam manuais, do jeito que já são em Pacotes.
          </p>
          <div className="row" style={{ marginBottom: 12, gap: 8 }}>
            <button className="btn-primary" onClick={abrirNovoPlano}>+ Plano</button>
          </div>

          {planos.length === 0 && <p className="empty">Nenhum plano cadastrado ainda.</p>}

          <div className="card">
            {planos.map((p) => (
              <div className="list-item" key={p.id}>
                <div onClick={() => abrirEdicaoPlano(p)} style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}>
                  <div className="name">{p.nome} {p.destaque ? '⭐ Mais vendido' : ''}</div>
                  <div className="meta">{formatarMoeda(p.preco)}/mês · {PERIODICIDADES[p.periodicidade] || p.periodicidade}</div>
                </div>
                <button className="btn-danger btn-small" onClick={() => excluirPlano(p)}>Excluir</button>
              </div>
            ))}
          </div>
        </>
      )}

      {modalAberto && (
        <div className="modal-backdrop" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>{editando ? 'Editar vídeo' : 'Novo vídeo'}</h1>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={salvar}>
              <label>Título *</label>
              <input required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Aula de Pilates — Iniciante" />

              <label>Categoria *</label>
              <input required list="categorias-conteudo" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Ex: Pilates, Defesa Pessoal, Meditação" />
              <datalist id="categorias-conteudo">
                {categorias.map((c) => <option key={c} value={c} />)}
              </datalist>

              <label>Link do vídeo (YouTube) *</label>
              <input required value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />

              <label>Capa (opcional — se vazio, usa a capa do YouTube)</label>
              <input value={form.capaUrl} onChange={(e) => setForm({ ...form, capaUrl: e.target.value })} placeholder="https://..." />

              <div className="form-actions">
                <button type="submit" className="btn-primary">Salvar</button>
                <button type="button" className="btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalPlanoAberto && (
        <div className="modal-backdrop" onClick={() => setModalPlanoAberto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>{editandoPlano ? 'Editar plano' : 'Novo plano'}</h1>
            {erroPlano && <div className="error-msg">{erroPlano}</div>}
            <form onSubmit={salvarPlano}>
              <label>Nome *</label>
              <input required value={formPlano.nome} onChange={(e) => setFormPlano({ ...formPlano, nome: e.target.value })} placeholder="Ex: Plano Mensal" />

              <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <label>Preço (R$) *</label>
                  <input required type="number" min="0" step="0.01" value={formPlano.preco} onChange={(e) => setFormPlano({ ...formPlano, preco: e.target.value })} placeholder="64.90" />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Periodicidade</label>
                  <select value={formPlano.periodicidade} onChange={(e) => setFormPlano({ ...formPlano, periodicidade: e.target.value })}>
                    {Object.entries(PERIODICIDADES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>

              <label className="row" style={{ gap: 8, alignItems: 'center', marginTop: 8 }}>
                <input type="checkbox" checked={formPlano.destaque} onChange={(e) => setFormPlano({ ...formPlano, destaque: e.target.checked })} style={{ width: 'auto' }} />
                Destacar como "Mais vendido"
              </label>

              <div className="form-actions">
                <button type="submit" className="btn-primary">Salvar</button>
                <button type="button" className="btn-secondary" onClick={() => setModalPlanoAberto(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
