import { FAIXA_HIPERTROFIA } from '../api.js';

/**
 * Bonequinho — silhueta anatômica que vai "acendendo" conforme a aluna cumpre
 * a semana. Substitui o desenho de retângulos/elipses: agora o corpo é um par
 * de paths (tronco+perna e braço) espelhados, com gradiente de pele e de luz,
 * e cada zona muscular é pintada por cima conforme a série da semana.
 *
 * Mesma API de antes: <Bonequinho sexo volumes metaSeries /> e
 * <LegendaBonequinho volumes costas metaSeries />. Zonas inalteradas.
 */

function corDaZona(series, meta) {
  const t = Math.max(0, Math.min(1, series / meta));
  if (t === 0) return 'rgba(239,234,225,.06)';
  const c1 = [0x16, 0x20, 0x2c];
  const c2 = [0x6f, 0xa8, 0xdc];
  const [r, g, b] = c1.map((v, i) => Math.round(v + (c2[i] - v) * t));
  return `rgb(${r}, ${g}, ${b})`;
}

// Proporção: o feminino tem ombro um pouco menor, quadril mais largo e cabelo.
const PROPORCOES = {
  masculino: { ombro: 1.06, quadril: 0.96, cabelo: 0 },
  feminino: { ombro: 0.96, quadril: 1.06, cabelo: 9 },
};

const ZONAS_LABEL = {
  ombros: 'Ombros', peito: 'Peito', biceps: 'Braços', abdomen: 'Abdômen',
  quadriceps: 'Coxas', panturrilha: 'Panturrilhas',
};

// Metade esquerda do corpo, viewBox 220×470. A direita é o espelho.
const TRONCO = 'M110,64 C124,65 138,71 147,82 C152,88 153,97 151,107 C148,121 143,135 140,149 C136,163 134,177 134,191 C136,205 146,215 150,233 C153,249 152,263 148,277 C146,297 143,319 141,341 C140,353 138,361 137,369 C142,381 145,397 143,415 C141,431 135,441 133,451 C132,459 130,465 126,467 L112,467 C113,451 116,437 117,421 C118,401 116,385 114,369 C113,345 112,319 111,297 L110,287 Z';
const BRACO = 'M147,83 C157,89 164,100 165,114 C166,132 163,152 161,172 C159,192 157,210 154,228 C152,242 150,252 146,254 C142,255 140,248 139,238 C137,218 138,200 139,182 C140,164 141,146 142,130 C143,112 143,96 147,83 Z';

const ZONAS = [
  ['ombros', 'M74,90 C64,96 57,106 57,120 C57,132 62,140 70,140 C74,126 76,106 82,96 Z'],
  ['peito', 'M108,100 C95,101 85,107 80,118 C76,130 80,144 92,150 C102,152 107,148 108,142 Z'],
  ['biceps', 'M60,142 C54,150 57,168 61,184 C64,194 70,198 75,194 C76,176 74,158 72,142 Z'],
  ['abdomen', 'M93,156 C99,154 106,155 108,158 L108,176 C105,179 97,179 93,176 Z M93,182 C99,180 106,181 108,184 L108,202 C105,205 97,205 93,202 Z M94,208 C100,206 106,207 108,210 L108,226 C105,229 98,229 94,226 Z M95,232 C100,230 106,231 108,234 L108,248 C105,251 99,251 95,248 Z'],
  ['quadriceps', 'M104,286 C95,290 87,310 85,332 C84,350 87,362 92,364 C97,352 100,322 104,300 Z'],
  ['panturrilha', 'M97,382 C89,388 84,402 85,418 C86,432 91,440 96,438 C99,426 99,402 99,388 Z'],
];

export default function Bonequinho({ sexo = 'masculino', volumes, metaSeries = FAIXA_HIPERTROFIA.minimo }) {
  const p = PROPORCOES[sexo] || PROPORCOES.masculino;
  const espelho = 'translate(220,0) scale(-1,1)';
  const zona = (nome) => corDaZona(volumes?.[nome] || 0, metaSeries);
  const acesa = (nome) => (volumes?.[nome] || 0) >= metaSeries;

  const corpo = (
    <>
      <path d={TRONCO} />
      <path d={BRACO} />
      <g transform={espelho}>
        <path d={TRONCO} />
        <path d={BRACO} />
      </g>
    </>
  );

  return (
    <svg viewBox="0 0 220 470" width="100%" style={{ maxWidth: 200, display: 'block', margin: '0 auto' }}>
      <defs>
        <linearGradient id="bq-pele" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0C131C" />
          <stop offset="0.34" stopColor="#1A2634" />
          <stop offset="0.58" stopColor="#22303F" />
          <stop offset="1" stopColor="#0A1017" />
        </linearGradient>
        <linearGradient id="bq-luz" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(111,168,220,.16)" />
          <stop offset="0.45" stopColor="rgba(111,168,220,0)" />
          <stop offset="1" stopColor="rgba(4,7,11,.45)" />
        </linearGradient>
        <radialGradient id="bq-cabeca" cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#2A3847" />
          <stop offset="1" stopColor="#0B1119" />
        </radialGradient>
        <filter id="bq-brilho" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g stroke="rgba(150,196,236,.24)" strokeWidth="1.1" strokeLinejoin="round">
        {p.cabelo > 0 && (
          <ellipse cx={110} cy={33} rx={21 + p.cabelo * 0.3} ry={25 + p.cabelo} fill="#101924" stroke="none" />
        )}
        <path d="M104,56 C104,68 106,72 110,74 C114,72 116,68 116,56 Z" fill="#141E29" />
        <ellipse cx={110} cy={36} rx={21} ry={25} fill="url(#bq-cabeca)" />
        <g transform={`translate(110,120) scale(${p.ombro},1) translate(-110,-120)`}>
          <g fill="url(#bq-pele)">{corpo}</g>
          <g fill="url(#bq-luz)" stroke="none">{corpo}</g>
        </g>
      </g>

      {/* zonas musculares — pintadas pela série da semana */}
      <g transform={`translate(110,120) scale(${p.ombro},1) translate(-110,-120)`}>
        {ZONAS.map(([nome, d]) => {
          const props = {
            fill: zona(nome),
            opacity: 0.92,
            stroke: 'rgba(10,16,24,.35)',
            strokeWidth: 0.8,
            filter: acesa(nome) ? 'url(#bq-brilho)' : undefined,
          };
          return (
            <g key={nome}>
              <path d={d} {...props} />
              <g transform={espelho}>
                <path d={d} {...props} />
              </g>
            </g>
          );
        })}
      </g>
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
