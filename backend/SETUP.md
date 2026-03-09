# 🚀 Backend Boussole — Instruções de Configuração

## Passo 1: Obter Claude API Key

1. Vá para https://console.anthropic.com/
2. Faça login (crie conta se necessário)
3. Vá em "API Keys"
4. Clique "Create Key"
5. Copie a chave (começa com `sk-ant-v1-`)

## Passo 2: Configurar Variáveis de Ambiente

Abra o arquivo `backend/.env` e substitua:

```env
ANTHROPIC_API_KEY=sk-ant-v1-XXX_REPLACE_WITH_YOUR_KEY_XXX
```

Por sua chave copiada:

```env
ANTHROPIC_API_KEY=sk-ant-v1-seus_caracteres_aqui
PORT=3000
NODE_ENV=development
```

## Passo 3: Instalar Dependências

```bash
cd backend
npm install
```

Você verá instalar:
- ✅ express (framework web)
- ✅ @anthropic-ai/sdk (SDK do Claude)
- ✅ cors (para aceitar requisições do app)
- ✅ dotenv (para ler .env)

## Passo 4: Iniciar o Backend

```bash
npm start
# Ou com hot-reload:
npm run dev
```

Você verá:
```
🚀 Boussole Backend running on http://localhost:3000
📝 Chat endpoint: POST http://localhost:3000/api/chat
💚 Health: GET http://localhost:3000/api/health
```

## Passo 5: Testar a API

No terminal (PowerShell novo), execute:

```bash
# Test 1: Health check
curl http://localhost:3000/api/health

# Test 2: Fazer pergunta à IA
curl -X POST http://localhost:3000/api/chat `
  -H "Content-Type: application/json" `
  -d '{\"message\": \"Comment ouvrir un compte bancaire ?\"}'
```

Você deve receber uma resposta JSON com `reply` da IA.

## Passo 6: Conectar Frontend

1. Abra novo terminal
2. `npm start` (na pasta raiz App-GUIDE)
3. Pressione `w` para abrir web
4. Vá na aba "Chat"
5. Faça uma pergunta

---

## ⚠️ Troubleshooting

### "Port 3000 is already in use"
```bash
# Liberar a porta
netstat -ano | findstr :3000
taskkill /PID <NUMERO> /F
```

### "Cannot find module '@anthropic-ai/sdk'"
```bash
npm install
```

### "API Key inválida"
- Regenere em console.anthropic.com
- Copie SEM ESPAÇOS antes/depois

### "connect ECONNREFUSED 127.0.0.1:3000"
- Backend não está rodando! Execute `npm start` primeiro

---

## Proximas Etapas

1. **Deploy Backend** para Railway, Render ou Vercel
2. **Vector Database** com pgvector + LangChain
3. **Mais Guides** (30+ em vez de 6)
4. **Publicar App** na Play Store / App Store

---

❤️ Boussole 2026
