import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import EditorItens from '../components/EditorItens.jsx';
import {
  BASES_KCAL, PAPEIS, escalarParaBase, indexarAlimentos, nutrientesDaOpcao, resumoCurto,
} from '../nutricao.js';

function novaOpcao(numero) {
  return { id: crypto.randomUUID(), nome: `Opção ${numero}`, itens: [] };
}

function formVazio() {
  return { nome: '', baseKcal: '', opcoes: [novaOpcao(1)] };
}

/**
 * Quanto a opção está longe da base do banco.
 *
 * O nutricionista trabalha com bases fechadas — 200, 270, 370 e 450 no café e
 * no lanche da tarde; 540 e 600 nas refeições maiores. Todas as opções de um
 * mesmo banco precisam valer mais ou menos o mesmo, senão trocar uma pela
 * outra deixa de ser indiferente, que é a premissa do substituto.
 */
function Aferidor({ opcao, base, catalogo }) {
  const n = nutrientesDaOpcao(opcao, catalogo);
  const resumo = resumoCurto(n);

  if (!n.confiavel) {
    const nomes = n.incompleto.map((i) => i.nome).filter(Boolean);
    return (
      <div className="meta alerta aferidor">
        Não dá para somar ainda{nomes.length ? `: falta valor de ${nomes.join(', ')}` : ' — algum alimento está fora do catálogo'}.
      </div>
    );
  }
  if (!base) return <div className="meta num aferidor">{resumo}</div>;

  const desvio = Math.round(((n.kcal - base) / base) * 100);
  const dentro = Math.abs(desvio) <= 5;
  return (
    <div className={`meta num aferidor ${dentro ? 'no-alvo' : 'alerta'}`}>
      {resumo} · {dentro ? 'na base' : `${desvio > 0 ? '+' : ''}${desvio}% da base de ${base}`}
    </div>
  );
}

