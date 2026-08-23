# Sistema Nayara — Personal Trainer

Site (funciona no celular e no computador, direto pelo navegador) para organizar
alunos, presença nas aulas e cobranças mensais.

## O que já dá pra fazer

- **Alunos**: cadastrar alunos com tipo de atendimento (presencial na residência,
  presencial na academia, ou consultoria semi-presencial), valor mensal e dia de
  vencimento. Pausar/reativar aluno sem perder o histórico.
- **Presença**: registrar cada aula dada (data, tipo, se foi realizada ou se o
  aluno faltou), com histórico por mês. Resolve o problema de "não sei se ele
  treinou esse mês ou não".
- **Pagamentos**: gerar a cobrança do mês para todos os alunos ativos com um
  clique, marcar como pago (com forma de pagamento), e ver quem está pendente
  ou atrasado automaticamente (compara a data de hoje com o dia de vencimento).
- **Exercícios**: catálogo próprio, em português, com o nome que a academia usa.
  Cada exercício guarda o grupo muscular, o equipamento, **onde o aparelho fica
  na academia** e fotos ou vídeos de execução. A foto é reduzida no navegador
  antes de subir, e o vídeo ganha uma imagem de capa tirada dele mesmo — assim a
  aluna só baixa o vídeo se tocar nele.
- **Treinos**: monta o treino em três níveis — programa → sessão (A, B, C) →
  exercício, com séries, repetições, descanso e RIR. Marca em que dias da semana
  cada sessão acontece, reordena os exercícios e duplica o treino inteiro para
  montar o mês seguinte. Mostra o **volume semanal por grupo muscular** já
  contando quantas vezes cada sessão se repete na semana, e sinaliza os grupos
  abaixo da faixa de referência para hipertrofia.
- **Resumo**: visão geral do mês — quanto já recebeu, quanto falta receber,
  quantas aulas foram dadas, faltas, e situação de cada aluno.

## Como rodar no seu computador

Pré-requisito: [Node.js](https://nodejs.org) instalado (versão 18 ou mais recente).

```bash
npm install       # instala tudo (só precisa fazer uma vez)
npm run dev        # inicia o site em modo de desenvolvimento
```

Depois abra **http://localhost:5173** no navegador.

Tudo fica salvo na pasta `server/data/` (criada automaticamente):

- `db.json` — alunos, presenças, pagamentos, exercícios e treinos
- `midia/` — as fotos e os vídeos dos exercícios

**Faça backup dessa pasta inteira de vez em quando.** É o único lugar onde esses
dados existem, e eles não vão para o git.

## Como colocar no ar (pra acessar do celular fora de casa)

```bash
npm run build      # gera a versão de produção do site
npm start           # sobe um único servidor (site + dados) na porta 3001
```

Isso já roda tudo em um único processo — é o que você hospeda em serviços
como Render, Railway, ou uma VPS simples. Depois de hospedado, o link vai
funcionar tanto no celular quanto no computador, como um site normal.

## Estrutura do projeto

```
server/   -> API (Node + Express), guarda tudo em server/data/
web/      -> Site (React), telas de Resumo, Alunos, Presença, Cobrança e Exercícios
docs/     -> Manual da marca e estudo do app de referência
scripts/  -> Utilitários (baixar as fontes da marca, por exemplo)
```

## Próximos passos sugeridos

O que já existe cobre cadastro, presença, cobrança, catálogo de exercícios e
montagem de treino. As próximas partes podem incluir: o app da aluna (ver o
treino do dia, registrar a carga que usou e mandar vídeo), avaliação física com
histórico, e relatório em PDF para enviar no WhatsApp.
