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

## O que ainda falta

**As opções das quatro bases novas** (200, 270, 370, 450), montadas a partir
das que ele já usa em 540 e 600. O caminho é:

1. preencher os valores dos alimentos do banco de 450 que já está semeado
   (a busca na tabela faz isso em poucos cliques por alimento);
2. marcar o papel de cada um — âncora, escala ou fixo;
3. duplicar o banco para cada base e usar "fechar na base".

O passo 1 é o único que não dá para automatizar sem risco: casar "Frango" com
uma linha da TACO é escolha dele, não de um algoritmo de nome parecido.

## Uma regra que não se negocia

Valor digitado não é valor conferido. Todo alimento entra com `conferido:
false`, e o selo só aparece quando ele marca. Nenhum número chega ao aluno como
se fosse validado sem que o nutricionista tenha olhado — quem assina a dieta é
ele, não o app.
