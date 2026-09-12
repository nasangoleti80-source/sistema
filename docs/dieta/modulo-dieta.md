# Módulo de dieta

O nutricionista que atende com a gente (Dr. Guilherme Moura, CRN3 56142) entrega
as dietas em PDF: quatro ou cinco refeições e, páginas depois, uma lista de
substitutos para cada uma. O aluno lê "café da manhã: pão com ovo" e, para saber
o que pode comer no lugar, precisa virar a página e achar a lista certa.

Este módulo existe para fazer melhor que isso — e a diferença não é visual, é de
informação: no papel o substituto é só um nome, e o aluno tem que acreditar que
trocar não muda nada. Aqui a troca mostra quanto vale.

## O que sustenta a troca

Os substitutos dele são organizados por **base calórica**: um plano de 540 kcal
e outro de 600. Dentro de uma base, todas as opções valem mais ou menos o
mesmo — é isso que permite trocar uma pela outra sem refazer a conta.

As bases são seis: **200, 270, 370 e 450** para café da manhã e lanche da tarde,
**540 e 600** para as refeições maiores.

## Como ele escala uma opção entre bases

Lendo os dois PDFs opção por opção, a regra é sempre a mesma — a proteína fica
parada e o carboidrato/gordura é que cresce:

| Opção        | 540 kcal                      | 600 kcal                      |
|--------------|-------------------------------|-------------------------------|
| Crepioca     | 3 ovos + 75 g tapioca + 100 g | 3 ovos + 85 g tapioca + 125 g |
| Whey + fruta | 1 dose + 3 porções + 50 g aveia | 1 dose + 4 porções + 50 g   |
| Oleaginosa   | 1 dose + 70 g                 | 1 dose + 80 g                 |

Nas bases baixas a âncora também cede, e aí quem decide é ele: na base de 200 a
opção do ovo vira 2 ovos (140 kcal) + 1 fruta (70) = 210.

Daí os três papéis que cada alimento pode ter dentro de uma opção:

- **âncora** — a proteína; o motor não mexe
- **escala** — o que ele ajusta para fechar a base
- **fixo** — entra na conta mas não muda (o café, o tempero)

## Onde cada coisa mora

- `compartilhado/nutricao.js` — a conta e a escala. Roda no servidor e no
  navegador, para a tela somar ao vivo sem uma segunda cópia da regra.
- `server/src/routes/alimentos.js` — o catálogo com valor por 100 g, fonte e
  peso da unidade.
- `web/src/pages/Alimentos.jsx` — onde os valores da tabela entram.
- `web/src/pages/BancosOpcoes.jsx` — onde ele monta as opções de uma base e
  manda o motor fechar a gramatura.
- `web/src/pages/Portal.jsx` — o carrossel que o aluno arrasta.

## As tabelas

As duas publicações estão no repositório como JSON, em `server/src/dados/`,
geradas por `scripts/importar-tabelas.mjs` a partir dos arquivos originais:

| Tabela | Alimentos | Publicação |
|--------|-----------|------------|
| TACO   | 591 | NEPA/UNICAMP, 4ª edição revisada e ampliada, 2011 |
| USDA   | 1274 | Nutritive Value of Foods, HG-72, USDA/ARS, 2002 |

Duas coisas que a conversão resolve e que vale saber:

- A **USDA publica por medida caseira** ("1 slice, 26 g"), não por 100 g. Os
  valores passam por regra de três, e linha sem peso fica de fora — sem o peso
  não há conversão, só chute.
- **"Tr" vira zero e "NA" vira nulo.** Traço é quantidade pequena demais para
  medir; NA é ausência de análise. Gravar zero nos dois lugares afirmaria que o
  alimento não tem aquele nutriente, o que é outra coisa.

Da USDA a hierarquia de títulos não sobrevive à conversão do PDF (os títulos
quebram em várias linhas e se repetem no alto de cada página). O nome montado
serve para achar o alimento na busca; quem identifica de verdade é o código,
que fica gravado no alimento.

Para reimportar:

```
node scripts/importar-tabelas.mjs <taco.md> <usda.md>
```

## O catálogo preenchido

Os 54 alimentos do banco de substitutos estão com valor, em
`server/src/seeds/valoresNutricionais.js`. Cada linha registra de onde o
número veio, e o arquivo é a fonte da verdade: corrigir lá e reimplantar
arruma o catálogo inteiro.

- **41 vieram de tabela** — 28 da TACO e 13 da USDA, com o código gravado.
- **13 são estimativa**, porque nenhuma das duas tabelas tem o item: whey,
  proteína em pó (nas duas formas), barrinha, bebida e iogurte proteicos, os
  dois patês caseiros, requeijão light (nas duas formas), wrap, a porção de
  fruta e os legumes "à vontade". Todos entram marcados como `estimado`, e a
  conta que gerou o valor está escrita na nota do alimento.

Três armadilhas que a busca por nome parecido cria, e que ficaram resolvidas:

| Nome no catálogo | O que parece | O que é |
|---|---|---|
| Pasta de amendoim | USDA 536 | é BISCOITO de amendoim — o certo é USDA 713 |
| Farinha de tapioca | TACO 551 "Tapioca" | é o prato pronto com manteiga — o certo é polvilho doce, TACO 146 |
| Queijo muçarela light | TACO 463 | é a muçarela integral — a light é USDA 70 |

Nenhum entra conferido. O selo é dele.

## Os mínimos práticos

Cada alimento tem um mínimo abaixo do qual deixa de ser aquele alimento:
20 g de farinha de tapioca, 25 g de pão, 40 g de pão sírio. Sem isso o motor
fechava a base com "5 g de farinha de tapioca", que é aritmética certa e
receita que ninguém faz.

É esse mínimo que decide quais opções cabem em cada base — e por isso o
hambúrguer caseiro não existe no banco de 200 kcal: um pão de hambúrguer
sozinho já são 143 kcal, e não existe meio pão.

## Os bancos por base

`server/src/seeds/basesDerivadas.js` monta 200, 270 e 370 a partir do de 450.

| Base | Opções | Média | Pior desvio |
|------|--------|-------|-------------|
| 200 | 9 | 203 kcal | 6% |
| 270 | 15 | 271 kcal | 8% |
| 370 | 21 | 372 kcal | 11% |
| 450 | 15 | 482 kcal | 25% |

O banco de 450 é o dele, com as quantidades que ele prescreveu — não foi
mexido. Pelos valores das tabelas ele dá 482 kcal de média, 7% acima do nome.
Fechar cada opção nos 450 é um clique por opção, se ele quiser.

Duas coisas que o gerador faz:

- **Nas bases baixas a âncora cede**, como ele faz (a opção do ovo tem 3 ovos
  em 450 e 2 ovos mais 1 fruta em 200). A proteína só encolhe quando sozinha
  passa de 70% da base.
- **Opções simples entram nas bases baixas.** Encolher um beirute até 200 kcal
  dava 20 g de pão sírio. As seis opções "S" são combinações de uma proteína
  com um carboidrato, montadas para essas bases — a S1, "ovo com fruta", dá
  216 kcal, que é a regra que ele passou (2 ovos + 1 fruta ≈ 210).

Todo banco gerado carrega o aviso na tela: quem assina é o nutricionista.

## Uma regra que não se negocia

Valor digitado não é valor conferido. Todo alimento entra com `conferido:
false`, e o selo só aparece quando ele marca. Nenhum número chega ao aluno como
se fosse validado sem que o nutricionista tenha olhado — quem assina a dieta é
ele, não o app.
