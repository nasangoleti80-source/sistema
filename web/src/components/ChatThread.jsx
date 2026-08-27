import { useEffect, useRef, useState } from 'react';
import { getToken } from '../api.js';

function comToken(url) {
  return `${url}?token=${encodeURIComponent(getToken())}`;
}

function formatarHora(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatThread({ meuPapel, carregar, enviarTexto, enviarMidia, titulo, subtitulo, topo }) {
  const [mensagens, setMensagens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const fimRef = useRef(null);
  const fileRef = useRef(null);

  async function atualizar(scroll) {
    try {
      const lista = await carregar();
      setMensagens(lista);
      if (scroll) setTimeout(() => fimRef.current?.scrollIntoView({ block: 'end' }), 30);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    atualizar(true);
    const intervalo = setInterval(() => atualizar(false), 4000);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregar]);

  async function enviar(e) {
    e.preventDefault();
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    setErro('');
    try {
      await enviarTexto(texto.trim());
      setTexto('');
      await atualizar(true);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  async function enviarArquivo(arquivo) {
    if (!arquivo || enviando) return;
    setEnviando(true);
    setErro('');
    try {
      await enviarMidia(arquivo);
      await atualizar(true);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      {topo}
      <h1>{titulo}</h1>
      {subtitulo && <p className="subtitle">{subtitulo}</p>}
      {erro && <div className="error-msg">{erro}</div>}

      <div className="chat-messages-box">
        {carregando && <p className="empty">Carregando...</p>}
        {!carregando && mensagens.length === 0 && <p className="empty">Nenhuma mensagem ainda. Mande um "oi"!</p>}
        {mensagens.map((m) => (
          <div key={m.id} className={`chat-bubble ${m.remetente === meuPapel ? 'mine' : 'other'}`}>
            {m.midia && m.midia.tipo === 'video' && <video src={comToken(m.midia.url)} controls />}
            {m.midia && m.midia.tipo === 'imagem' && <img src={comToken(m.midia.url)} alt="" />}
            {m.texto && <div>{m.texto}</div>}
            <div className="chat-time">{formatarHora(m.createdAt)}</div>
          </div>
        ))}
        <div ref={fimRef} />
      </div>

      <form className="chat-input-row" onSubmit={enviar}>
        <input
          type="file"
          accept="image/*,video/*"
          ref={fileRef}
          style={{ display: 'none' }}
          onChange={(e) => {
            enviarArquivo(e.target.files[0]);
            e.target.value = '';
          }}
        />
        <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()} disabled={enviando} title="Enviar foto ou vídeo">
          📎
        </button>
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Digite uma mensagem..."
        />
        <button type="submit" className="btn-primary" disabled={enviando || !texto.trim()}>Enviar</button>
      </form>
    </div>
  );
}
