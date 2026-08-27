import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';

function idLocal() {
  return Math.random().toString(36).slice(2, 10);
}

function refeicaoVazia() {
  return { id: idLocal(), nome: '', horario: '', itens: [], substituicoes: [] };
}

const FATORES_ATIVIDADE = {
  sedentario: { label: 'Sedentário (pouco ou nenhum exercício)', fator: 1.2 },
  leve: { label: 'Leve (1 a 3x por semana)', fator: 1.375 },
  moderado: { label: 'Moderado (3 a 5x por semana)', fator: 1.55 },
  intenso: { label: 'Intenso (6 a 7x por semana)', fator: 1.725 },
  muitoIntenso: { label: 'Muito intenso (treino + trabalho físico)', fator: 1.9 },
};

const OBJETIVOS = {
  emagrecimento: { label: 'Emagrecimento (déficit 20%)', ajuste: 0.8 },
  manutencao: { label: 'Manutenção', ajuste: 1 },
  hipertrofia: { label: 'Hipertrofia (superávit 10%)', ajuste: 1.1 },
};

function calcularMacros(calc) {
  const peso = Number(calc.peso);
  const altura = Number(calc.altura);
  const idade = Number(calc.idade);
  if (!peso || !altura || !idade) return null;
  const bmr = calc.sexo === 'F' ? 10 * peso + 6.25 * altura - 5 * idade - 161 : 10 * peso + 6.25 * altura - 5 * idade + 5;
  const tdee = bmr * FATORES_ATIVIDADE[calc.atividade].fator;
  const calorias = Math.round(tdee * OBJETIVOS[calc.objetivo].ajuste);
  const proteina = Math.round(peso * 2);
  const gordura = Math.round(peso * 0.9);
  const carboidrato = Math.max(0, Math.round((calorias - proteina * 4 - gordura * 9) / 4));
  return { calorias, proteina, gordura, carboidrato };
}

