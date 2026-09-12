import { useEffect, useState } from 'react';
import {
  api, UNIDADES_ALIMENTO, UNIDADES_CONTADAS, CATEGORIAS_ALIMENTO, FONTES_ALIMENTO,
} from '../api.js';

/**
 * Catálogo de alimentos.
 *
 * Aqui é onde o valor nutricional entra no sistema. Enquanto o alimento tiver
 * só nome e unidade, ele serve para escrever a dieta mas não para calcular, e
 * o motor de bases calóricas não tem com o que trabalhar — por isso a tela diz
 * na cara o que está faltando em cada um.
 *
 * O selo "conferido" é do nutricionista: digitar um número não é o mesmo que
 * validá-lo, e quem assina a dieta é ele.
 */

const NUTRIENTES = [
  { chave: 'kcal', rotulo: 'Calorias', sufixo: 'kcal' },
  { chave: 'proteina', rotulo: 'Proteína', sufixo: 'g' },
  { chave: 'carboidrato', rotulo: 'Carboidrato', sufixo: 'g' },
  { chave: 'gordura', rotulo: 'Gordura', sufixo: 'g' },
  { chave: 'fibra', rotulo: 'Fibra', sufixo: 'g' },
];

const FORM_VAZIO = {
  nome: '', unidade: 'g', quantidadePadrao: '', categoria: 'proteina',
  kcal: '', proteina: '', carboidrato: '', gordura: '', fibra: '',
  fonte: 'TACO', codigoFonte: '', gramasPorUnidade: '', passo: '', minimo: '', maximo: '',
  conferido: false,
};

const texto = (v) => (v === null || v === undefined ? '' : String(v));

/**
 * Busca o alimento na TACO e na USDA e traz os valores prontos.
 *
 * São 132 alimentos na prática dele, cinco números cada um. Digitar isso à
 * mão é meio dia de trabalho e uma chance de errar a cada tecla — e um valor
 * errado aqui contamina toda dieta que usar o alimento. Puxar da tabela
 * elimina as duas coisas e ainda grava o código, então dá sempre para voltar
 * na publicação e conferir de onde o número veio.
 */
