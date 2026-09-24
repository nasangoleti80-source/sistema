import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import ChatThread from '../components/ChatThread.jsx';

export default function ChatAluno() {
  const { id } = useParams();
  const [aluno, setAluno] = useState(null);

  useEffect(() => {
    api.obterAluno(id).then(setAluno).catch(() => {});
  }, [id]);

  const carregar = useCallback(() => api.obterConversa(id), [id]);
  const enviarTexto = useCallback((texto) => api.enviarMensagem(id, texto), [id]);
  const enviarMidia = useCallback((arquivo) => api.enviarMensagemMidia(id, arquivo), [id]);

  return (
    <ChatThread
      meuPapel="treinador"
      carregar={carregar}
      enviarTexto={enviarTexto}
      enviarMidia={enviarMidia}
      titulo={`Conversa com ${aluno?.nome || ''}`}
      topo={<Link to="/chat" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>‹ Voltar pras conversas</Link>}
    />
  );
}