function ListaItens({ itens, onAdicionar, onRemover, placeholder }) {
  const [novo, setNovo] = useState({ alimento: '', quantidade: '' });
  return (
    <div>
      {itens.map((item, idx) => (
        <div className="list-item" key={item.id}>
          <span>{item.alimento} {item.quantidade && `· ${item.quantidade}`}</span>
          <button type="button" className="btn-secondary btn-small" onClick={() => onRemover(idx)}>×</button>
        </div>
      ))}
      <div className="row" style={{ marginTop: 8, gap: 6 }}>
        <input
          placeholder={placeholder || 'Alimento'}
          value={novo.alimento}
          onChange={(e) => setNovo({ ...novo, alimento: e.target.value })}
          style={{ flex: 2 }}
        />
        <input
          placeholder="Qtd"
          value={novo.quantidade}
          onChange={(e) => setNovo({ ...novo, quantidade: e.target.value })}
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="btn-secondary btn-small"
          onClick={() => {
            if (!novo.alimento.trim()) return;
            onAdicionar({ id: idLocal(), alimento: novo.alimento.trim(), quantidade: novo.quantidade.trim() });
            setNovo({ alimento: '', quantidade: '' });
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function DietaAluno() {
  const { id } = useParams();
  const [aluno, setAluno] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [orientacoes, setOrientacoes] = useState('');
  const [metas, setMetas] = useState({ calorias: '', proteina: '', carboidrato: '', gordura: '' });
  const [refeicoes, setRefeicoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState('');
  const [mostrarCalc, setMostrarCalc] = useState(false);
  const [calc, setCalc] = useState({ peso: '', altura: '', idade: '', sexo: 'F', atividade: 'moderado', objetivo: 'emagrecimento' });
  const [grupoEscolhido, setGrupoEscolhido] = useState({});

  useEffect(() => {
    setCarregando(true);
    Promise.all([api.obterAluno(id), api.obterDieta(id), api.listarGruposAlimentos()])
      .then(([a, d, gs]) => {
        setAluno(a);
        setGrupos(gs);
        if (d) {
          setOrientacoes(d.orientacoes || '');
          setMetas(d.metas || { calorias: '', proteina: '', carboidrato: '', gordura: '' });
          setRefeicoes(d.refeicoes?.length ? d.refeicoes : [refeicaoVazia()]);
        } else {
          setRefeicoes([refeicaoVazia()]);
        }
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [id]);

  const resultado = calcularMacros(calc);

  function usarResultadoCalculado() {
    if (!resultado) return;
    setMetas({
      calorias: String(resultado.calorias),
      proteina: `${resultado.proteina}g`,
      carboidrato: `${resultado.carboidrato}g`,
      gordura: `${resultado.gordura}g`,
    });
  }

  function atualizarRefeicao(idx, campo, valor) {
    setRefeicoes((lista) => lista.map((r, i) => (i === idx ? { ...r, [campo]: valor } : r)));
  }

  function adicionarRefeicao() {
    setRefeicoes((lista) => [...lista, refeicaoVazia()]);
  }

  function removerRefeicao(idx) {
    setRefeicoes((lista) => lista.filter((_, i) => i !== idx));
  }

  function adicionarItemRefeicao(idx, campo, item) {
    setRefeicoes((lista) => lista.map((r, i) => (i === idx ? { ...r, [campo]: [...r[campo], item] } : r)));
  }

  function removerItemRefeicao(idx, campo, itemIdx) {
    setRefeicoes((lista) =>
      lista.map((r, i) => (i === idx ? { ...r, [campo]: r[campo].filter((_, j) => j !== itemIdx) } : r))
    );
  }

  function adicionarGrupoComoSubstituicao(idx) {
    const grupoId = grupoEscolhido[idx];
    const grupo = grupos.find((g) => g.id === grupoId);
    if (!grupo) return;
    setRefeicoes((lista) =>
      lista.map((r, i) =>
        i === idx
          ? { ...r, substituicoes: [...r.substituicoes, ...grupo.itens.map((it) => ({ id: idLocal(), alimento: it.alimento, quantidade: it.quantidade }))] }
          : r
      )
    );
  }

  async function salvar() {
    setErro('');
    setSalvando(true);
    try {
      const validas = refeicoes.filter((r) => r.nome.trim());
      await api.salvarDieta(id, { orientacoes, metas, refeicoes: validas });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <p className="empty">Carregando...</p>;

  return (
    <div>
      <Link to="/alunos" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>‹ Voltar pra Alunos</Link>
      <h1>Dieta de {aluno?.nome}</h1>
      <p className="subtitle">O aluno vê as orientações e as refeições. As metas ficam só com você.</p>

      {erro && <div className="error-msg">{erro}</div>}

      <div className="row" style={{ marginBottom: 10 }}>
        <button type="button" className="btn-secondary btn-small" onClick={() => setMostrarCalc(!mostrarCalc)}>
          {mostrarCalc ? 'Fechar calculadora' : 'Calculadora de dieta'}
        </button>
        <Link to="/banco-alimentos"><button type="button" className="btn-secondary btn-small">Banco de alimentos</button></Link>
      </div>

      {mostrarCalc && (
        <div className="card">
          <label>Peso (kg)</label>
          <input type="number" value={calc.peso} onChange={(e) => setCalc({ ...calc, peso: e.target.value })} />
          <label>Altura (cm)</label>
          <input type="number" value={calc.altura} onChange={(e) => setCalc({ ...calc, altura: e.target.value })} />
          <label>Idade</label>
          <input type="number" value={calc.idade} onChange={(e) => setCalc({ ...calc, idade: e.target.value })} />
          <label>Sexo</label>
          <select value={calc.sexo} onChange={(e) => setCalc({ ...calc, sexo: e.target.value })}>
            <option value="F">Feminino</option>
            <option value="M">Masculino</option>
          </select>
          <label>Nível de atividade</label>
          <select value={calc.atividade} onChange={(e) => setCalc({ ...calc, atividade: e.target.value })}>
            {Object.entries(FATORES_ATIVIDADE).map(([v, o]) => (
              <option key={v} value={v}>{o.label}</option>
            ))}
          </select>
          <label>Objetivo</label>
          <select value={calc.objetivo} onChange={(e) => setCalc({ ...calc, objetivo: e.target.value })}>
            {Object.entries(OBJETIVOS).map(([v, o]) => (
              <option key={v} value={v}>{o.label}</option>
            ))}
          </select>

          {resultado && (
            <div className="grid-stats" style={{ marginTop: 14 }}>
              <div className="stat"><div className="value">{resultado.calorias}</div><div className="label">Calorias/dia</div></div>
              <div className="stat"><div className="value">{resultado.proteina}g</div><div className="label">Proteína</div></div>
              <div className="stat"><div className="value">{resultado.carboidrato}g</div><div className="label">Carboidrato</div></div>
              <div className="stat"><div className="value">{resultado.gordura}g</div><div className="label">Gordura</div></div>
            </div>
          )}
          {resultado && (
            <button type="button" className="btn-primary btn-small" style={{ marginTop: 10 }} onClick={usarResultadoCalculado}>
              Usar esses valores como meta
            </button>
          )}
        </div>
      )}

      <label>Metas do dia (só você vê)</label>
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div>
          <label>Calorias</label>
          <input value={metas.calorias} onChange={(e) => setMetas({ ...metas, calorias: e.target.value })} />
        </div>
        <div>
          <label>Proteína</label>
          <input value={metas.proteina} onChange={(e) => setMetas({ ...metas, proteina: e.target.value })} />
        </div>
        <div>
          <label>Carboidrato</label>
          <input value={metas.carboidrato} onChange={(e) => setMetas({ ...metas, carboidrato: e.target.value })} />
        </div>
        <div>
          <label>Gordura</label>
          <input value={metas.gordura} onChange={(e) => setMetas({ ...metas, gordura: e.target.value })} />
        </div>
      </div>

      <label>Orientações principais (o aluno vê isso primeiro)</label>
      <textarea rows={3} value={orientacoes} onChange={(e) => setOrientacoes(e.target.value)} placeholder="Beba bastante água, evite frituras, horários das refeições..." />

      <h2>Refeições</h2>
      {refeicoes.map((r, idx) => (
        <div className="card" key={r.id}>
          <div className="row">
            <input placeholder="Nome (ex: Café da manhã)" value={r.nome} onChange={(e) => atualizarRefeicao(idx, 'nome', e.target.value)} style={{ flex: 2 }} />
            <input placeholder="Horário" value={r.horario} onChange={(e) => atualizarRefeicao(idx, 'horario', e.target.value)} style={{ flex: 1 }} />
          </div>

          <label style={{ marginTop: 12 }}>Alimentos da refeição</label>
          <ListaItens
            itens={r.itens}
            onAdicionar={(item) => adicionarItemRefeicao(idx, 'itens', item)}
            onRemover={(itemIdx) => removerItemRefeicao(idx, 'itens', itemIdx)}
          />

          <label style={{ marginTop: 12 }}>Opções de substituição</label>
          <ListaItens
            itens={r.substituicoes}
            onAdicionar={(item) => adicionarItemRefeicao(idx, 'substituicoes', item)}
            onRemover={(itemIdx) => removerItemRefeicao(idx, 'substituicoes', itemIdx)}
            placeholder="Alimento equivalente"
          />

          {grupos.length > 0 && (
            <div className="row" style={{ marginTop: 8, gap: 6 }}>
              <select
                value={grupoEscolhido[idx] || ''}
                onChange={(e) => setGrupoEscolhido({ ...grupoEscolhido, [idx]: e.target.value })}
                style={{ flex: 1 }}
              >
                <option value="">Adicionar grupo do banco...</option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>{g.nome}</option>
                ))}
              </select>
              <button type="button" className="btn-secondary btn-small" onClick={() => adicionarGrupoComoSubstituicao(idx)}>
                Adicionar
              </button>
            </div>
          )}

          <button type="button" className="btn-secondary btn-small" style={{ marginTop: 12 }} onClick={() => removerRefeicao(idx)}>
            Remover refeição
          </button>
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={adicionarRefeicao}>+ Refeição</button>

      <div className="form-actions">
        <button className="btn-primary" onClick={salvar} disabled={salvando}>
          {salvando ? 'Salvando...' : salvo ? 'Salvo ✓' : 'Salvar dieta'}
        </button>
      </div>
    </div>
  );
}
