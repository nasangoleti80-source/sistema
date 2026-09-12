import { useEffect, useId, useState } from 'react';
import { api, UNIDADES_ALIMENTO } from '../api.js';
import { PAPEIS, nutrientesDaTroca, kcalCurto } from '../nutricao.js';

export function novoItemDieta() {
  return { id: crypto.randomUUID(), opcoes: [{ alimentoId: '', nome: '', quantidade: '', unidade: 'g' }] };
}

/**
 * Papel de cada troca quando a opção precisa fechar numa base calórica.
 * A âncora é a proteína, que o nutricionista define e o motor não mexe; o que
 * escala é o carboidrato/gordura; fixo é o acompanhamento que entra na conta
 * mas não muda (o café, o tempero).
 */
const ROTULO_PAPEL = {
  [PAPEIS.ANCORA]: 'Âncora',
  [PAPEIS.ESCALA]: 'Escala',
  [PAPEIS.FIXO]: 'Fixo',
};

/**
 * Editor de "itens" de uma refeição: cada item pode ter várias trocas
 * (frango OU tilápia), cada uma com sua quantidade. Serve para a dieta de um
 * aluno, para o banco de opções e para o modelo de dieta.
 *
 * Passando `alimentosIndexados` a tela mostra as calorias de cada linha
 * enquanto ele digita — e diz quando o alimento está fora do catálogo, porque
 * aí ele não entra em conta nenhuma. `mostrarPapel` só faz sentido onde a
 * opção precisa fechar numa base calórica.
 */
export default function EditorItens({
  itens, catalogo, onChange, rotuloItem = 'Item', mostrarPapel = false, alimentosIndexados,
}) {
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
              ...atual,   // o papel escolhido não se perde ao trocar o alimento
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
              <div className="row linha-alimento">
                <input
                  list={listaId}
                  className="campo-nome"
                  value={op.nome}
                  placeholder="Buscar alimento..."
                  onChange={(e) => digitarAlimento(item.id, idx, e.target.value)}
                />
                <input
                  type="number" min="0" step="0.1" className="campo-qtd"
                  value={op.quantidade}
                  onChange={(e) => setOpcaoCampo(item.id, idx, 'quantidade', e.target.value)}
                  placeholder="qtd"
                />
                <select className="campo-unidade" value={op.unidade} onChange={(e) => setOpcaoCampo(item.id, idx, 'unidade', e.target.value)}>
                  {Object.entries(UNIDADES_ALIMENTO).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                {mostrarPapel && (
                  <select
                    className="campo-papel"
                    value={op.papel || PAPEIS.ESCALA}
                    onChange={(e) => setOpcaoCampo(item.id, idx, 'papel', e.target.value)}
                    title="O que o motor pode ajustar para fechar a base"
                  >
                    {Object.entries(ROTULO_PAPEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                )}
                {item.opcoes.length > 1 && (
                  <button type="button" className="btn-danger btn-small" onClick={() => removerOpcao(item.id, idx)}>×</button>
                )}
              </div>
              {alimentosIndexados && (() => {
                const n = nutrientesDaTroca(op, alimentosIndexados);
                const kcal = kcalCurto(n);
                if (kcal) return <div className="meta num linha-kcal">{kcal}</div>;
                if (op.alimentoId) return <div className="meta alerta">Sem valor nutricional no catálogo</div>;
                if (op.nome?.trim()) return <div className="meta alerta">Fora do catálogo — não entra na conta</div>;
                return null;
              })()}
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
