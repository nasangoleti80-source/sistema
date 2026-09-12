import { FAIXA_HIPERTROFIA } from '../api.js';

// Interpola entre o cinza neutro do cartão (--sup-2) e o azul de ação da marca
// (--azul-claro) conforme a série da semana se aproxima da meta de hipertrofia.
function corDaZona(series, meta) {
  const t = Math.max(0, Math.min(1, series / meta));
  const c1 = [0x16, 0x20, 0x2c];
  const c2 = [0x6f, 0xa8, 0xdc];
  const [r, g, b] = c1.map((v, i) => Math.round(v + (c2[i] - v) * t));
  return `rgb(${r}, ${g}, ${b})`;
}

// Duas presets de proporção — só o suficiente pra diferenciar silhueta
// masculina e feminina num desenho estilizado, sem pretensão anatômica.
const PROPORCOES = {
  masculino: { ombroX: 34, quadrilX: 20, cabeloRaio: 0 },
  feminino: { ombroX: 26, quadrilX: 26, cabeloRaio: 8 },
};

const ZONAS_LABEL = {
  ombros: 'Ombros', peito: 'Peito', biceps: 'Braços', abdomen: 'Abdômen',
  quadriceps: 'Coxas', panturrilha: 'Panturrilhas',
};

/**
 * O bonequinho que vai "pintando" conforme a aluna cumpre a semana de treino
 * — cada zona visível de frente fica mais forte quanto mais perto ela chega
 * da meta de séries semanais (mesma faixa de hipertrofia usada no resto do
 * app). O que não aparece de frente (costas, glúteo, posterior de coxa)
 * some da silhueta e vira só uma lista ao lado.
 */
export default function Bonequinho({ sexo = 'masculino', volumes, metaSeries = FAIXA_HIPERTROFIA.minimo }) {
  const p = PROPORCOES[sexo] || PROPORCOES.masculino;
  const cx = 100;
  const neutro = 'var(--sup-2)';
  const linha = 'var(--linha)';

  const zona = (nome) => corDaZona(volumes?.[nome] || 0, metaSeries);

  return (
    <svg viewBox="0 0 200 340" width="100%" style={{ maxWidth: 190, display: 'block', margin: '0 auto' }}>
      {/* cabeça e cabelo (silhueta feminina ganha um contorno de cabelo) */}
      {p.cabeloRaio > 0 && (
        <ellipse cx={cx} cy={26} rx={22 + p.cabeloRaio * 0.4} ry={30 + p.cabeloRaio} fill={linha} />
      )}
      <ellipse cx={cx} cy={28} rx={20} ry={24} fill={neutro} stroke={linha} strokeWidth="1.5" />

      {/* pescoço */}
      <rect x={cx - 8} y={48} width="16" height="14" fill={neutro} />

      {/* ombros */}
      <ellipse cx={cx - p.ombroX} cy={76} rx={20} ry={16} fill={zona('ombros')} stroke={linha} strokeWidth="1.5" />
      <ellipse cx={cx + p.ombroX} cy={76} rx={20} ry={16} fill={zona('ombros')} stroke={linha} strokeWidth="1.5" />

      {/* peito */}
      <rect x={cx - 32} y={66} width="64" height="52" rx="18" fill={zona('peito')} stroke={linha} strokeWidth="1.5" />

      {/* braços (bíceps) */}
      <rect x={cx - p.ombroX - 12} y={86} width="20" height="68" rx="10" fill={zona('biceps')} stroke={linha} strokeWidth="1.5" />
      <rect x={cx + p.ombroX - 8} y={86} width="20" height="68" rx="10" fill={zona('biceps')} stroke={linha} strokeWidth="1.5" />

      {/* abdômen */}
      <rect x={cx - 24} y={116} width="48" height="52" rx="12" fill={zona('abdomen')} stroke={linha} strokeWidth="1.5" />

      {/* quadril — neutro, só liga o tronco às pernas */}
      <rect x={cx - 30 - p.quadrilX + 30} y={166} width={60 + (p.quadrilX - 20)} height="26" rx="14" fill={neutro} stroke={linha} strokeWidth="1.5" />

      {/* coxas (quadríceps) */}
      <rect x={cx - 28} y={192} width="24" height="72" rx="12" fill={zona('quadriceps')} stroke={linha} strokeWidth="1.5" />
      <rect x={cx + 4} y={192} width="24" height="72" rx="12" fill={zona('quadriceps')} stroke={linha} strokeWidth="1.5" />

      {/* panturrilhas */}
      <rect x={cx - 26} y={268} width="20" height="58" rx="9" fill={zona('panturrilha')} stroke={linha} strokeWidth="1.5" />
      <rect x={cx + 6} y={268} width="20" height="58" rx="9" fill={zona('panturrilha')} stroke={linha} strokeWidth="1.5" />

      {/* pés */}
      <ellipse cx={cx - 16} cy={330} rx={12} ry={7} fill={neutro} stroke={linha} strokeWidth="1.5" />
      <ellipse cx={cx + 16} cy={330} rx={12} ry={7} fill={neutro} stroke={linha} strokeWidth="1.5" />
    </svg>
  );
}

/** Legenda com a série da semana por zona — mesmos nomes usados no bonequinho. */
export function LegendaBonequinho({ volumes, costas, metaSeries = FAIXA_HIPERTROFIA.minimo }) {
  return (
    <div className="bonequinho-legenda">
      {Object.entries(ZONAS_LABEL).map(([zona, label]) => (
        <div key={zona} className="bonequinho-item">
          <span className="bonequinho-ponto" style={{ background: corDaZona(volumes?.[zona] || 0, metaSeries) }} />
          <span>{label}</span>
          <span className="bonequinho-serie">{volumes?.[zona] || 0}/{metaSeries} séries</span>
        </div>
      ))}
      <div className="bonequinho-item">
        <span className="bonequinho-ponto" style={{ background: corDaZona(costas || 0, metaSeries) }} />
        <span>Costas e glúteo</span>
        <span className="bonequinho-serie">{costas || 0}/{metaSeries} séries</span>
      </div>
    </div>
  );
}
