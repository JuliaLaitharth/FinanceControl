# Checklist de Conformidade — LGPD e Segurança

> DVP v3.0 — FinanceControl — Universidade de Passo Fundo
> Atualizado: 2026-11-03

---

## 1. LGPD — Lei Geral de Proteção de Dados (Lei nº 13.709/2018)

### 1.1 Base Legal e Finalidade

| Item | Status | Evidência |
|---|---|---|
| Coleta limitada à finalidade do serviço (Art. 6º, I) | ✅ | Coletados apenas: nome, e-mail, dados bancários via Pluggy |
| Finalidade informada ao usuário antes da coleta | ✅ | Tela de cadastro e fluxo de consentimento (ConsentimentoScreen) |
| Consentimento explícito antes de integrar conta bancária | ✅ | `POST /consentimentos` — usuário inicia o Connect Widget voluntariamente |
| Dados de menores (< 18 anos) não coletados | ✅ | Sem campo de data de nascimento; fora do escopo do DVP |

### 1.2 Direitos do Titular

| Direito | Endpoint | Implementação |
|---|---|---|
| Acesso aos dados (Art. 18, II) | `GET /auth/me` | Retorna nome, e-mail, biometriaAtiva |
| Portabilidade (Art. 18, V) | — | Fora do escopo do DVP v3.0 |
| Revogação de consentimento (Art. 8º, §5º) | `DELETE /consentimentos/:id` | Revoga via Pluggy + status REVOGADO no banco |
| Exclusão completa (Art. 18, VI) | `DELETE /auth/conta` | `LgpdService.excluirConta`: revoga todos os items Pluggy, registra auditoria, cascade delete |

### 1.3 Medidas Técnicas

| Medida | Status | Detalhe |
|---|---|---|
| Criptografia em repouso | ✅ | `itemIdPluggy` criptografado com AES-256-GCM via `EncryptionService` |
| Criptografia em trânsito | ✅ | HTTPS obrigatório em produção (Railway/Render fornecem TLS automaticamente) |
| Hash de senhas | ✅ | bcrypt com 12 rounds (`BCRYPT_ROUNDS = 12`) |
| Tokens de recuperação de senha | ✅ | SHA-256 do token gravado; plain text nunca persiste |
| Escopo read-only Open Finance | ✅ | Sem iniciação de pagamento, transferência ou escrita financeira em nenhuma camada |
| Log de auditoria | ✅ | Tabela `LogAuditoria` registra todas as ações sensíveis com IP e timestamp |
| Retenção mínima de logs | ✅ | Logs de auditoria deletados em cascade com a conta do usuário |

### 1.4 Incidentes

Em caso de incidente de segurança envolvendo dados pessoais, a ANPD deve ser notificada em até 72 horas conforme Art. 48 da LGPD. O contato do controlador é o e-mail institucional da equipe acadêmica do projeto.

---

## 2. Segurança da API

### 2.1 Autenticação e Autorização

| Controle | Status | Detalhe |
|---|---|---|
| JWT com expiração curta | ✅ | Access token: padrão NestJS JwtModule (default 60s); refresh token: 30 dias |
| Refresh token rotativo | ✅ | A cada renovação, novo `refreshHash` é gerado e o anterior é invalidado |
| Bloqueio por tentativas | ✅ | 5 tentativas falhas → bloqueio de 15 minutos |
| Revogação de sessões | ✅ | Logout e alteração de senha revogam todas as sessões ativas |
| Guard JWT em todas as rotas protegidas | ✅ | `@UseGuards(JwtAuthGuard)` em todos os controllers pós-login |

### 2.2 Validação de Entrada

| Controle | Status | Detalhe |
|---|---|---|
| ValidationPipe global (whitelist + transform) | ✅ | `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))` |
| DTOs com class-validator em todas as rotas | ✅ | `@IsEmail`, `@IsString`, `@MinLength`, `@IsInt`, etc. |
| Sanitização de SQL | ✅ | Prisma usa queries parametrizadas; sem SQL raw |
| Proteção contra XSS | ✅ | API JSON-only; sem renderização HTML nas rotas de dados |

### 2.3 Segredos e Configuração

| Controle | Status | Detalhe |
|---|---|---|
| Segredos apenas via variáveis de ambiente | ✅ | `ConfigModule.forRoot({ isGlobal: true })`; nenhum segredo hardcoded |
| `.env` no `.gitignore` | ✅ | Apenas `.env.example` no repositório |
| Rotação de chave AES | ⚠️ | Rotação manual necessária; fora do escopo do MVPacadêmico |

### 2.4 Webhook Pluggy

| Controle | Status | Detalhe |
|---|---|---|
| Validação de assinatura HMAC-SHA256 | ✅ | `WebhookController` verifica header `x-pluggy-signature` |
| Rejeição de payloads inválidos | ✅ | Retorna 401 se a assinatura não conferir |

---

## 3. Open Finance — Escopo Read-Only

O projeto adota escopo estritamente de **consulta**:

- Nenhum endpoint inicia pagamento, transferência ou qualquer operação de escrita financeira
- O Pluggy Connect Widget é usado apenas para autenticação e leitura de transações
- Consentimentos são do tipo `READ_ONLY`
- Revisado e aprovado no plano do DVP — cláusula de escopo (§3.1)

---

## 4. Alexa Skill — Privacidade de Voz

| Item | Status |
|---|---|
| Account Linking via OAuth 2.0 Authorization Code (padrão Alexa) | ✅ |
| Tokens Alexa não persistidos fora do `VinculoAlexa` | ✅ |
| Dados de voz processados exclusivamente pela Alexa (AWS) | ✅ |
| Skill não coleta áudio nem transcrições de voz | ✅ |
| Proactive Events enviados apenas ao `alexaUserId` vinculado | ✅ |

---

## 5. Dependências e Vulnerabilidades

Execute regularmente:

```bash
# Backend
cd backend && npm audit

# App Flutter
cd app && flutter pub outdated
```

Aplique patches de segurança antes de cada release de produção.

---

## 6. Referências

- [Lei nº 13.709/2018 — LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ANPD — Autoridade Nacional de Proteção de Dados](https://www.gov.br/anpd)
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [Pluggy — Documentação Open Finance](https://docs.pluggy.ai)
- [Alexa — Account Linking Guide](https://developer.amazon.com/en-US/docs/alexa/account-linking/account-linking-overview.html)
