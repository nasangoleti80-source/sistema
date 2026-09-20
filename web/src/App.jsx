import { useEffect, useRef, useState } from 'react';
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Assinatura } from './componentes/Marca.jsx';
import Inicio from './pages/Inicio.jsx';
import GrupoTreino from './pages/GrupoTreino.jsx';
import GrupoFinanceiro from './pages/GrupoFinanceiro.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Alunos from './pages/Alunos.jsx';
import PerfilAluno from './pages/PerfilAluno.jsx';
import Presenca from './pages/Presenca.jsx';
import Pagamentos from './pages/Pagamentos.jsx';
import Avaliacoes from './pages/Avaliacoes.jsx';
import AvaliacoesHub from './pages/AvaliacoesHub.jsx';
import Exercicios from './pages/Exercicios.jsx';
import Treinos from './pages/Treinos.jsx';
import TreinoSessoes from './pages/TreinoSessoes.jsx';
import TreinoSessaoDetalhe from './pages/TreinoSessaoDetalhe.jsx';
import Endurance from './pages/Endurance.jsx';
import Pacotes from './pages/Pacotes.jsx';
import Mensagens from './pages/Mensagens.jsx';
import Dietas from './pages/Dietas.jsx';
import Alimentos from './pages/Alimentos.jsx';
import BancosOpcoes from './pages/BancosOpcoes.jsx';
import ModelosDieta from './pages/ModelosDieta.jsx';
import Conteudos from './pages/Conteudos.jsx';
import Desafios from './pages/Desafios.jsx';
import SaudeConsultoria from './pages/SaudeConsultoria.jsx';
import Portal from './pages/Portal.jsx';

/* Só o que ela abre todo dia. Os outros módulos entram pelo Início, que é o
   índice do sistema — treze abas numa fila rolável não diziam o que era o quê,
   nem o que era dela e o que chegava na aluna. */
const links = [
  { to: '/', label: 'Início', end: true },
  { to: '/alunos', label: 'Alunos' },
  { to: '/presenca', label: 'Presença' },
  { to: '/treinos', label: 'Treinos' },
  { to: '/pagamentos', label: 'Cobranças' },
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

/**
 * "Voltar" que não depende do histórico do navegador — depender dele falha
 * toda vez que a página foi aberta direto (link do WhatsApp, atalho salvo,
 * F5), que é o caso comum no celular. Em vez disso, o próprio app guarda a
 * pilha de rotas visitadas nesta aba, e "voltar" sempre sabe pra onde ir —
 * cai no Início quando não há uma anterior registrada.
 */
function usePilhaDeRotas(pathname) {
  const pilha = useRef([]);

  useEffect(() => {
    const p = pilha.current;
    if (p[p.length - 1] !== pathname) p.push(pathname);
  }, [pathname]);

  return () => {
    const p = pilha.current;
    if (p.length > 1) {
      p.pop();
      return p[p.length - 1];
    }
    return '/';
  };
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isPortal = location.pathname.startsWith('/portal/');
  const isInicio = location.pathname === '/';
  const [tema, setTema] = useTema();
  const paginaAnterior = usePilhaDeRotas(location.pathname);

  return (
    <div className="app">
      <header className="topbar row">
        {/* Em toda página, exceto o portal do aluno (é outro app, com abas
            em vez de rotas — voltar ali não pode cair no painel dela). */}
        {!isPortal && (
          <button type="button" className="botao-voltar" onClick={() => navigate(paginaAnterior())} aria-label="Voltar">
            ←
          </button>
        )}
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
          cabeçalho; no celular o CSS a prende no rodapé. Some no Início — ali
          a escolha já é só entre os 2 cards, sem mais nada competindo. */}
      {!isPortal && !isInicio && (
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
          <Route path="/" element={<Inicio />} />
          <Route path="/grupo/treino" element={<GrupoTreino />} />
          <Route path="/grupo/financeiro" element={<GrupoFinanceiro />} />
          <Route path="/resumo" element={<Dashboard />} />
          <Route path="/alunos" element={<Alunos />} />
          <Route path="/alunos/:alunoId" element={<PerfilAluno />} />
          <Route path="/presenca" element={<Presenca />} />
          <Route path="/pagamentos" element={<Pagamentos />} />
          <Route path="/avaliacoes" element={<AvaliacoesHub />} />
          <Route path="/avaliacoes/:alunoId" element={<Avaliacoes />} />
          <Route path="/exercicios" element={<Exercicios />} />
          <Route path="/treinos" element={<Treinos />} />
          <Route path="/treinos/:treinoId" element={<TreinoSessoes />} />
          <Route path="/treinos/:treinoId/sessoes/:letra" element={<TreinoSessaoDetalhe />} />
          <Route path="/endurance" element={<Endurance />} />
          <Route path="/pacotes" element={<Pacotes />} />
          <Route path="/dietas" element={<Dietas />} />
          <Route path="/alimentos" element={<Alimentos />} />
          <Route path="/bancos-opcoes" element={<BancosOpcoes />} />
          <Route path="/modelos-dieta" element={<ModelosDieta />} />
          <Route path="/mensagens" element={<Mensagens />} />
          <Route path="/conteudos" element={<Conteudos />} />
          <Route path="/desafios" element={<Desafios />} />
          <Route path="/saude-consultoria" element={<SaudeConsultoria />} />
          <Route path="/portal/:alunoId" element={<Portal />} />
        </Routes>
      </main>
    </div>
  );
}
