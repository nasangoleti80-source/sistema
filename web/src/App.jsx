import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Alunos from './pages/Alunos.jsx';
import Presenca from './pages/Presenca.jsx';
import Pagamentos from './pages/Pagamentos.jsx';
import Avaliacoes from './pages/Avaliacoes.jsx';
import Exercicios from './pages/Exercicios.jsx';
import Treinos from './pages/Treinos.jsx';
import Endurance from './pages/Endurance.jsx';
import Pacotes from './pages/Pacotes.jsx';
import Mensagens from './pages/Mensagens.jsx';
import Dietas from './pages/Dietas.jsx';
import Portal from './pages/Portal.jsx';

const links = [
  { to: '/', label: 'Resumo', end: true },
  { to: '/alunos', label: 'Alunos' },
  { to: '/presenca', label: 'Presença' },
  { to: '/treinos', label: 'Treinos' },
  { to: '/endurance', label: 'Endurance' },
  { to: '/exercicios', label: 'Exercícios' },
  { to: '/pacotes', label: 'Pacotes' },
  { to: '/pagamentos', label: 'Cobranças' },
  { to: '/dietas', label: 'Dieta' },
  { to: '/mensagens', label: 'Mensagens' },
];

function useTema() {
  const [tema, setTema] = useState(() => {
    const salvo = localStorage.getItem('tema');
    if (salvo) return salvo;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem('tema', tema);
  }, [tema]);

  return [tema, setTema];
}

export default function App() {
  const location = useLocation();
  const isPortal = location.pathname.startsWith('/portal/');
  const [tema, setTema] = useTema();

  return (
    <div className="app">
      <header className="topbar row">
        <div className="brand">💪 {isPortal ? 'Meu treino' : 'Nayara PT'}</div>
        <button
          className="theme-toggle"
          onClick={() => setTema(tema === 'dark' ? 'light' : 'dark')}
          title={tema === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {tema === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/alunos" element={<Alunos />} />
          <Route path="/presenca" element={<Presenca />} />
          <Route path="/pagamentos" element={<Pagamentos />} />
          <Route path="/avaliacoes/:alunoId" element={<Avaliacoes />} />
          <Route path="/exercicios" element={<Exercicios />} />
          <Route path="/treinos" element={<Treinos />} />
          <Route path="/endurance" element={<Endurance />} />
          <Route path="/pacotes" element={<Pacotes />} />
          <Route path="/dietas" element={<Dietas />} />
          <Route path="/mensagens" element={<Mensagens />} />
          <Route path="/portal/:alunoId" element={<Portal />} />
        </Routes>
      </main>

      {!isPortal && (
        <nav className="tabbar">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
