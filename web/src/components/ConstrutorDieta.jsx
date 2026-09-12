import { TIPOS_REFEICAO } from '../api.js';
import EditorItens from './EditorItens.jsx';

// Dentro de uma refeição vinculada a um banco, cada opção é editada com o
// mesmo EditorItens usado em Bancos de Opções — mas aqui é uma cópia só
// desta dieta: mudar a quantidade não afeta o banco original nem outros
// alunos que também usam esse banco.
function EditorOpcoesRefeicao({ opcoes, catalogo, onChange }) {
  function addOpcao() {
    onChange([...opcoes, { id: crypto.randomUUID(), nome: `Opção ${opcoes.length + 1}`, itens: [] }]);
  }

  function removerOpcao(id) {
    onChange(opcoes.filter((o) => o.id !== id));
  }

  function renomearOpcao(id, nome) {
    onChange(opcoes.map((o) => (o.id === id ? { ...o, nome } : o)));
  }

  function setItensOpcao(id, itens) {
    onChange(opcoes.map((o) => (o.id === id ? { ...o, itens } : o)));
  }

  function setFotoOpcao(id, fotoUrl) {
    onChange(opcoes.map((o) => (o.id === id ? { ...o, fotoUrl } : o)));
  }

  function escolherFoto(id, arquivo) {
    if (!arquivo) return;
    const reader = new FileReader();
    reader.onload = () => setFotoOpcao(id, reader.result);
    reader.readAsDataURL(arquivo);
  }

  return (
    <>
      {opcoes.map((op) => (
        <div className="card opcao-refeicao" key={op.id}>
          <div className="row" style={{ gap: 8 }}>
            <input style={{ flex: 1 }} value={op.nome} onChange={(e) => renomearOpcao(op.id, e.target.value)} placeholder="Nome da opção" />
            {opcoes.length > 1 && (
              <button type="button" className="btn-danger btn-small" onClick={() => removerOpcao(op.id)}>Remover opção</button>
            )}
          </div>

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
            rotuloItem="Alimento nesta opção"
          />
        </div>
      ))}
      <button type="button" className="btn-secondary btn-small" style={{ marginTop: 8 }} onClick={addOpcao}>
        + Opção
      </button>
    </>
  );
}

// Monta os blocos de refeição de uma dieta ou de um modelo de dieta.
// Cada refeição ativa pode ser montada com itens manuais (um único alimento
// por vez, com opções de troca próprias) OU vinculada a um banco de opções —
// nesse caso as opções completas do banco são copiadas para dentro da
// própria dieta (um clique só, sem escolher opção por opção) e ficam livres
// para ajustar quantidade sem mexer no banco original.
export default function ConstrutorDieta({
  tiposAtivos, onToggleTipo,
  refeicoesPorTipo, onSetItens,
  opcoesPorTipo, bancoOrigemPorTipo, onEscolherBanco, onSetOpcoes,
  horarioPorTipo, onSetHorario,
  bancos, catalogo,
}) {
  return (
    <>
      <label>Refeições deste plano</label>
      <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'flex-start', gap: 6 }}>
        {Object.entries(TIPOS_REFEICAO).map(([tipo, label]) => (
          <button type="button" key={tipo}
            className={tiposAtivos.includes(tipo) ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
            onClick={() => onToggleTipo(tipo)}>
            {label}
          </button>
        ))}
      </div>

      {tiposAtivos.map((tipo) => {
        const opcoes = opcoesPorTipo[tipo];
        return (
          <div key={tipo} className="card" style={{ background: 'var(--bg)', marginTop: 12 }}>
            <div className="row" style={{ alignItems: 'flex-start', gap: 8 }}>
              <input
                type="time"
                value={horarioPorTipo[tipo] || ''}
                onChange={(e) => onSetHorario(tipo, e.target.value)}
                style={{ width: 100, flex: '0 0 auto' }}
              />
              <div className="name" style={{ flex: 1 }}>{TIPOS_REFEICAO[tipo]}</div>
              <select
                style={{ width: 'auto', flex: '0 0 auto' }}
                value={bancoOrigemPorTipo[tipo] || ''}
                onChange={(e) => onEscolherBanco(tipo, e.target.value || null)}
              >
                <option value="">Montar na hora</option>
                {bancos.map((b) => (
                  <option key={b.id} value={b.id}>📚 {b.nome}</option>
                ))}
              </select>
            </div>

            {opcoes ? (
              <>
                <p className="dica" style={{ marginTop: 8 }}>
                  Todas as opções do banco já vieram para cá — dá para ajustar quantidade ou adicionar/remover
                  sem afetar o banco original. O aluno arrasta para o lado para trocar entre elas.
                </p>
                <EditorOpcoesRefeicao opcoes={opcoes} catalogo={catalogo} onChange={(op) => onSetOpcoes(tipo, op)} />
              </>
            ) : (
              <EditorItens
                itens={refeicoesPorTipo[tipo] || []}
                catalogo={catalogo}
                onChange={(itens) => onSetItens(tipo, itens)}
                rotuloItem="Item nesta refeição"
              />
            )}
          </div>
        );
      })}
    </>
  );
}
