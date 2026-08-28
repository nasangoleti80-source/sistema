import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Alunos from './pages/Alunos.jsx';
import Presenca from './pages/Presenca.jsx';
import Pagamentos from './pages/Pagamentos.jsx';
import TreinoAluno from './pages/TreinoAluno.jsx';
import AvaliacaoAluno from './pages/AvaliacaoAluno.jsx';
import DietaAluno from './pages/DietaAluno.jsx';
import AnamneseAluno from './pages/AnamneseAluno.jsx';
import BancoAlimentos from './pages/BancoAlimentos.jsx';
import Premium from './pages/Premium.jsx';
import Planos from './pages/Planos.jsx';
import Chat from './pages/Chat.jsx';
import ChatAluno from './pages/ChatAluno.jsx';
import MeuTreino from './pages/MeuTreino.jsx';
import MinhaEvolucao from './pages/MinhaEvolucao.jsx';
import MinhaDieta from './pages/MinhaDieta.jsx';
import MeuPremium from './pages/MeuPremium.jsx';
import MeuChat from './pages/MeuChat.jsx';
import Login from './pages/Login.jsx';
import { useAuth } from './auth.jsx';
import { api } from './api.js';

const linksTreinador = [
  { to: '/', label: 'Resumo', end: true },
  { to: '/alunos', label: 'Alunos' },
  { to: '/presenca', label: 'Presença' },
  { to: '/pagamentos', label: 'Pagamentos' },
  { to: '/chat', label: 'Chat' },
];

const linksAluno = [
  { to: '/', label: 'Meu treino', end: true },
  { to: '/evolucao', label: 'Evolução' },
  { to: '/dieta', label: 'Dieta' },
  { to: '/premium', label: 'Premium' },
  { to: '/chat', label: 'Chat' },
];

export default function App() {
  const { sessao, sair } = useAuth();
  const [naoLidas, setNaoLidas] = useState(0);
  const treinador = sessao?.role === 'treinador';

  useEffect(() => {
    if (!sessao) return;
    const buscar = () => {
      const chamada = treinador ? api.naoLidasTreinador() : api.minhasNaoLidas();
      chamada.then((r) => setNaoLidas(r.total)).catch(() => {});
    };
    buscar();
    const intervalo = setInterval(buscar, 8000);
    return () => clearInterval(intervalo);
  }, [sessao, treinador]);

  if (!sessao) {
    return <Login />;
  }

  const links = treinador ? linksTreinador : linksAluno;

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-row">
          <div className="brand">💪 Nayara PT{!treinador && ` · ${sessao.nome}`}</div>
          <button className="btn-link" onClick={sair}>Sair</button>
        </div>
      </header>

      <main className="content">
        <Routes>
          {treinador ? (
            <>
              <Route path="/" element={<Dashboard />} />
              <Route path="/alunos" element={<Alunos />} />
              <Route path="/alunos/:id/treino" element={<TreinoAluno />} />
              <Route path="/alunos/:id/avaliacao" element={<AvaliacaoAluno />} />
              <Route path="/alunos/:id/dieta" element={<DietaAluno />} />
              <Route path="/alunos/:id/anamnese" element={<AnamneseAluno />} />
              <Route path="/banco-alimentos" element={<BancoAlimentos />} />
              <Route path="/premium" element={<Premium />} />
              <Route path="/planos" element={<Planos />} />
              <Route path="/presenca" element={<Presenca />} />
              <Route path="/pagamentos" element={<Pagamentos />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat/:id" element={<ChatAluno />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<MeuTreino />} />
              <Route path="/evolucao" element={<MinhaEvolucao />} />
              <Route path="/dieta" element={<MinhaDieta />} />
              <Route path="/premium" element={<MeuPremium />} />
              <Route path="/chat" element={<MeuChat />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </main>

      <nav className="tabbar">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            {l.label}
            {l.to === '/chat' && naoLidas > 0 && <span className="nav-badge">{naoLidas}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
