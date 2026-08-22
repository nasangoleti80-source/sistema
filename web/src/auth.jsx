import { createContext, useContext, useEffect, useState } from 'react';
import { getSessao, limparSessao } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(() => getSessao());

  useEffect(() => {
    function aoExpirar() {
      setSessao(null);
    }
    window.addEventListener('sessao-expirada', aoExpirar);
    return () => window.removeEventListener('sessao-expirada', aoExpirar);
  }, []);

  function entrar(dados) {
    setSessao(dados);
  }

  function sair() {
    limparSessao();
    setSessao(null);
  }

  return (
    <AuthContext.Provider value={{ sessao, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
