# Fontes da marca

Arquivos `.woff2` das quatro famílias da identidade, servidos pelo próprio
projeto. Só os subconjuntos **latin** e **latin-ext** — é o que o português usa.

Sem isso o app depende do Google Fonts a cada carregamento: quebra a
tipografia da marca quando a rede falha, atrasa a primeira pintura e entrega
o IP de quem abre o app a um terceiro.

## Licença

As quatro são distribuídas sob a **SIL Open Font License 1.1** (texto completo
em `OFL.txt`), que permite uso comercial e redistribuição desde que os avisos
de copyright acompanhem os arquivos:

| Família | Copyright |
|---|---|
| Archivo | Copyright 2020 The Archivo Project Authors — https://github.com/Omnibus-Type/Archivo |
| Archivo Black | Copyright (c) 2019, The Archivo Black Project Authors — https://github.com/Omnibus-Type/ArchivoBlack |
| Instrument Serif | Copyright 2022 The Instrument Serif Project Authors — https://github.com/Instrument/instrument-serif |
| JetBrains Mono | Copyright 2020 The JetBrains Mono Project Authors — https://github.com/JetBrains/JetBrainsMono |

A OFL proíbe vender as fontes isoladamente e usar os nomes reservados numa
versão modificada. Nenhuma das duas coisas se aplica aqui.

## Como atualizar

    node scripts/baixar-fontes.mjs

O script busca o CSS do Google Fonts, baixa só os subconjuntos latin e
latin-ext, regrava `../fontes.css` e substitui os `.woff2` desta pasta.
Rode `npm run build` depois e confira que as quatro famílias ainda aparecem.
