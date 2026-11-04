# Decisões de Arquitetura e Escopo

> Registra ambiguidades resolvidas e escolhas feitas durante o desenvolvimento, conforme exigido pelo DVP (regra 6).

---

## D01 — Localização da Alexa Skill

**Decisão:** a Alexa Skill ficará em `alexa-skill/` como pacote Node.js independente dentro do monorepo, em vez de um módulo NestJS.

**Motivo:** o ASK SDK exige um handler específico para o runtime da Lambda/HTTPS da Alexa (não é um servidor Express convencional). Manter isolado facilita o deploy separado na AWS Lambda ou via Alexa-Hosted Skill, sem impactar o backend principal. Os dados são obtidos chamando a própria API REST do backend via HTTP, garantindo regra de negócio em um único ponto (DVP §5).

---

## D02 — Restrição de um alerta de saldo mínimo por conta

**Decisão:** a restrição "apenas um alerta de saldo mínimo por conta" é validada a nível de serviço (Service), não por constraint de banco, pois o modelo `RegraAlerta` não possui coluna `conta_id` direta — a regra é avaliada por usuário + tipo `SALDO_MINIMO`.

**Motivo:** o DVP não especifica como a regra de saldo referencia a conta. A opção mais simples e segura é: um usuário pode ter no máximo uma `RegraAlerta` ativa com `tipoEvento = 'SALDO_MINIMO'` por conta bancária. A conta bancária será referenciada por um campo `contaId` adicionado à `RegraAlerta` em RF06. Registrado aqui para alinhar a migration futura.

---

## D03 — RF11 (Gerenciar Perfil) — escopo mínimo viável

**Decisão:** RF11 incluirá: alterar nome, alterar e-mail (com reconfirmação de senha), alterar senha, ativar/desativar biometria, e excluir conta (LGPD). Não incluirá foto de perfil ou preferências de idioma/tema (escopo pós-MVP).

**Motivo:** o DVP descreve RF11 como "Desejável / prioridade 4" e não detalha os campos. O mínimo viável cobre os dados cadastrais e o direito de exclusão exigido pela LGPD.

---

## D04 — Criptografia em repouso (AES-256-GCM)

**Decisão:** `access_token`, `refresh_token` do `VinculoAlexa` e `itemIdPluggy` do `Consentimento` serão criptografados com AES-256-GCM antes de persistir. A chave é lida de `ENCRYPTION_KEY` (env). A criptografia é aplicada em um `EncryptionService` injetável, chamado no `Repository` correspondente.

**Motivo:** esses valores permitem acesso às APIs externas (Pluggy e Alexa); vazamento de banco não deve comprometer as contas dos usuários.

---

## D05 — Hash falso no login

**Decisão:** quando o e-mail não existe, o `AuthService` executa `bcrypt.compare` com um hash pré-computado (`hashFalso`) antes de retornar o erro, para garantir tempo de resposta idêntico ao de uma senha errada.

**Motivo:** sem isso, um atacante pode distinguir "e-mail não existe" de "senha errada" pela diferença de latência (timing attack). O DVP exige resposta genérica "E-mail ou senha incorretos".

---

## D06 — Sessão persistida em banco (`Sessao`)

**Decisão:** refresh tokens são armazenados como hash SHA-256 na tabela `Sessao` (não apenas no JWT), permitindo revogação imediata no logout e na troca de senha.

**Motivo:** o DVP exige que "logout descarta tokens" e que "senha redefinida invalida sessões anteriores". Sem persistência, não é possível revogar tokens ainda válidos antes da expiração natural do JWT.
