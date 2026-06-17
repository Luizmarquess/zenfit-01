## O que vou construir

Backend real (Lovable Cloud já ativado) + login/cadastro + painel administrativo, substituindo dados simulados por banco de dados real com persistência.

### 1. Banco de dados (tabelas no Lovable Cloud)

- **profiles** — perfil do usuário (id, user_id, tipo `cliente`/`massoterapeuta`, nome, telefone, cidade, premium bool, created_at). Auto-criada via trigger no signup.
- **user_roles** — papéis (`admin`, `user`) em tabela separada para segurança. Função `has_role()` para checar admin sem recursão.
- **anamneses** — ficha do cliente (todos os campos já existentes: dados pessoais, queixa, histórico, doenças, medicamentos, cirurgias, alergias, hábitos, contraindicações).
- **massoterapeutas** — perfil profissional (user_id, nome, cidade, bio, especialidades, premium, ativo).
- **agendamentos** — reservas (cliente_id, massoterapeuta_id, tipo_massagem, duracao, valor, cidade, forma_pagamento, status, created_at).

Cada tabela com RLS: usuário só vê seus dados; admin vê tudo via `has_role()`.

### 2. Autenticação

- Página `/auth` com email/senha + Google (padrão Lovable Cloud).
- Confirmação de email **desativada** (signup imediato) para facilitar testes.
- Header global: botão "Entrar" → quando logado mostra nome + "Sair" + (se admin) link "Admin".
- Trigger no banco cria `profiles` automaticamente após signup, lendo `tipo` dos metadados.

### 3. Fluxo do cliente integrado ao banco

Index continua público (busca de massagem). Ao clicar em "Continuar para anamnese", se não estiver logado, redireciona para `/auth?redirect=/`. Depois de logado:
- Anamnese é salva em `anamneses` (upsert por user_id, persistida entre sessões).
- Pagamento gera registro em `agendamentos`.
- Massoterapeutas listados na busca vêm da tabela `massoterapeutas` (premium aparecem primeiro).

### 4. Painel administrativo `/admin`

Rota protegida sob `_authenticated/admin` + checagem de role `admin`. Permite:
- Listar/criar/editar/remover **massoterapeutas** (CRUD completo).
- Listar **usuários** (profiles) com filtro por tipo, alternar premium.
- Listar **agendamentos** e **anamneses** (visualização).
- Promover usuário a admin.

Como você é o primeiro usuário, vou criar uma migration que adiciona role `admin` ao primeiro signup (ou você me passa seu email depois e eu rodo o INSERT).

### 5. Ajustes visuais

- Linha "Premium" da tabela de planos: tons de verde mais escuro (background `emerald-900/40`, borda `emerald-600`, texto destacado).

### 6. Detalhes técnicos

- Server functions (`createServerFn` + `requireSupabaseAuth`) para todas as operações autenticadas.
- Migration única criando enums, tabelas, GRANTs, RLS, policies, função `has_role`, trigger `handle_new_user`.
- Massoterapeutas iniciais (seed) inseridos via migration para Aracoiaba, Aratuba, Itapiúna, Baturité, Capistrano.

### Fora do escopo (posso adicionar depois se quiser)

- Notificações por email ao agendar.
- Chat cliente↔massoterapeuta.
- Pagamento online real (Stripe). Atualmente só registra a forma escolhida.

Confirma que posso prosseguir?
