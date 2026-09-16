import { useEffect, useState } from 'react';
import { api, GRUPOS_MUSCULARES, capaDoExercicio } from '../api.js';

const FORM_VAZIO = {
  nome: '',
  grupoMuscular: 'peito',
  descricao: '',
  videoUrl: '',
};

export default function Exercicios() {
  const [exercicios, setExercicios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(null); // exercício em edição, ou 'novo'
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState('');

  async function carregar() {
    try {
      setExercicios(await api.listarExercicios());
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirNovo() {
    setAberto('novo');
    setForm(FORM_VAZIO);
    setErro('');
  }

  function abrirEdicao(ex) {
    setAberto(ex);
    setForm({
      nome: ex.nome,
      grupoMuscular: ex.grupoMuscular,
      descricao: ex.descricao || '',
      videoUrl: ex.videoUrl || '',
    });
    setErro('');
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      aberto === 'novo' ? await api.criarExercicio(form) : await api.atualizarExercicio(aberto.id, form);
      await carregar();
      setAberto(null);
    } catch (e) {
      setErro(e.message);
    }
  }

  async function excluir() {
    if (!confirm(`Excluir "${aberto.nome}"?`)) return;
    try {
      await api.removerExercicio(aberto.id);
    } catch (e) {
      // 409: o exercício aparece em algum treino. A mensagem já diz quais.
      if (!confirm(`${e.message}\n\nExcluir mesmo assim?`)) return;
      await api.removerExercicio(aberto.id, true);
    }
    setAberto(null);
    await carregar();
  }

  const termo = filtro.trim().toLowerCase();
  const lista = termo
    ? exercicios.filter(
        (e) =>
          e.nome.toLowerCase().includes(termo) ||
          (GRUPOS_MUSCULARES[e.grupoMuscular] || '').toLowerCase().includes(termo)
      )
    : exercicios;

  const comVideo = exercicios.filter((e) => e.videoUrl).length;

  return (
    <div>
      <h1>
        Seus <em>exercícios</em>
      </h1>
      <p className="subtitle">
        O que a aluna vê quando abre o treino. Um vídeo de execução já resolve a maior parte da
        dúvida de como fazer certo.
      </p>

      {erro && <div className="error-msg">{erro}</div>}

      {exercicios.length > 0 && (
        <div className="grid-stats">
          <div className="stat">
            <div className="value">{exercicios.length}</div>
            <div className="label">Cadastrados</div>
          </div>
          <div className={`stat ${comVideo === exercicios.length ? 'green' : 'amber'}`}>
            <div className="value">{comVideo}</div>
            <div className="label">Com vídeo</div>
          </div>
        </div>
      )}

      <div className="row" style={{ marginBottom: 14 }}>
        <input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar exercício…"
          style={{ flex: 1 }}
        />
        <button className="btn-primary" onClick={abrirNovo} style={{ flexShrink: 0 }}>
          + Novo
        </button>
      </div>

      {carregando && <p className="empty">Carregando…</p>}

      {!carregando && exercicios.length === 0 && (
        <p className="empty">
          Nenhum exercício ainda. Comece pelos que você mais passa — uns trinta já cobrem quase todo
          treino de iniciante.
        </p>
      )}

      {!carregando && exercicios.length > 0 && lista.length === 0 && (
        <p className="empty">Nada encontrado para “{filtro}”.</p>
      )}

      {lista.length > 0 && (
        <div className="card">
          {lista.map((ex) => {
            const capa = capaDoExercicio(ex);
            return (
              <button type="button" className="list-item item-exercicio" key={ex.id} onClick={() => abrirEdicao(ex)}>
                <span className="miniatura">
                  {capa ? <img src={capa} alt="" loading="lazy" /> : <span className="miniatura-vazia">sem vídeo</span>}
                </span>
                <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <span className="name">{ex.nome}</span>
                  <span className="meta">
                    {GRUPOS_MUSCULARES[ex.grupoMuscular] || ex.grupoMuscular}
                  </span>
                </span>
                {ex.videoUrl && <span className="badge pago">vídeo</span>}
              </button>
            );
          })}
        </div>
      )}

      {aberto && (
        <div className="modal-backdrop" onClick={() => setAberto(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>{aberto === 'novo' ? 'Novo exercício' : aberto.nome}</h1>
            {erro && <div className="error-msg">{erro}</div>}

            <form onSubmit={salvar}>
              <label>Nome *</label>
              <input
                required
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="O nome que a academia usa: puxada alta, voador…"
              />

              <label>Grupo muscular</label>
              <select
                value={form.grupoMuscular}
                onChange={(e) => setForm({ ...form, grupoMuscular: e.target.value })}
              >
                {Object.entries(GRUPOS_MUSCULARES).map(([valor, texto]) => (
                  <option key={valor} value={valor}>
                    {texto}
                  </option>
                ))}
              </select>

              <label>Como fazer</label>
              <textarea
                rows={3}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Onde ficar, o que segurar, o erro mais comum…"
              />

              <label>Link de vídeo (YouTube, opcional)</label>
              <input
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://…"
              />

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Salvar
                </button>
                <button type="button" className="btn-secondary" onClick={() => setAberto(null)}>
                  Fechar
                </button>
                {aberto !== 'novo' && (
                  <button type="button" className="btn-danger" onClick={excluir} style={{ marginLeft: 'auto' }}>
                    Excluir
                  </button>
                )}
              </div>
            </form>

            {form.videoUrl && capaDoExercicio(form) && (
              <a href={form.videoUrl} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 4 }}>
                <img src={capaDoExercicio(form)} alt="" style={{ width: '100%', borderRadius: 'var(--raio-p)' }} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
