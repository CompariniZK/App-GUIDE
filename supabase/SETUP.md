# Supabase — Setup guide for Boussole

Pequeno guia passo-a-passo para configurar o projeto Supabase de forma **segura** e em **conformidade RGPD**.

---

## 1. Criar conta e projeto

1. Acesse https://supabase.com → **Start your project**
2. Faça **Sign up com GitHub** (mais seguro que email/senha)
3. Habilite **2FA** na sua conta GitHub e Supabase (Settings → Security)
4. Clique **New project** dentro de uma organização

### Configuração do projeto

| Campo | Valor |
|-------|-------|
| **Name** | `boussole-prod` |
| **Database Password** | Use o gerador do Supabase → copie pro seu password manager (1Password / Bitwarden) |
| **Region** | 🇩🇪 **Frankfurt (eu-central-1)** ← obrigatório para RGPD |
| **Pricing Plan** | Free |

> ⚠️ A senha do banco **só aparece uma vez**. Se perder, você precisa rotacionar.

---

## 2. Configurar Auth (Authentication → Providers → Email)

| Configuração | Valor | Por quê |
|--------------|-------|---------|
| **Enable Email provider** | ✅ ON | Auth principal |
| **Confirm email** | ✅ ON | Bloqueia contas com email falso |
| **Secure email change** | ✅ ON | Exige confirmação nos 2 emails |
| **Secure password change** | ✅ ON | Exige re-login para trocar senha |

### Authentication → Policies

| Configuração | Valor |
|--------------|-------|
| **Minimum password length** | `10` |
| **Password strength** | `Letters, digits, and special characters` |
| **Leaked password protection** | ✅ ON (HaveIBeenPwned) |

### Authentication → Sessions

| Configuração | Valor |
|--------------|-------|
| **JWT expiry** | `3600` (1h) |
| **Refresh token rotation** | ✅ ON |
| **Refresh token reuse interval** | `10` segundos |

### Authentication → URL Configuration

| Configuração | Valor |
|--------------|-------|
| **Site URL** | `boussole://` (deep link do app) |
| **Redirect URLs** | `boussole://auth/callback`, `exp://192.168.*` (dev) |

---

## 3. Aplicar o schema do banco

1. Vá em **SQL Editor** (ícone de banco de dados)
2. Clique **New query**
3. Cole o conteúdo de `supabase/schema.sql` (deste repo)
4. Clique **Run** — deve aparecer `Success. No rows returned`
5. Verifique em **Table Editor**: devem existir `profiles`, `completed_guides`, `favorites`, `chat_messages`

### Validação RLS

Em **Table Editor**, cada tabela deve ter o ícone 🔒 verde indicando RLS ativo.

Para confirmar via SQL:

```sql
select relname, relrowsecurity
from pg_class
where relname in ('profiles','completed_guides','favorites','chat_messages');
-- relrowsecurity deve ser `t` para todas
```

---

## 4. Pegar credenciais (Settings → API)

| Credencial | Onde usar |
|------------|-----------|
| **Project URL** | `.env` → `EXPO_PUBLIC_SUPABASE_URL` |
| **anon / public key** | `.env` → `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role key** | ⚠️ **NUNCA no app**. Só em Edge Functions / backend |

### Adicionar no `.env` do projeto (raiz do `App-GUIDE`)

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

Reinicie o Expo: `npx expo start -c` (clear cache).

---

## 5. Configurações de segurança adicionais

### Settings → Database → Connection pooling
- ✅ Habilitar **Connection Pooler** (modo Transaction)
- Use a string `Pooler` ao invés da direta para queries no app

### Settings → Database → Backups
- Plano Free: backup diário automático (7 dias)
- Considere plano Pro quando crescer (ponto-in-time recovery)

### Settings → Auth → Rate Limits
| Endpoint | Limite recomendado |
|----------|---------------------|
| **sign-up** | 5 / hora / IP |
| **sign-in** | 30 / hora / IP |
| **password reset** | 5 / hora / IP |
| **OTP** | 5 / hora / IP |

### Settings → Auth → Email Templates
Personalize os 5 templates em **francês** (sua audiência principal):
- Confirm signup
- Magic Link
- Change Email Address
- Reset Password
- Reauthentication

---

## 6. Conformidade RGPD

✅ Já está coberto:
- Hospedagem na UE (Frankfurt)
- Criptografia at-rest (AES-256) e in-transit (TLS 1.3)
- Senhas hashadas com bcrypt cost 10
- Logs de acesso disponíveis

🛠️ Você ainda precisa:
- [ ] Política de privacidade no site/app
- [ ] Termos de uso
- [ ] Endpoint de "exportar meus dados" (Edge Function — TODO)
- [ ] Endpoint de "excluir minha conta" (Edge Function — TODO)
- [ ] DPA (Data Processing Agreement) com Supabase — automático no plano Pro

---

## 7. Próximos passos (depois da apresentação)

1. Implementar telas `LoginScreen` e `SignUpScreen` (tarefa #5)
2. Migrar `ProfileContext` para usar Supabase (tarefa #6)
3. Adicionar verificação de email no fluxo de onboarding
4. Edge Functions para "exportar dados" e "excluir conta" (RGPD)
5. Monitorar **Auth → Users** semanalmente

---

## Checklist final ✅

- [ ] Conta Supabase criada com 2FA ativo
- [ ] Projeto criado em Frankfurt
- [ ] Senha do banco salva em password manager
- [ ] Email provider configurado com email confirmation
- [ ] Min password length = 10 + HIBP check
- [ ] JWT expiry = 3600
- [ ] `schema.sql` executado com sucesso
- [ ] RLS ativo em todas as 4 tabelas
- [ ] `.env` atualizado com URL e anon key
- [ ] Service role key **fora** do código do app
- [ ] Templates de email traduzidos pra francês

Quando tudo estiver ✅, me avise — eu integro nas telas. 🔐
