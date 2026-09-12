# Código compartilhado

O que está aqui roda nos dois lados: no servidor, quando ele gera e valida as
opções de dieta, e no navegador, quando a tela precisa somar as calorias
enquanto o nutricionista digita.

A conta é uma só de propósito. Enquanto ela existia só no servidor, a tela
teria que refazer a mesma matemática para mostrar um total ao vivo — e duas
cópias da mesma regra desandam na primeira correção. O bug de unidade contada
(fatia, dose, colher) teria que ser corrigido duas vezes.

São módulos ESM puros, sem dependência: `node --test` roda direto e o Vite
empacota sem configuração.
