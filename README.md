# 🎁 Amigo Secreto

Sistema completo para realizar sorteios de amigo secreto de forma segura e fácil!

## ✨ Funcionalidades

- ✅ Adicionar participantes com nome e WhatsApp
- ✅ Validação: ninguém pode tirar a si mesmo
- ✅ Garantia: cada pessoa é escolhida exatamente uma vez
- ✅ Funciona com número par ou ímpar de participantes
- ✅ Links secretos únicos para cada participante
- ✅ Página de revelação com suspense
- ✅ Envio direto via WhatsApp
- ✅ Interface moderna e responsiva

## 🚀 Como Usar Localmente

1. Instale as dependências:
```bash
npm install
```

2. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

3. Acesse `http://localhost:3000`

## 🌐 Deploy na Vercel

### Opção 1: Com Vercel KV (Recomendado)

1. **Crie um projeto na Vercel:**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Configure o Vercel KV:**
   - No dashboard da Vercel, vá em "Storage"
   - Clique em "Create Database" → "KV"
   - Anote as variáveis de ambiente geradas

3. **Instale o pacote:**
   ```bash
   npm install @vercel/kv
   ```

4. **Configure as variáveis de ambiente na Vercel:**
   - Vá em Settings → Environment Variables
   - As variáveis do KV já estarão disponíveis automaticamente

5. **Faça o deploy:**
   ```bash
   vercel --prod
   ```

### Opção 2: Sem Vercel KV (Funciona apenas localmente)

O código já está preparado para funcionar localmente sem KV. Mas na Vercel, sem KV, os dados não serão persistentes (se perderão a cada restart).

## 📋 Requisitos

- Node.js 18+
- npm ou yarn

## 🏗️ Estrutura

```
├── app/
│   ├── api/
│   │   ├── sorteio/          # API para criar sorteio
│   │   └── resultado/[token] # API para buscar resultado
│   ├── resultado/[token]/    # Página de revelação
│   └── page.tsx              # Página principal
├── components/
│   └── FormParticipantes.tsx # Componente principal
├── lib/
│   ├── db.ts                 # Sistema de persistência
│   └── sorteio.ts            # Algoritmo de sorteio
└── data/                     # Dados locais (não commitado)
    └── sorteios.json
```

## 🔒 Segurança

- Cada participante recebe um token único
- Ninguém pode ver o resultado de outros participantes
- Tokens são gerados com UUID v4
- Validação no servidor para garantir integridade

## 📝 Notas

- Os dados são salvos em `data/sorteios.json` localmente
- Na Vercel, os dados são salvos no Vercel KV
- O algoritmo garante que cada pessoa seja escolhida exatamente uma vez
- Funciona perfeitamente com número ímpar de participantes

## 🤝 Contribuindo

Sinta-se livre para sugerir melhorias!
