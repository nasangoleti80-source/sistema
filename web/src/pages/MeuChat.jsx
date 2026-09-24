import { useCallback } from 'react';
import { api } from '../api.js';
import ChatThread from '../components/ChatThread.jsx';

export default function MeuChat() {
  const carregar = useCallback(() => api.meuChat(), []);
  const enviarTexto = useCallback((texto) => api.enviarMinhaMensagem(texto), []);
  const enviarMidia = useCallback((arquivo) => api.enviarMinhaMidia(arquivo), []);

  return (
    <ChatThread
      meuPapel="aluno"
      carregar={carregar}
      enviarTexto={enviarTexto}
      enviarMidia={enviarMidia}
      titulo="Conversa com a treinadora"
      subtitulo="Manda foto ou vídeo do seu treino pra correção"
    />
  );
}
