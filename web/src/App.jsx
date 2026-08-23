import { NavLink, Route, Routes } from 'react-router-dom';
import { Assinatura } from './componentes/Marca.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Alunos from './pages/Alunos.jsx';
import Presenca from './pages/Presenca.jsx';
import Pagamentos from './pages/Pagamentos.jsx';
import Exercicios from './pages/Exercicios.jsx';

const traco = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' };

const IconeResumo = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" {...traco}>
    <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
  </svg>
);

const IconeAlunos = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" {...traco}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
  </svg>
);

const IconePresenca = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" {...traco}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18m-9 5 2 2 3-3" />
  </svg>
);

const IconeExercicios = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" {...traco}>
    <path d="M6.5 6.5h11M6.5 17.5h11M4 9V6a2 2 0 1 1 4 0v12a2 2 0 1 1-4 0v-3M16 9V6a2 2 0 1 1 4 0v12a2 2 0 1 1-4 0v-3" />
  </svg>
);

const IconePagamentos = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" {...traco}>
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const abas = [
  { to: '/', label: 'Resumo', end: true, Icone: IconeResumo },
  { to: '/alunos', label: 'Alunos', Icone: IconeAlunos },
  { to: '/presenca', label: 'Presença', Icone: IconePresenca },
  { to: '/pagamentos', label: 'Cobrança', Icone: IconePagamentos },
  { to: '/exercicios', label: 'Exercícios', Icone: IconeExercicios },
];

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <Assinatura />
      </header>

      {/* Vem antes do conteúdo no HTML: em tela larga a barra fica logo abaixo do
          cabeçalho; no celular o CSS a prende no rodapé. */}
      <nav className="tabbar">
        {abas.map(({ to, label, end, Icone }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icone />
            {label}
          </NavLink>
        ))}
      </nav>

      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/alunos" element={<Alunos />} />
          <Route path="/presenca" element={<Presenca />} />
          <Route path="/pagamentos" element={<Pagamentos />} />
          <Route path="/exercicios" element={<Exercicios />} />
        </Routes>
      </main>
    </div>
  );
}
