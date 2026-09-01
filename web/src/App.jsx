import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { Assinatura } from './componentes/Marca.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Alunos from './pages/Alunos.jsx';
import PerfilAluno from './pages/PerfilAluno.jsx';
import Presenca from './pages/Presenca.jsx';
import Pagamentos from './pages/Pagamentos.jsx';
import Avaliacoes from './pages/Avaliacoes.jsx';
import Exercicios from './pages/Exercicios.jsx';
import Treinos from './pages/Treinos.jsx';
import Endurance from './pages/Endurance.jsx';
import Pacotes from './pages/Pacotes.jsx';
import Mensagens from './pages/Mensagens.jsx';
import Dietas from './pages/Dietas.jsx';
import Alimentos from './pages/Alimentos.jsx';
import BancosOpcoes from './pages/BancosOpcoes.jsx';
import ModelosDieta from './pages/ModelosDieta.jsx';
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
  { to: '/alimentos', label: 'Alimentos' },
  { to: '/bancos-opcoes', label: 'Bancos' },
  { to: '/modelos-dieta', label: 'Modelos' },
  { to: '/mensagens', label: 'Mensagens' },
];

/**
 * O manual da marca manda o app ser escuro ("tema escuro: Instagram, app e
 * hero"), então é esse o padrão de quem nunca escolheu. O claro fica como
 * escolha, para leitura longa e para o chat.
 */
function useTema() {
  const [tema, setTema] = useState(() => localStorage.getItem('tema') || 'dark');

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
        {isPortal ? <span className="brand-portal">Meu treino</span> : <Assinatura />}
        <button
          className="theme-toggle"
          onClick={() => setTema(tema === 'dark' ? 'light' : 'dark')}
          aria-label={tema === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {tema === 'dark' ? '☀' : '☾'}
        </button>
      </header>

      {/* Antes do conteúdo no HTML: em tela larga a barra fica logo abaixo do
          cabeçalho; no celular o CSS a prende no rodapé. */}
      {!isPortal && (
        <nav className="tabbar">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      )}

      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/alunos" element={<Alunos />} />
          <Route path="/alunos/:alunoId" element={<PerfilAluno />} />
          <Route path="/presenca" element={<Presenca />} />
          <Route path="/pagamentos" element={<Pagamentos />} />
          <Route path="/avaliacoes/:alunoId" element={<Avaliacoes />} />
          <Route path="/exercicios" element={<Exercicios />} />
          <Route path="/treinos" element={<Treinos />} />
          <Route path="/endurance" element={<Endurance />} />
          <Route path="/pacotes" element={<Pacotes />} />
          <Route path="/dietas" element={<Dietas />} />
          <Route path="/alimentos" element={<Alimentos />} />
          <Route path="/bancos-opcoes" element={<BancosOpcoes />} />
          <Route path="/modelos-dieta" element={<ModelosDieta />} />
          <Route path="/mensagens" element={<Mensagens />} />
          <Route path="/portal/:alunoId" element={<Portal />} />
        </Routes>
      </main>
    </div>
  );
}
