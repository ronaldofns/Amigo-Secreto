# 🚀 Guia de Deploy na Vercel

## Pré-requisitos

- Conta na Vercel (grátis)
- Projeto Git (GitHub, GitLab ou Bitbucket)

## Passo a Passo

### 1️⃣ Preparar o Repositório

Certifique-se de que seu código está em um repositório Git:

```bash
git add .
git commit -m "Preparando para deploy"
git push
```

### 2️⃣ Criar Projeto na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em "Add New Project"
3. Importe seu repositório
4. A Vercel detectará automaticamente que é um projeto Next.js

### 3️⃣ Configurar Vercel KV (Recomendado)

**Por que usar KV?** 
- Sem KV: os dados não persistem (se perdem a cada restart)
- Com KV: dados salvos permanentemente no Redis

#### Como configurar:

1. No dashboard do projeto na Vercel, vá em **Storage**
2. Clique em **Create Database**
3. Escolha **KV** (Key-Value Store)
4. Escolha um nome (ex: `amigo-secreto-kv`)
5. Escolha a região (recomendado: mais próxima dos usuários)
6. Clique em **Create**

**As variáveis de ambiente são configuradas automaticamente!** ✨

### 4️⃣ Fazer o Deploy

Na página de configuração do projeto:

1. Deixe tudo como padrão (framework detectado automaticamente)
2. Clique em **Deploy**
3. Aguarde alguns minutos
4. Pronto! 🎉

### 5️⃣ Testar

Após o deploy, você receberá uma URL como:
```
https://seu-projeto.vercel.app
```

Teste:
1. Adicione alguns participantes
2. Gere um sorteio
3. Copie um link de resultado
4. Abra em outra aba (simulando outro participante)
5. Verifique se funciona!

## ⚙️ Configuração Manual (Opcional)

Se precisar configurar variáveis de ambiente manualmente:

1. Vá em **Settings** → **Environment Variables**
2. As variáveis do KV já estarão lá automaticamente:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

## 🔄 Atualizações Futuras

Sempre que você fizer `git push`, a Vercel fará deploy automático!

```bash
git add .
git commit -m "Nova feature"
git push
```

## 📝 Importante

- ✅ O sistema **já está preparado** para usar KV automaticamente
- ✅ Funciona localmente sem KV (usa filesystem)
- ✅ Na Vercel, detecta automaticamente se tem KV configurado
- ✅ Sem KV na Vercel, os dados não persistirão entre restarts

## 🆘 Troubleshooting

### Erro: "Cannot find module '@vercel/kv'"
```bash
# Certifique-se de que o pacote está instalado
npm install @vercel/kv
git add package.json package-lock.json
git commit -m "Add @vercel/kv"
git push
```

### Dados não persistem
- Verifique se o KV foi criado corretamente
- Verifique se as variáveis de ambiente estão configuradas
- Veja os logs da Vercel para erros

## 💰 Custos

- **Vercel**: Plano Hobby (gratuito) suporta até 1GB de KV
- **Uso estimado**: ~1KB por sorteio com 10 participantes
- **Traffic**: Vercel Hobby oferece 100GB de bandwidth/mês grátis

**Para a maioria dos casos, o plano gratuito é suficiente!** 🎉

