import { UNIDADES_ALIMENTO } from '../api.js';

export function novoItemDieta() {
  return { id: crypto.randomUUID(), opcoes: [{ alimentoId: '', nome: '', quantidade: '', unidade: 'g' }] };
}

// Editor reutilizável de "itens" de uma refeição/opção: cada item pode ter
// várias opções de troca (ex: frango OU tilápia), cada uma com sua própria
// quantidade. Usado tanto na dieta de um aluno quanto dentro de um banco de
// opções ou de um modelo de dieta.
export default function EditorItens({ itens, catalogo, onChange, rotuloItem = 'Item' }) {
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

  function selecionarAlimento(itemId, idx, alimentoId) {
    const alimento = catalogo.find((a) => a.id === alimentoId);
    onChange(
      itens.map((it) => {
        if (it.id !== itemId) return it;
        const opcoes = [...it.opcoes];
        opcoes[idx] = alimento
          ? { alimentoId: alimento.id, nome: alimento.nome, quantidade: alimento.quantidadePadrao ?? '', unidade: alimento.unidade }
          : { alimentoId: '', nome: '', quantidade: '', unidade: 'g' };
        return { ...it, opcoes };
      })
    );
  }

  return (
    <>
      {itens.map((item) => (
        <div key={item.id} className="card" style={{ marginTop: 8 }}>
          {item.opcoes.map((op, idx) => (
            <div key={idx} style={{ marginBottom: idx < item.opcoes.length - 1 ? 10 : 0 }}>
              {idx > 0 && <div className="meta" style={{ marginBottom: 4 }}>ou:</div>}
              <div className="row" style={{ gap: 6 }}>
                <select style={{ flex: 2 }} value={op.alimentoId} onChange={(e) => selecionarAlimento(item.id, idx, e.target.value)}>
                  <option value="">Selecione um alimento...</option>
                  {catalogo.map((al) => (
                    <option key={al.id} value={al.id}>{al.nome}</option>
                  ))}
                </select>
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

          <div className="row" style={{ marginTop: 8, gap: 6 }}>
            <button type="button" className="btn-secondary btn-small" onClick={() => addOpcao(item.id)}>
              🔀 Opção de troca
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