export default function BancosOpcoes() {
  const [bancos, setBancos] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(formVazio());
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    try {
      setBancos(await api.listarBancosOpcoes());
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    api.listarAlimentos().then(setCatalogo);
  }, []);

  const alimentosIndexados = useMemo(() => indexarAlimentos(catalogo), [catalogo]);

  /**
   * Ajusta as gramaturas da opção para ela fechar na base do banco.
   *
   * O motor mexe só no que está marcado como "escala" — a âncora é decisão
   * clínica e continua onde ele pôs. Quando não dá (a âncora sozinha já passa
   * da base), a tela diz o motivo em vez de devolver um número torto.
   */
  function fecharNaBase(opcaoId) {
    const base = Number(form.baseKcal);
    if (!base) return;
    const opcao = form.opcoes.find((o) => o.id === opcaoId);
    if (!opcao) return;

    const principais = opcao.itens.map((it) => it.opcoes?.[0]).filter(Boolean);
    const r = escalarParaBase(principais, base, alimentosIndexados);
    if (!r.ok && r.aviso && r.itens === principais) {
      setErro(r.aviso);
      return;
    }

    let i = 0;
    const itens = opcao.itens.map((it) => {
      if (!it.opcoes?.length) return it;
      const opcoes = [...it.opcoes];
      opcoes[0] = r.itens[i++] || opcoes[0];
      return { ...it, opcoes };
    });
    setItensOpcao(opcaoId, itens);
    setErro(r.ok ? '' : r.aviso || '');
  }

  function abrirNovo() {
    setEditando(null);
    setForm(formVazio());
    setErro('');
    setModalAberto(true);
  }

  function abrirEdicao(banco) {
    setEditando(banco);
    setForm({
      nome: banco.nome,
      baseKcal: banco.baseKcal ? String(banco.baseKcal) : '',
      opcoes: banco.opcoes.length ? banco.opcoes : [novaOpcao(1)],
    });
    setErro('');
    setModalAberto(true);
  }

  function addOpcao() {
    setForm((f) => ({ ...f, opcoes: [...f.opcoes, novaOpcao(f.opcoes.length + 1)] }));
  }

  function removerOpcao(id) {
    setForm((f) => ({ ...f, opcoes: f.opcoes.filter((o) => o.id !== id) }));
  }

  function renomearOpcao(id, nome) {
    setForm((f) => ({ ...f, opcoes: f.opcoes.map((o) => (o.id === id ? { ...o, nome } : o)) }));
  }

  function setItensOpcao(id, itens) {
    setForm((f) => ({ ...f, opcoes: f.opcoes.map((o) => (o.id === id ? { ...o, itens } : o)) }));
  }

  function setFotoOpcao(id, fotoUrl) {
    setForm((f) => ({ ...f, opcoes: f.opcoes.map((o) => (o.id === id ? { ...o, fotoUrl } : o)) }));
  }

  function escolherFoto(id, arquivo) {
    if (!arquivo) return;
    const reader = new FileReader();
    reader.onload = () => setFotoOpcao(id, reader.result);
    reader.readAsDataURL(arquivo);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      const opcoesLimpas = form.opcoes
        .map((o) => ({
          ...o,
          itens: o.itens
            .map((it) => ({ ...it, opcoes: it.opcoes.filter((op) => op.nome?.trim()) }))
            .filter((it) => it.opcoes.length > 0),
        }))
        .filter((o) => o.itens.length > 0);
      const dados = { ...form, baseKcal: form.baseKcal ? Number(form.baseKcal) : null, opcoes: opcoesLimpas };
      if (editando) await api.atualizarBancoOpcoes(editando.id, dados);
      else await api.criarBancoOpcoes(dados);
      setModalAberto(false);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function excluir(banco) {
    if (!confirm(`Excluir o banco "${banco.nome}"? Refeições que usam ele ficarão sem opções.`)) return;
    await api.removerBancoOpcoes(banco.id);
    await carregar();
  }

  return (
    <div>
      <h1>Bancos de opções</h1>
      <p className="subtitle">
        Grupos de refeições completas intercambiáveis (ex: "Opção 02", "Opção 03"...) que o aluno escolhe
        inteira — várias refeições podem usar o mesmo banco.
      </p>

      <button className="btn-primary" onClick={abrirNovo} style={{ marginBottom: 12 }}>+ Banco de opções</button>

      {carregando && <p className="empty">Carregando...</p>}
      {!carregando && bancos.length === 0 && <p className="empty">Nenhum banco de opções cadastrado ainda.</p>}

      {bancos.map((b) => (
        <div className="card" key={b.id}>
          <div className="row">
            <div onClick={() => abrirEdicao(b)} style={{ cursor: 'pointer', flex: 1 }}>
              <div className="name">{b.nome}</div>
              <div className="meta">
                {b.opcoes?.length === 1 ? '1 opção' : `${b.opcoes?.length || 0} opções`}
                {b.baseKcal ? <> · base de <span className="num">{b.baseKcal}</span> kcal</> : ''}
              </div>
            </div>
            <button className="btn-danger btn-small" onClick={() => excluir(b)}>Excluir</button>
          </div>
          {b.opcoes?.length > 0 && (
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 10, cursor: 'pointer' }} onClick={() => abrirEdicao(b)}>
              {b.opcoes.map((op) => (
                <span key={op.id} className="chip-avaliacao">{op.nome}</span>
              ))}
            </div>
          )}
        </div>
      ))}

      {modalAberto && (
        <div className="modal-backdrop" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>{editando ? 'Editar banco de opções' : 'Novo banco de opções'}</h1>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={salvar}>
              <label>Nome do banco</label>
              <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Café da manhã e lanche da tarde" />

              <label>Base calórica</label>
              <select value={form.baseKcal} onChange={(e) => setForm({ ...form, baseKcal: e.target.value })}>
                <option value="">Sem base definida</option>
                {BASES_KCAL.map((b) => <option key={b} value={b}>{b} kcal</option>)}
              </select>
              <p className="meta">
                Todas as opções do banco miram nessa base. É o que faz o aluno poder trocar uma pela outra
                sem o plano mudar de tamanho.
              </p>

              {form.opcoes.map((op) => (
                <div key={op.id} className="card" style={{ background: 'var(--bg)', marginTop: 12 }}>
                  <div className="row">
                    <input value={op.nome} onChange={(e) => renomearOpcao(op.id, e.target.value)} style={{ flex: 1 }} />
                    <button type="button" className="btn-danger btn-small" onClick={() => removerOpcao(op.id)}>Excluir opção</button>
                  </div>
                  <Aferidor opcao={op} base={Number(form.baseKcal) || 0} catalogo={alimentosIndexados} />

                  <div className="row" style={{ gap: 8, marginTop: 8, alignItems: 'center' }}>
                    {op.fotoUrl && <img src={op.fotoUrl} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />}
                    <input type="file" accept="image/*" onChange={(e) => escolherFoto(op.id, e.target.files[0])} style={{ flex: 1 }} />
                    {op.fotoUrl && (
                      <button type="button" className="btn-secondary btn-small" onClick={() => setFotoOpcao(op.id, '')}>Remover foto</button>
                    )}
                  </div>

                  <EditorItens
                    itens={op.itens}
                    catalogo={catalogo}
                    onChange={(itens) => setItensOpcao(op.id, itens)}
                    rotuloItem="Alimento"
                    mostrarPapel={!!form.baseKcal}
                    alimentosIndexados={alimentosIndexados}
                  />
                  {form.baseKcal && op.itens.length > 0 && (
                    <button type="button" className="btn-secondary btn-small" style={{ marginTop: 8 }}
                      onClick={() => fecharNaBase(op.id)}>
                      Fechar em {form.baseKcal} kcal
                    </button>
                  )}
                </div>
              ))}

              <button type="button" className="btn-secondary btn-small" style={{ marginTop: 12 }} onClick={addOpcao}>
                + Opção
              </button>

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
