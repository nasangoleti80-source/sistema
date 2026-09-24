import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';

const CAMPOS_MEDIDAS = [
  { chave: 'cintura', label: 'Cintura (cm)' },
  { chave: 'quadril', label: 'Quadril (cm)' },
  { chave: 'braco', label: 'Braço (cm)' },
  { chave: 'coxa', label: 'Coxa (cm)' },
  { chave: 'percentualGordura', label: '% Gordura' },
];

const FORM_VAZIO = {
  data: new Date().toISOString().slice(0, 10),
  peso: '',
  medidas: {},
  observacoesPrivadas: '',
};

const TIPOS_FOTO = { frente: 'Frente', lado: 'Lado', costas: 'Costas', outro: 'Outro' };

function formatarData(dataStr) {
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

export default function AvaliacaoAluno() {
  const { id } = useParams();
  const [aluno, setAluno] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const fileInputs = useRef({});

  async function carregar() {
    setCarregando(true);
    try {
      const [a, lista] = await Promise.all([api.obterAluno(id), api.listarAvaliacoes(id)]);
      setAluno(a);
      setAvaliacoes(lista);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function abrirNova() {
    setForm(FORM_VAZIO);
    setErro('');
    setModalAberto(true);
  }

  async function salvarAvaliacao(e) {
    e.preventDefault();
    setErro('');
    try {
      await api.criarAvaliacao({ alunoId: id, ...form });
      setModalAberto(false);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function excluirAvaliacao(avaliacaoId) {
    if (!confirm('Remover essa avaliação e suas fotos?')) return;
    await api.removerAvaliacao(avaliacaoId);
    await carregar();
  }

  async function enviarFoto(avaliacaoId, arquivo) {
    if (!arquivo) return;
    try {
      await api.enviarFoto(avaliacaoId, id, arquivo, 'geral');
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function alternarVisibilidade(avaliacaoId, foto) {
    await api.atualizarFoto(avaliacaoId, foto.id, { visivelParaAluno: !foto.visivelParaAluno });
    await carregar();
  }

  async function mudarTipoFoto(avaliacaoId, foto, tipo) {
    await api.atualizarFoto(avaliacaoId, foto.id, { tipo });
    await carregar();
  }

  async function removerFoto(avaliacaoId, fotoId) {
    if (!confirm('Remover essa foto?')) return;
    await api.removerFoto(avaliacaoId, fotoId);
    await carregar();
  }

  if (carregando) return <p className="empty">Carregando...</p>;

  return (
    <div>
      <Link to="/alunos" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>‹ Voltar pra Alunos</Link>
      <h1>Avaliação de {aluno?.nome}</h1>
      <p className="subtitle">Só você vê essas anotações. Marque as fotos que quiser mostrar pro aluno como comparação de resultado.</p>

      {erro && <div className="error-msg">{erro}</div>}

      <button className="btn-primary" onClick={abrirNova} style={{ marginBottom: 14 }}>+ Nova avaliação</button>

      {avaliacoes.length === 0 && <p className="empty">Nenhuma avaliação registrada ainda.</p>}

      {avaliacoes.map((av) => (
        <div className="card" key={av.id}>
          <div className="row">
            <div className="name">{formatarData(av.data)}{av.peso ? ` · ${av.peso} kg` : ''}</div>
            <button className="btn-secondary btn-small" onClick={() => excluirAvaliacao(av.id)}>Remover</button>
          </div>

          {Object.keys(av.medidas || {}).length > 0 && (
            <div className="meta" style={{ marginTop: 6 }}>
              {CAMPOS_MEDIDAS.filter((c) => av.medidas[c.chave]).map((c) => `${c.label.split(' (')[0]}: ${av.medidas[c.chave]}`).join(' · ')}
            </div>
          )}

          {av.observacoesPrivadas && (
            <div className="meta" style={{ marginTop: 6, fontStyle: 'italic' }}>"{av.observacoesPrivadas}"</div>
          )}

          <div className="foto-grid">
            {av.fotos.map((foto) => (
              <div className="foto-item" key={foto.id}>
                <img src={api.urlFoto(id, foto.arquivo)} alt={foto.tipo} />
                <span
                  className={`foto-visivel ${foto.visivelParaAluno ? 'on' : ''}`}
                  title={foto.visivelParaAluno ? 'Visível pro aluno' : 'Oculta pro aluno'}
                  onClick={() => alternarVisibilidade(av.id, foto)}
                >
                  {foto.visivelParaAluno ? '✓' : '○'}
                </span>
                <select
                  className="foto-tipo-select"
                  value={foto.tipo}
                  onChange={(e) => mudarTipoFoto(av.id, foto, e.target.value)}
                >
                  {Object.entries(TIPOS_FOTO).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <div className="foto-tipo" onClick={() => removerFoto(av.id, foto.id)}>Remover</div>
              </div>
            ))}
          </div>

          <div className="form-actions" style={{ marginTop: 10 }}>
            <input
              type="file"
              accept="image/*"
              ref={(el) => (fileInputs.current[av.id] = el)}
              style={{ display: 'none' }}
              onChange={(e) => {
                enviarFoto(av.id, e.target.files[0]);
                e.target.value = '';
              }}
            />
            <button type="button" className="btn-secondary btn-small" onClick={() => fileInputs.current[av.id]?.click()}>
              + Adicionar foto
            </button>
          </div>
        </div>
      ))}

      {modalAberto && (
        <div className="modal-backdrop" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>Nova avaliação</h1>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={salvarAvaliacao}>
              <label>Data</label>
              <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />

              <label>Peso (kg)</label>
              <input type="number" step="0.1" value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} />

              {CAMPOS_MEDIDAS.map((c) => (
                <div key={c.chave}>
                  <label>{c.label}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.medidas[c.chave] || ''}
                    onChange={(e) => setForm({ ...form, medidas: { ...form.medidas, [c.chave]: e.target.value } })}
                  />
                </div>
              ))}

              <label>Anotações (só você vê)</label>
              <textarea
                rows={3}
                value={form.observacoesPrivadas}
                onChange={(e) => setForm({ ...form, observacoesPrivadas: e.target.value })}
                placeholder="Evolução, dificuldades, plano pra próxima fase..."
              />

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
