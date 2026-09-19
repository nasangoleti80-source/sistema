import { Link } from 'react-router-dom';

/** "1 aluno" / "3 alunos" — evita o "aluno(s)" que aparecia na tela. */
export const plural = (n, um, muitos) => `${n} ${n === 1 ? um : muitos}`;

const traco = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' };
export const Icone = ({ d }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" {...traco}>
    {d.map((p, i) => (
      <path key={i} d={p} />
    ))}
  </svg>
);

export const DESENHOS = {
  alunos: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8', 'M22 21v-2a4 4 0 0 0-3-3.9'],
  presenca: ['M3 4h18v18H3z', 'M16 2v4M8 2v4M3 10h18', 'm9 15 2 2 3-3'],
  cobranca: ['M12 2v20', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  pacotes: ['M21 8v13H3V8', 'M1 3h22v5H1z', 'M10 12h4'],
  resumo: ['M3 3v18h18', 'M8 17V9M13 17V5M18 17v-6'],
  treinos: ['M6.5 6.5h11M6.5 17.5h11', 'M4 9V6a2 2 0 1 1 4 0v12a2 2 0 1 1-4 0v-3', 'M16 9V6a2 2 0 1 1 4 0v12a2 2 0 1 1-4 0v-3'],
  endurance: ['M22 12h-4l-3 9L9 3l-3 9H2'],
  dieta: ['M3 11h18', 'M6 11V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4', 'M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8'],
  exercicios: ['M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z', 'M12 9.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7'],
  avaliacoes: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z', 'M14 2v6h6M9 13h6M9 17h4'],
  alimentos: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20', 'M12 6v6l4 2'],
  bancos: ['M3 5h18v4H3zM3 11h18v4H3zM3 17h18v4H3z'],
  modelos: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z'],
  mensagens: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z'],
  conteudos: ['M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z', 'm10 9 5 3-5 3Z'],
  portal: ['M6 2h12a2.5 2.5 0 0 1 2.5 2.5v15A2.5 2.5 0 0 1 18 22H6a2.5 2.5 0 0 1-2.5-2.5v-15A2.5 2.5 0 0 1 6 2Z', 'M11 18h2'],
  desafios: ['M8 21h8', 'M12 17v4', 'M7 4h10v4a5 5 0 0 1-10 0Z', 'M7 6H4a3 3 0 0 0 3 3', 'M17 6h3a3 3 0 0 1-3 3'],
  bolo: ['M4 21v-8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8', 'M4 21h16', 'M9 11V7a3 3 0 0 1 6 0v4', 'M12 4v.01'],
  saude: ['M20.8 8.6c0-3-2.5-5.4-5.5-5.4-2 0-3.8 1.1-4.7 2.7A5.4 5.4 0 0 0 5.9 3.2c-3 0-5.5 2.4-5.5 5.4 0 6.4 8.4 11.3 9.6 12A24 24 0 0 0 20.8 8.6Z', 'M3 12h3l2 4 3-8 2 5h3'],
};

/** Um módulo: para onde vai, o que faz e o número que importa nele. */
export const Modulo = ({ para, icone, nome, oQueE, contagem, alerta }) => (
  <Link to={para} className="modulo">
    <span className="modulo-ic">
      <Icone d={DESENHOS[icone]} />
    </span>
    <span className="modulo-txt">
      <span className="modulo-nome">{nome}</span>
      <span className="modulo-oque">{oQueE}</span>
    </span>
    {contagem !== undefined && contagem !== null && (
      <span className={`modulo-num num ${alerta ? 'alerta' : ''}`}>{contagem}</span>
    )}
  </Link>
);
