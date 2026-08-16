import { NavLink, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Alunos from './pages/Alunos.jsx';
import Presenca from './pages/Presenca.jsx';
import Pagamentos from './pages/Pagamentos.jsx';

const links = [
  { to: '/', label: 'Resumo', end: true },
  { to: '/alunos', label: 'Alunos' },
  { to: '/presenca', label: 'Presença' },
  { to: '/pagamentos', label: 'Pagamentos' },
];

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">💪 Nayara PT</div>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/alunos" element={<Alunos />} />
          <Route path="/presenca" element={<Presenca />} />
          <Route path="/pagamentos" element={<Pagamentos />} />
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
