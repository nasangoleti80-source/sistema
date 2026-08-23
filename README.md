# Sistema Nayara — Personal Trainer

Site (funciona no celular e no computador, direto pelo navegador) para organizar
alunos, treinos, avaliação física, endurance, pagamentos e comunicação com os
clientes.

## O que já dá pra fazer

- **Alunos**: cadastro completo (nome, telefone, e-mail, data de nascimento com
  idade automática, altura, sexo) e anamnese de saúde (dor/queixas, objetivo,
  condições de saúde, restrições, medicamentos, cirurgias, nível de atividade,
  sono). Pausar/reativar aluno sem perder o histórico. Cada aluno tem um link
  de acesso próprio ("Link do aluno") para o portal dele.
- **Presença**: registrar cada aula dada, com histórico por mês.
- **Avaliação física**: 7 dobras cutâneas (protocolo Jackson & Pollock) e
  medidas de fita, com cálculo automático de IMC, % de gordura, massa gorda e
  massa magra, além de fotos para comparar a evolução do aluno ao longo do
  tempo.
- **Exercícios**: biblioteca com vídeo demonstrativo por exercício, organizada
  por grupo muscular.
- **Treinos (musculação)**: monte manualmente ou com **IA** (Claude), definindo
  objetivo (hipertrofia/emagrecimento/saúde), tipo de periodização (linear,
  ondulatória, linear inversa, blocos), nível do aluno, dias por semana,
  divisão (AB/ABC/ABCD...), duração da sessão, semanas do mesociclo,
  modalidade (musculação/peso do corpo/híbrido), aeróbio e até 3 grupos
  musculares em ênfase. Cada exercício tem séries, repetições, tempo de
  descanso com **cronômetro**, e método de treinamento (cluster-set,
  rest-pause, drop-set, tri-set, bi-set, pirâmide, entre outros). Ao registrar
  o treino feito, o sistema calcula volume de treino, mostra o histórico de
  cargas anteriores por exercício e estima o gasto calórico.
- **Endurance**: planos de corrida, ciclismo, natação e triathlon, gerados com
  **IA**, com nível do atleta, objetivo/prova (5k até ultra 100k ou base sem
  prova), data da prova, modelo de periodização (linear, blocos, polarizado,
  80/20), sessões por semana, progressão de km, dia do longão separado da
  musculação, e treino de força específico estratégico.
- **Pacotes/pagamentos**: planos vinculados ao tempo pago pelo aluno (duração
  em meses), forma de pagamento (PIX ou cartão parcelado), data de vencimento
  visível para você e para o aluno — sem taxa da plataforma (registro manual).
- **Dieta**: monte o plano alimentar do cliente dentro da própria plataforma.
- **Mensagens**: converse com cada cliente direto pelo sistema.
- **Portal do aluno** (`/portal/:alunoId`): tela só para o cliente, sem o menu
  do personal, onde ele vê o treino do dia (com vídeo), o plano de endurance,
  sua evolução (fotos e medidas), a dieta, o vencimento do plano e pode
  conversar por mensagens e marcar o treino como feito.
- **Resumo**: visão geral do mês — recebido, a receber, aulas, faltas,
  aniversariantes da semana e quem treinou ou não treinou no mês.

## IA para montar treinos

A geração automática de treinos e planos de endurance usa a API da Claude.
Para habilitar, defina a variável de ambiente `ANTHROPIC_API_KEY` no servidor
antes de rodar `npm start` (ou no serviço de hospedagem). Sem essa chave, o
restante do sistema funciona normalmente — só a montagem por IA fica
indisponível, mas o treino/endurance ainda pode ser montado manualmente.

## Como rodar no seu computador

Pré-requisito: [Node.js](https://nodejs.org) instalado (versão 18 ou mais recente).

```bash
npm install       # instala tudo (só precisa fazer uma vez)
npm run dev        # inicia o site em modo de desenvolvimento
```

Depois abra **http://localhost:5173** no navegador.

Tudo fica salvo na pasta `server/data/` (criada automaticamente):

- `db.json` — alunos, avaliações, treinos, exercícios, pacotes, dietas e o resto
- `midia/` — as fotos e os vídeos dos exercícios

**Faça backup dessa pasta inteira de vez em quando** — é onde ficam todos os alunos,
treinos, avaliações e pagamentos.

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
server/   -> API (Node + Express), guarda os dados em server/data/db.json
web/      -> Site (React), telas de Alunos, Avaliações, Treinos, Endurance,
             Exercícios, Pacotes, Dieta, Mensagens, Presença, Cobranças,
             Resumo e Portal do aluno
```

## Próximos passos sugeridos

Integração real de cobrança (PIX gerado automaticamente e cartão parcelado
via gateway como Mercado Pago), notificações por WhatsApp/e-mail de
vencimento e lembrete de treino, e login individual dos alunos no portal.
