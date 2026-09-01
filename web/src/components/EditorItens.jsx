import { useEffect, useId, useState } from 'react';
import { api, UNIDADES_ALIMENTO } from '../api.js';

export function novoItemDieta() {
  return { id: crypto.randomUUID(), opcoes: [{ alimentoId: '', nome: '', quantidade: '', unidade: 'g' }] };
}

// Editor reutilizável de "itens" de uma refeição/opção: cada item pode ter
// várias opções de troca (ex: frango OU tilápia), cada uma com sua própria
// quantidade. Usado tanto na dieta de um aluno quanto dentro de um banco de
// opções ou de um modelo de dieta.
export default function EditorItens({ itens, catalogo, onChange, rotuloItem = 'Item' }) {
  const uid = useId();
  const listaId = `alimentos-${uid}`;
  const [grupos, setGrupos] = useState([]);
  const [escolhaGrupo, setEscolhaGrupo] = useState({}); // itemId -> grupoId selecionado no seletor

  async function carregarGrupos() {
    setGrupos(await api.listarGruposTroca());
  }

  useEffect(() => { carregarGrupos(); }, []);

  function addItem() {
    onChange([...itens, novoItemDieta()]);
  }

  function removerItem(itemId) {
    onChange(itens.filter((it) => it.id !== itemId));
  }

  function addOpcao(itemId) {
    onChange(
      itens.map((it) =>
        it.id === itemId
          ? { ...it, opcoes: [...it.opcoes, { alimentoId: '', nome: '', quantidade: '', unidade: 'g' }] }
          : it
      )
    );
  }

  function removerOpcao(itemId, idx) {
    onChange(itens.map((it) => (it.id === itemId ? { ...it, opcoes: it.opcoes.filter((_, i) => i !== idx) } : it)));
  }

  function setOpcaoCampo(itemId, idx, campo, valor) {
    onChange(
      itens.map((it) => {
        if (it.id !== itemId) return it;
        const opcoes = [...it.opcoes];
        opcoes[idx] = { ...opcoes[idx], [campo]: valor };
        return { ...it, opcoes };
      })
    );
  }

  // Busca: digita o nome, e se bater com algo do catálogo já preenche
  // quantidade/unidade padrão (só quando a quantidade ainda está vazia, pra
  // não sobrescrever o que já foi ajustado).
  function digitarAlimento(itemId, idx, texto) {
    const alimento = catalogo.find((a) => a.nome.toLowerCase() === texto.trim().toLowerCase());
    onChange(
      itens.map((it) => {
        if (it.id !== itemId) return it;
        const opcoes = [...it.opcoes];
        const atual = opcoes[idx];
        opcoes[idx] = alimento
          ? {
              alimentoId: alimento.id,
              nome: alimento.nome,
              quantidade: atual.quantidade === '' ? alimento.quantidadePadrao ?? '' : atual.quantidade,
              unidade: alimento.unidade,
            }
          : { ...atual, alimentoId: '', nome: texto };
        return { ...it, opcoes };
      })
    );
  }

  function usarGrupo(itemId, grupoId) {
    const grupo = grupos.find((g) => g.id === grupoId);
    if (!grupo) return;
    onChange(
      itens.map((it) =>
        it.id === itemId
          ? { ...it, opcoes: grupo.opcoes.map((op) => ({ ...op })) }
          : it
      )
    );
    setEscolhaGrupo((s) => ({ ...s, [itemId]: '' }));
  }

  async function salvarComoGrupo(item) {
    const opcoesValidas = item.opcoes.filter((op) => op.nome?.trim());
    if (opcoesValidas.length === 0) return;
    const nome = prompt('Nome do bloco de substituição (ex: "Proteína magra"):');
    if (!nome || !nome.trim()) return;
    await api.criarGrupoTroca({ nome, opcoes: opcoesValidas });
    await carregarGrupos();
  }

  return (
    <>
      <datalist id={listaId}>
        {catalogo.map((al) => <option key={al.id} value={al.nome} />)}
      </datalist>

      {itens.map((item) => (
        <div key={item.id} className="card" style={{ marginTop: 8 }}>
          {item.opcoes.map((op, idx) => (
            <div key={idx} style={{ marginBottom: idx < item.opcoes.length - 1 ? 10 : 0 }}>
              {idx > 0 && <div className="meta" style={{ marginBottom: 4 }}>ou:</div>}
              <div className="row" style={{ gap: 6 }}>
                <input
                  list={listaId}
                  style={{ flex: 2 }}
                  value={op.nome}
                  placeholder="Buscar alimento..."
                  onChange={(e) => digitarAlimento(item.id, idx, e.target.value)}
                />
                <input
                  type="number" min="0" step="0.1" style={{ flex: 1 }}
                  value={op.quantidade}
                  onChange={(e) => setOpcaoCampo(item.id, idx, 'quantidade', e.target.value)}
                  placeholder="qtd"
                />
                <select style={{ flex: 1 }} value={op.unidade} onChange={(e) => setOpcaoCampo(item.id, idx, 'unidade', e.target.value)}>
                  {Object.entries(UNIDADES_ALIMENTO).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                {item.opcoes.length > 1 && (
                  <button type="button" className="btn-danger btn-small" onClick={() => removerOpcao(item.id, idx)}>×</button>
                )}
              </div>
            </div>
          ))}

          <div className="row" style={{ marginTop: 8, gap: 6, flexWrap: 'wrap' }}>
            <button type="button" className="btn-secondary btn-small" onClick={() => addOpcao(item.id)}>
              🔀 Opção de troca
            </button>
            {grupos.length > 0 && (
              <select
                value={escolhaGrupo[item.id] || ''}
                onChange={(e) => usarGrupo(item.id, e.target.value)}
                style={{ width: 'auto', flex: '0 0 auto' }}
              >
                <option value="">📦 Usar bloco pronto...</option>
                {grupos.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
              </select>
            )}
            <button type="button" className="btn-secondary btn-small" onClick={() => salvarComoGrupo(item)}>
              💾 Salvar como bloco
            </button>
            <button type="button" className="btn-danger btn-small" onClick={() => removerItem(item.id)}>
              Remover {rotuloItem.toLowerCase()}
            </button>
          </div>
        </div>
      ))}

      <button type="button" className="btn-secondary btn-small" style={{ marginTop: 8 }} onClick={addItem}>
        + {rotuloItem}
      </button>
    </>
  );
}