function BuscaNaTabela({ nome, onEscolher }) {
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState('');

  async function buscar(e) {
    e?.preventDefault();
    const q = (termo || nome || '').trim();
    if (q.length < 2) {
      setErro('Busque por pelo menos duas letras.');
      return;
    }
    setBuscando(true);
    setErro('');
    try {
      const r = await api.buscarNaTabela(q);
      setResultados(r.resultados);
      if (r.resultados.length === 0) {
        setErro(`Nada com "${q}" nas duas tabelas. Tente o nome como a tabela escreve — "Ovo, de galinha" em vez de "ovo cozido".`);
      }
    } catch (e) {
      setErro(e.message);
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="busca-tabela">
      <label>Buscar na TACO e na USDA</label>
      <div className="row" style={{ gap: 6 }}>
        <input
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscar(e)}
          placeholder={nome ? `${nome}…` : 'Ex: ovo, de galinha'}
          style={{ flex: 1 }}
        />
        <button type="button" className="btn-secondary btn-small" onClick={buscar} disabled={buscando}>
          {buscando ? 'Buscando…' : 'Buscar'}
        </button>
      </div>
      {erro && <p className="meta alerta">{erro}</p>}

      {resultados?.length > 0 && (
        <div className="resultados-tabela">
          {resultados.map((r) => (
            <button
              type="button"
              key={`${r.fonte}-${r.codigo}`}
              className="resultado-tabela"
              onClick={() => { onEscolher(r); setResultados(null); }}
            >
              <span className="resultado-nome">{r.nome}</span>
              <span className="meta num">
                {r.kcal} kcal · {r.proteina ?? '—'} P / {r.carboidrato ?? '—'} C / {r.gordura ?? '—'} G
                {' '}<span className="selo-fonte">{r.fonte} {r.codigo}</span>
              </span>
              {r.gramasDaMedida && (
                <span className="meta">Publicado como {r.medida} ({r.gramasDaMedida} g) — convertido para 100 g</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Alimentos() {
  const [alimentos, setAlimentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [soIncompletos, setSoIncompletos] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      setAlimentos(await api.listarAlimentos());
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  function abrirNovo() {
    setEditando(null);
    setForm(FORM_VAZIO);
    setErro('');
    setModalAberto(true);
  }

  function abrirEdicao(al) {
    setEditando(al);
    const p = al.porcao100 || {};
    setForm({
      nome: al.nome,
      unidade: al.unidade,
      quantidadePadrao: texto(al.quantidadePadrao),
      categoria: al.categoria,
      kcal: texto(p.kcal),
      proteina: texto(p.proteina),
      carboidrato: texto(p.carboidrato),
      gordura: texto(p.gordura),
      fibra: texto(p.fibra),
      fonte: al.fonte || 'TACO',
      codigoFonte: texto(al.codigoFonte),
      gramasPorUnidade: texto(al.gramasPorUnidade),
      passo: texto(al.passo),
      minimo: texto(al.minimo),
      maximo: texto(al.maximo),
      conferido: !!al.conferido,
    });
    setErro('');
    setModalAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    const dados = {
      nome: form.nome,
      unidade: form.unidade,
      quantidadePadrao: form.quantidadePadrao,
      categoria: form.categoria,
      porcao100: Object.fromEntries(NUTRIENTES.map((n) => [n.chave, form[n.chave]])),
      fonte: form.fonte,
      codigoFonte: form.codigoFonte,
      gramasPorUnidade: form.gramasPorUnidade,
      passo: form.passo,
      minimo: form.minimo,
      maximo: form.maximo,
      conferido: form.conferido,
    };
    try {
      if (editando) await api.atualizarAlimento(editando.id, dados);
      else await api.criarAlimento(dados);
      setModalAberto(false);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function excluir(al) {
    if (!confirm(`Excluir "${al.nome}" do catálogo?`)) return;
    await api.removerAlimento(al.id);
    await carregar();
  }

  const lista = alimentos.filter(
    (a) => (!filtroCategoria || a.categoria === filtroCategoria) && (!soIncompletos || a.pendencias?.length)
  );
  const faltando = alimentos.filter((a) => a.pendencias?.length).length;
  const contado = UNIDADES_CONTADAS.includes(form.unidade);

  return (
    <div>
      <h1>Alimentos</h1>
      <p className="subtitle">Catálogo com o valor da TACO e da USDA — é dele que a dieta tira as calorias</p>

      {alimentos.length > 0 && (
        <div className="grid-stats">
          <div className="stat">
            <div className="value">{alimentos.length}</div>
            <div className="label">No catálogo</div>
          </div>
          <div className={`stat ${faltando ? 'amber' : 'green'}`}>
            <div className="value">{faltando}</div>
            <div className="label">Sem valor completo</div>
          </div>
        </div>
      )}

      <div className="row" style={{ marginBottom: 12, gap: 8 }}>
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORIAS_ALIMENTO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button
          className={soIncompletos ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
          onClick={() => setSoIncompletos((s) => !s)}
        >
          Só o que falta
        </button>
        <button className="btn-primary" onClick={abrirNovo}>+ Alimento</button>
      </div>

      {erro && <div className="error-msg">{erro}</div>}
      {carregando && <p className="empty">Carregando...</p>}
      {!carregando && lista.length === 0 && (
        <p className="empty">
          {soIncompletos
            ? 'Todo alimento do catálogo já está com valor e fonte. '
            : 'Nenhum alimento cadastrado ainda. Cadastre aqui as opções que vai usar nas dietas.'}
        </p>
      )}

      {lista.length > 0 && (
        <div className="card">
          {lista.map((al) => (
            <div className="list-item" key={al.id}>
              <div onClick={() => abrirEdicao(al)} style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}>
                <div className="name">{al.nome}</div>
                <div className="meta">
                  {CATEGORIAS_ALIMENTO[al.categoria]}
                  {al.porcao100?.kcal ? (
                    <> · <span className="num">{al.porcao100.kcal}</span> kcal/100 {al.unidade === 'ml' ? 'ml' : 'g'}</>
                  ) : ''}
                  {al.fonte ? ` · ${al.fonte}` : ''}
                </div>
                {al.pendencias?.length > 0 && <div className="meta alerta">Falta {al.pendencias.join(', ')}</div>}
              </div>
              {al.conferido && <span className="badge pago">Conferido</span>}
              <button className="btn-danger btn-small" onClick={() => excluir(al)}>Excluir</button>
            </div>
          ))}
        </div>
      )}

      {modalAberto && (
        <div className="modal-backdrop" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>{editando ? 'Editar alimento' : 'Novo alimento'}</h1>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={salvar}>
              <label>Nome *</label>
              <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Peito de frango grelhado" />

              <label>Categoria</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                {Object.entries(CATEGORIAS_ALIMENTO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>

              <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <label>Quantidade padrão</label>
                  <input type="number" min="0" step="0.1" value={form.quantidadePadrao} onChange={(e) => setForm({ ...form, quantidadePadrao: e.target.value })} placeholder="150" />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Unidade</label>
                  <select value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })}>
                    {Object.entries(UNIDADES_ALIMENTO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>

              {contado && (
                <>
                  <label>Peso de 1 {UNIDADES_ALIMENTO[form.unidade]} (g) *</label>
                  <input
                    type="number" min="0" step="0.1" value={form.gramasPorUnidade}
                    onChange={(e) => setForm({ ...form, gramasPorUnidade: e.target.value })}
                    placeholder="Ovo ≈ 50 · fatia de pão ≈ 25 · dose de whey ≈ 30"
                  />
                  <p className="meta">A tabela dá o valor por 100 g. Sem esse peso não dá para saber quanto vale uma {UNIDADES_ALIMENTO[form.unidade]}.</p>
                </>
              )}

              <h2>Por 100 {form.unidade === 'ml' ? 'ml' : 'g'}</h2>
              <BuscaNaTabela
                nome={form.nome}
                onEscolher={(r) =>
                  setForm((f) => ({
                    ...f,
                    kcal: texto(r.kcal),
                    proteina: texto(r.proteina),
                    carboidrato: texto(r.carboidrato),
                    gordura: texto(r.gordura),
                    fibra: texto(r.fibra),
                    fonte: r.fonte,
                    codigoFonte: `${r.fonte} ${r.codigo}`,
                    // Valor da tabela ainda não é valor conferido: é ele quem
                    // decide se aquele item é mesmo o alimento da dieta.
                    conferido: false,
                  }))
                }
              />
              <div className="grid-nutrientes">
                {NUTRIENTES.map((n) => (
                  <div key={n.chave}>
                    <label>{n.rotulo} ({n.sufixo})</label>
                    <input
                      type="number" min="0" step="0.1" inputMode="decimal"
                      value={form[n.chave]}
                      onChange={(e) => setForm({ ...form, [n.chave]: e.target.value })}
                    />
                  </div>
                ))}
              </div>

              <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <label>Fonte</label>
                  <select value={form.fonte} onChange={(e) => setForm({ ...form, fonte: e.target.value })}>
                    {Object.entries(FONTES_ALIMENTO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label>Código na tabela</label>
                  <input value={form.codigoFonte} onChange={(e) => setForm({ ...form, codigoFonte: e.target.value })} placeholder="Ex: TACO 231" />
                </div>
              </div>

              <h2>Como esse alimento escala</h2>
              <p className="meta">
                Quando o motor ajusta a opção para fechar em 200, 270, 370, 450, 540 ou 600 kcal, ele arredonda
                no passo e respeita os limites daqui.
              </p>
              <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <label>Passo</label>
                  <input type="number" min="0" step="0.5" value={form.passo} onChange={(e) => setForm({ ...form, passo: e.target.value })} placeholder={contado ? '1' : '5'} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Mínimo</label>
                  <input type="number" min="0" step="0.5" value={form.minimo} onChange={(e) => setForm({ ...form, minimo: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Máximo</label>
                  <input type="number" min="0" step="0.5" value={form.maximo} onChange={(e) => setForm({ ...form, maximo: e.target.value })} />
                </div>
              </div>

              <label className="check-linha">
                <input type="checkbox" checked={form.conferido} onChange={(e) => setForm({ ...form, conferido: e.target.checked })} />
                <span>Valor conferido na tabela pelo nutricionista</span>
              </label>

              <div className="form-actions">
                <button type="submit" className="btn-primary">Salvar</button>
                <button type="button" className="btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
