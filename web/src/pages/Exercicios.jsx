import { useEffect, useRef, useState } from 'react';
import { api, GRUPOS_MUSCULARES, capaDoExercicio, formatarTamanho } from '../api.js';
import { ehVideo, extrairCapa, prepararFoto } from '../midia.js';

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
  const [enviando, setEnviando] = useState('');
  const [filtro, setFiltro] = useState('');
  const entradaArquivo = useRef(null);

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
      const salvo =
        aberto === 'novo' ? await api.criarExercicio(form) : await api.atualizarExercicio(aberto.id, form);
      await carregar();
      setAberto(salvo); // segue aberto para ela já mandar a foto
    } catch (e) {
      setErro(e.message);
    }
  }

  async function excluir() {
    if (!confirm(`Excluir "${aberto.nome}"? As fotos e vídeos dele também vão embora.`)) return;
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

  async function enviarArquivos(lista) {
    setErro('');
    for (const arquivo of lista) {
      try {
        if (ehVideo(arquivo)) {
          setEnviando('Enviando o vídeo…');
          const item = await api.enviarMidia(aberto.id, arquivo);

          // Capa é um extra: se o navegador não decodificar, o vídeo vale assim mesmo.
          setEnviando('Pegando a imagem de capa…');
          const capa = await extrairCapa(arquivo);
          if (capa) await api.enviarMidia(aberto.id, capa, { capaDe: item.id });
        } else {
          setEnviando('Preparando a foto…');
          const foto = await prepararFoto(arquivo);
          setEnviando('Enviando a foto…');
          await api.enviarMidia(aberto.id, foto);
        }
      } catch (e) {
        setErro(e.message);
      }
    }
    setEnviando('');
    const atualizados = await api.listarExercicios();
    setExercicios(atualizados);
    setAberto(atualizados.find((x) => x.id === aberto.id) || null);
  }

  async function apagarMidia(midiaId) {
    if (!confirm('Remover este arquivo?')) return;
    await api.removerMidia(aberto.id, midiaId);
    const atualizados = await api.listarExercicios();
    setExercicios(atualizados);
    setAberto(atualizados.find((x) => x.id === aberto.id) || null);
  }

  const termo = filtro.trim().toLowerCase();
  const lista = termo
    ? exercicios.filter(
        (e) =>
          e.nome.toLowerCase().includes(termo) ||
          (GRUPOS_MUSCULARES[e.grupoMuscular] || '').toLowerCase().includes(termo)
      )
    : exercicios;

  const comMidia = exercicios.filter((e) => e.midia?.length).length;

  return (
    <div>
      <h1>
        Seus <em>exercícios</em>
      </h1>
      <p className="subtitle">
        O que a aluna vê quando abre o treino. Uma foto do aparelho e a dica de onde ele fica já
        resolvem a maior parte do medo de chegar na academia.
      </p>

      {erro && <div className="error-msg">{erro}</div>}

      {exercicios.length > 0 && (
        <div className="grid-stats">
          <div className="stat">
            <div className="value">{exercicios.length}</div>
            <div className="label">Cadastrados</div>
          </div>
          <div className={`stat ${comMidia === exercicios.length ? 'green' : 'amber'}`}>
            <div className="value">{comMidia}</div>
            <div className="label">Com foto ou vídeo</div>
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
            const temVideo = ex.midia?.some((m) => m.tipo === 'video') || Boolean(ex.videoUrl);
            return (
              <button type="button" className="list-item item-exercicio" key={ex.id} onClick={() => abrirEdicao(ex)}>
                <span className="miniatura">
                  {capa ? <img src={capa} alt="" loading="lazy" /> : <span className="miniatura-vazia">sem foto</span>}
                </span>
                <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <span className="name">{ex.nome}</span>
                  <span className="meta">
                    {GRUPOS_MUSCULARES[ex.grupoMuscular] || ex.grupoMuscular}
                  </span>
                </span>
                {temVideo && <span className="badge pago">vídeo</span>}
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

            {aberto === 'novo' ? (
              <p className="empty" style={{ paddingBottom: 8 }}>
                Salve primeiro para poder mandar a foto e o vídeo.
              </p>
            ) : (
              <>
                <h2>Foto e vídeo</h2>

                {!aberto.midia?.length && (
                  <p className="empty" style={{ padding: '18px 10px' }}>
                    Uma foto do aparelho já ajuda muito. O vídeo de execução pode vir depois.
                  </p>
                )}

                {aberto.midia?.length > 0 && (
                  <div className="galeria">
                    {aberto.midia.map((m) => (
                      <figure className="midia" key={m.id}>
                        {m.tipo === 'video' ? (
                          <video
                            src={`/midia/${m.arquivo}`}
                            poster={m.capa ? `/midia/${m.capa}` : undefined}
                            controls
                            playsInline
                            preload="none"
                          />
                        ) : (
                          <img src={`/midia/${m.arquivo}`} alt={m.legenda || ''} loading="lazy" />
                        )}
                        <figcaption>
                          <span className="badge sem-cobranca">{m.tipo}</span>
                          <span className="num">{formatarTamanho(m.bytes)}</span>
                          <button type="button" className="btn-danger btn-small" onClick={() => apagarMidia(m.id)}>
                            Remover
                          </button>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}

                <input
                  ref={entradaArquivo}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    const arquivos = [...e.target.files];
                    e.target.value = ''; // permite reenviar o mesmo arquivo
                    if (arquivos.length) enviarArquivos(arquivos);
                  }}
                />

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={Boolean(enviando)}
                    onClick={() => entradaArquivo.current.click()}
                  >
                    {enviando || 'Adicionar foto ou vídeo'}
                  </button>
                </div>

                <p className="dica">
                  Vídeo até 60 MB. Grave na horizontal, uns 20 segundos, mostrando de onde ela entra
                  no aparelho — a capa sai do próprio vídeo, então a aluna só baixa se tocar.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
