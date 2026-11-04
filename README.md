# FinanceControl

Assistente financeiro pessoal com integração Open Finance (Pluggy), notificações push (FCM), skill Alexa e proteção LGPD.

> Projeto acadêmico — DVP v3.0 — Universidade de Passo Fundo

---

## Sumário

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Requisitos](#requisitos)
- [Configuração Local](#configuração-local)
- [Deploy](#deploy)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [API — Endpoints](#api--endpoints)
- [Testes](#testes)
- [Conformidade LGPD](#conformidade-lgpd)
- [Decisões de Arquitetura](#decisões-de-arquitetura)

---

## Visão Geral

| Camada | Tecnologia |
|---|---|
| Backend | NestJS 12 (ESM), PostgreSQL 16, Prisma 5, Redis 7, BullMQ |
| Mobile | Flutter 3.47 / Dart 3.5 — Riverpod 2.5 (MVVM) |
| Open Finance | Pluggy SDK (sandbox e produção) |
| Push | Firebase Admin SDK (FCM) |
| Voz | Alexa Skill (ASK SDK v2) |
| Auth | JWT + Refresh Token + bcrypt |
| Criptografia | AES-256-GCM em repouso (`itemIdPluggy`) |
| Deploy | Railway · Render · Docker Compose |

### Requisitos Funcionais implementados

| RF | Descrição |
|---|---|
| RF01 | Cadastro, login (bloqueio 5 tentativas), biometria |
| RF02 | Integração Pluggy — contas, Connect Widget |
| RF03 | Saldo consolidado, cache SQLite |
| RF04 | Transações com filtros, paginação e sincronização |
| RF05 | Auto-categorização por palavras-chave + regras do usuário |
| RF06 | Regras de alerta personalizadas |
| RF07 | Notificações push (FCM) + central de notificações |
| RF08 | Alexa Skill — OAuth 2.0 Account Linking + Proactive Events |
| RF09 | Dashboard fl_chart — PieChart categorias + BarChart mensal |
| RF10 | LGPD — exclusão total de dados (revogação Pluggy + cascade) |
| RF11 | Perfil — editar nome, alterar senha, biometria |

---

## Arquitetura

```
financecontrol/
├── backend/            # API REST — NestJS (ESM)
│   ├── prisma/         # Schema, migrations e seed
│   └── src/
│       ├── auth/       # JWT, bcrypt, sessões, biometria
│       ├── pluggy/     # Adapter Open Finance
│       ├── transacao/  # Sincronização, filtros, categorização
│       ├── worker/     # BullMQ processor (pluggy-sync)
│       ├── alexa/      # Proactive Events
│       ├── oauth/      # Authorization Code Flow (Alexa Account Linking)
│       ├── lgpd/       # Exclusão total LGPD
│       └── ...
├── app/                # Flutter — MVVM + Riverpod
│   └── lib/features/
│       ├── auth/       # Login, registro, perfil
│       ├── accounts/   # Contas bancárias
│       ├── transactions/ # Extrato com filtros
│       ├── dashboard/  # Relatórios fl_chart
│       ├── alerts/     # Regras de alerta
│       └── notifications/ # Central de notificações
└── alexa-skill/        # ASK SDK — handlers, models
```

---

## Requisitos

- **Node.js** ≥ 22
- **Docker** e **Docker Compose** (para banco e Redis locais)
- **Flutter** ≥ 3.47 / Dart ≥ 3.5
- Conta [Pluggy](https://pluggy.ai) (sandbox gratuito)
- Projeto Firebase com FCM habilitado (opcional)

---

## Configuração Local

### 1. Backend

```bash
# Clone e instale dependências
git clone https://github.com/seu-usuario/FinanceControl.git
cd FinanceControl

# Suba o banco e Redis
docker compose up db redis -d

# Configure as variáveis de ambiente
cp backend/.env.example backend/.env
# Edite backend/.env com seus valores

# Instale dependências e gere o cliente Prisma
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed       # categorias padrão

# Inicie o servidor em modo desenvolvimento
npm run start:dev
```

A API estará disponível em `http://localhost:3000`.

### 2. Flutter

```bash
cd app
flutter pub get
# Ajuste a baseUrl em lib/core/api/api_client.dart se necessário
flutter run
```

---

## Deploy

### Railway (recomendado)

1. Instale o CLI: `npm i -g @railway/cli`
2. `railway login && railway init`
3. Adicione os serviços PostgreSQL e Redis pelo painel
4. Defina as variáveis de ambiente secretas no painel
5. `railway up`

O arquivo `railway.toml` na raiz configura o build.

### Render

1. Conecte o repositório no painel do Render
2. Clique em **New Blueprint** e selecione `render.yaml`
3. Defina os segredos marcados como `sync: false` no painel
4. O deploy é iniciado automaticamente

### Docker Compose (produção local ou VPS)

```bash
# Configure backend/.env com as variáveis de produção
docker compose up --build -d
```

---

## Variáveis de Ambiente

Consulte [`backend/.env.example`](backend/.env.example) para a lista completa. As variáveis obrigatórias são:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão PostgreSQL |
| `JWT_SECRET` | Segredo JWT (≥ 64 chars aleatórios) |
| `REDIS_HOST` / `REDIS_PORT` | Conexão Redis |
| `PLUGGY_CLIENT_ID` / `PLUGGY_CLIENT_SECRET` | Credenciais Pluggy |
| `PLUGGY_WEBHOOK_SECRET` | Validação de webhooks |
| `ENCRYPTION_KEY` | Chave AES-256-GCM (32 bytes em hex) |

Variáveis opcionais (graceful no-op se ausentes): `FCM_SERVER_KEY`, `ALEXA_CLIENT_ID`, `ALEXA_CLIENT_SECRET`, variáveis SMTP.

---

## API — Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/auth/register` | — | Cadastro |
| POST | `/auth/login` | — | Login |
| POST | `/auth/refresh` | — | Renovar token |
| POST | `/auth/logout` | JWT | Encerrar sessão |
| POST | `/auth/forgot-password` | — | Solicitar reset |
| POST | `/auth/reset-password` | — | Redefinir senha |
| GET | `/auth/me` | JWT | Dados do usuário |
| PATCH | `/auth/biometria` | JWT | Toggle biometria |
| PATCH | `/auth/perfil` | JWT | Atualizar nome |
| PATCH | `/auth/senha` | JWT | Alterar senha |
| DELETE | `/auth/conta` | JWT | Excluir conta (LGPD) |
| GET | `/consentimentos` | JWT | Listar consentimentos |
| POST | `/consentimentos` | JWT | Criar consentimento |
| DELETE | `/consentimentos/:id` | JWT | Revogar consentimento |
| GET | `/contas` | JWT | Listar contas bancárias |
| GET | `/contas/saldo` | JWT | Saldo consolidado |
| GET | `/transacoes` | JWT | Listar (filtros + paginação) |
| POST | `/transacoes/sincronizar` | JWT | Sincronizar via Pluggy |
| GET | `/transacoes/resumo-categorias` | JWT | Despesas por categoria |
| GET | `/transacoes/resumo-mensal` | JWT | Receitas/despesas por mês |
| PATCH | `/transacoes/:id/categoria` | JWT | Ajustar categoria manualmente |
| GET | `/categorias` | JWT | Listar categorias |
| GET | `/regras-alerta` | JWT | Listar regras |
| POST | `/regras-alerta` | JWT | Criar regra |
| PATCH | `/regras-alerta/:id` | JWT | Atualizar regra |
| DELETE | `/regras-alerta/:id` | JWT | Excluir regra |
| GET | `/notificacoes` | JWT | Listar notificações |
| PATCH | `/notificacoes/:id/lida` | JWT | Marcar como lida |
| GET | `/regras-categorizacao` | JWT | Listar regras de categorização |
| POST | `/regras-categorizacao` | JWT | Criar regra |
| DELETE | `/regras-categorizacao/:id` | JWT | Excluir regra |
| GET | `/oauth/authorize` | — | Página de login (Alexa) |
| POST | `/oauth/authorize` | — | Autenticar e gerar code |
| POST | `/oauth/token` | — | Trocar code por token |
| POST | `/webhooks/pluggy` | HMAC | Webhook Pluggy |

A coleção Postman completa está em [`docs/FinanceControl.postman_collection.json`](docs/FinanceControl.postman_collection.json).

---

## Testes

```bash
cd backend

# Todos os testes unitários
npm test

# Com cobertura
npm run test:cov

# Suite específica
NODE_OPTIONS=--experimental-vm-modules npx jest auth.service
```

Cobertura atual: **53 testes / 8 suites** (unitários).

---

## Conformidade LGPD

Consulte [`docs/COMPLIANCE.md`](docs/COMPLIANCE.md) para o checklist completo.

Resumo:
- Coleta mínima: apenas dados necessários para o serviço
- Consentimento explícito antes de cada integração Pluggy
- Direito de acesso: `GET /auth/me`
- Direito de exclusão: `DELETE /auth/conta` (cascade + revogação Pluggy)
- Criptografia em repouso: `itemIdPluggy` com AES-256-GCM
- Log de auditoria: todas as ações sensíveis gravadas em `LogAuditoria`
- Escopo estritamente read-only: sem iniciação de pagamento ou transferência

---

## Decisões de Arquitetura

Consulte [`docs/DECISOES.md`](docs/DECISOES.md).
