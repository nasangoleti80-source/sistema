import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Alunos from './pages/Alunos.jsx';
import Presenca from './pages/Presenca.jsx';
import Pagamentos from './pages/Pagamentos.jsx';
import TreinoAluno from './pages/TreinoAluno.jsx';
import AvaliacaoAluno from './pages/AvaliacaoAluno.jsx';
import MeuTreino from './pages/MeuTreino.jsx';
import MinhaEvolucao from './pages/MinhaEvolucao.jsx';
import Login from './pages/Login.jsx';
import { useAuth } from './auth.jsx';

const linksTreinador = [
  { to: '/', label: 'Resumo', end: true },
  { to: '/alunos', label: 'Alunos' },
  { to: '/presenca', label: 'Presença' },
  { to: '/pagamentos', label: 'Pagamentos' },
];

const linksAluno = [
  { to: '/', label: 'Meu treino', end: true },
  { to: '/evolucao', label: 'Minha evolução' },
];

export default function App() {
  const { sessao, sair } = useAuth();

  if (!sessao) {
    return <Login />;
  }

  const treinador = sessao.role === 'treinador';
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
              <Route path="/presenca" element={<Presenca />} />
              <Route path="/pagamentos" element={<Pagamentos />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<MeuTreino />} />
              <Route path="/evolucao" element={<MinhaEvolucao />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </main>

      <nav className="tabbar">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
