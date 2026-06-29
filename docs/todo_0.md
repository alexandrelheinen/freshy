# Todo 0 — passo a passo (antes da Fase 1)

> **Para quem?** Você, antes de escrever código da Fase 1.  
> **Objetivo?** Deixar contas, deploy e ambiente prontos para o mapa com dados reais.  
> **Quanto tempo?** 2–4 horas na primeira vez (contas + deploy).  
> **Regra de ouro:** só comece a Fase 1 quando a tabela final (“Posso começar?”) estiver toda marcada.

**Critério de saída da Fase 0:** o app abre na internet com visual Freshy (cores, fonte, menu embaixo) — ainda **sem** mapa real nem API de lugares.

---

## Como usar este documento

1. Siga a ordem **0 → 1 → 2 → 3 → 4 → 5** (não pule).
2. Marque cada `- [ ]` quando terminar.
3. Se travar, leia a caixa **“Deu erro?”** de cada seção.
4. Comandos assumem que você está na **pasta raiz do projeto** (onde fica o `package.json`).

---

## 0. O que instalar no seu computador (só uma vez)

### 0.1 Programas necessários

| Programa    | Versão mínima    | Como instalar                                                 | Como testar                                    |
| ----------- | ---------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| **Node.js** | 20+              | [nodejs.org](https://nodejs.org/)                             | `node -v` → `v20.x` ou maior                   |
| **pnpm**    | 9+               | `npm install -g pnpm`                                         | `pnpm -v` → `9.x` ou maior                     |
| **Git**     | qualquer recente | [git-scm.com](https://git-scm.com/)                           | `git --version`                                |
| **Docker**  | recente          | [docker.com](https://www.docker.com/products/docker-desktop/) | `docker --version` e Docker Desktop **aberto** |

- [ ] Node 20+ instalado
- [ ] pnpm 9+ instalado
- [ ] Git instalado
- [ ] Docker instalado **e rodando** (ícone na barra de tarefas)

**Deu erro?** Se `docker` não for reconhecido, abra o Docker Desktop e espere aparecer “Running”.

---

## 1. Validar o projeto na sua máquina

Faça isso **antes** de criar contas na nuvem. Se não rodar local, não adianta deploy.

### 1.1 Clonar e entrar na pasta

```bash
git clone https://github.com/alexandrelheinen/freshy.git
cd freshy
```

- [ ] Repositório clonado
- [ ] Terminal está dentro da pasta `freshy`

### 1.2 Subir o banco local (Docker)

```bash
bash scripts/setup-local-db.sh
```

**Sucesso esperado:** mensagem `Database is ready.` e, se não existia, um arquivo `.env` criado automaticamente.

- [ ] Script terminou sem erro
- [ ] Arquivo `.env` existe na raiz do projeto

**Deu erro?**

- `Docker is required` → abra o Docker Desktop e rode de novo.
- `port 5432 already in use` → outro Postgres está usando a porta; pare o outro ou mude a porta no `docker-compose.yml`.

### 1.3 Instalar dependências e preparar o banco

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

**Sucesso esperado:** cada comando termina sem `ERROR` ou `ELIFECYCLE`.

- [ ] `pnpm install` OK
- [ ] `pnpm db:generate` OK
- [ ] `pnpm db:migrate` OK
- [ ] `pnpm db:seed` OK

### 1.4 Rodar o app local

```bash
pnpm dev
```

Abra no navegador:

| URL                                             | O que deve aparecer                      |
| ----------------------------------------------- | ---------------------------------------- |
| http://localhost:3000/explore                   | Tela do mapa (placeholder), menu embaixo |
| http://localhost:3000/cooling                   | Categorias                               |
| http://localhost:3000/places/ice-coffee-central | Detalhe de um lugar                      |
| http://localhost:3000/profile                   | Perfil                                   |

- [ ] As 4 URLs abrem sem tela de erro
- [ ] Menu inferior (Explore, Saved, Cooling, Profile) visível

Pare o servidor com `Ctrl + C` no terminal.

### 1.5 Rodar a validação completa

```bash
bash scripts/validation.sh
```

Pode demorar alguns minutos (instala, testa, compila).

**Sucesso esperado:** linha final `All validation checks passed.`

- [ ] `validation.sh` passou

**Deu erro?**

- Sem Docker: `SKIP_DB=1 bash scripts/validation.sh`
- Sem querer screenshots: `SKIP_SCREENSHOTS=1 bash scripts/validation.sh`
- Os dois: `SKIP_DB=1 SKIP_SCREENSHOTS=1 bash scripts/validation.sh`

---

## 2. Escolher a cidade piloto (5 minutos)

A Fase 1 vai semear ~50 lugares **numa cidade só**. Escolha agora para não refazer seed e mapa depois.

### 2.1 Escolha uma cidade

Sugestões que funcionam bem:

| Cidade        | Centro (lat, lng)    | Por quê                         |
| ------------- | -------------------- | ------------------------------- |
| **São Paulo** | `-23.5505, -46.6333` | Muito calor, muitos cafés       |
| **Porto**     | `41.1579, -8.6291`   | Cidade compacta, bom para teste |
| **Lisboa**    | `38.7223, -9.1393`   | Turismo + calor no verão        |

### 2.2 Preencha e marque

- [ ] **Cidade escolhida:** ************\_************
- [ ] **Latitude do centro:** ************\_************
- [ ] **Longitude do centro:** ************\_************
- [ ] **Raio de busca inicial:** **\_\_\_** km (sugestão: `2`)

### 2.3 Anotar a decisão

Abra um bloco de notas (ou issue no GitHub) com:

```
Cidade piloto: [nome]
Centro: [lat], [lng]
Raio: [X] km
```

- [ ] Decisão anotada em algum lugar (issue, Notion, comentário no PR)

---

## 3. Criar conta Mapbox e pegar o token

O mapa da Fase 1 usa Mapbox. O token é **público** (vai no front-end), mas não commite no Git — use `.env` e variáveis do **Cloudflare Pages**.

### 3.1 Criar conta

1. Acesse [mapbox.com](https://www.mapbox.com/)
2. Clique em **Sign up** (pode usar conta Google/GitHub)
3. Confirme o e-mail se pedirem

- [ ] Conta Mapbox criada

### 3.2 Copiar o token padrão

1. Faça login
2. Vá em **[Account → Tokens](https://account.mapbox.com/access-tokens/)**
3. Na lista, copie o token chamado **Default public token** (começa com `pk.`)

- [ ] Token copiado (começa com `pk.`)

**Não compartilhe** esse token publicamente em redes sociais. Para o Freshy, uso em `.env` e Cloudflare Pages é normal.

### 3.3 Colocar o token no projeto local

1. Na raiz do projeto, abra o arquivo `.env` (se não existir: `cp .env.example .env`)
2. Ache a linha `NEXT_PUBLIC_MAPBOX_TOKEN=`
3. Cole o token:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.seu_token_aqui
```

4. Salve o arquivo

- [ ] Token no `.env` local

### 3.4 Testar (opcional agora, obrigatório na Fase 1)

O shell atual ainda não mostra mapa Mapbox — isso é código da Fase 1. Por agora basta ter o token salvo.

- [ ] Token guardado para usar no Cloudflare Pages (passo 5)

### 3.5 (Opcional) Estilo de mapa customizado

Pode deixar para a Fase 1. Se quiser adiantar:

1. [Mapbox Studio](https://studio.mapbox.com/) → **New style**
2. Ajuste cores para tons frios (referência: [DESIGN.md](stitch/freshy/DESIGN.md))
3. Anote o ID do estilo (`mapbox://styles/seu-usuario/xxxxx`)

- [ ] (Opcional) Estilo customizado criado e ID anotado

---

## 4. Banco de dados na nuvem (Postgres + PostGIS)

Localmente o Docker já tem Postgres. Para deploy e Fase 1, você precisa de um banco **na internet**.

**Recomendamos Neon** (grátis para começar, Postgres moderno). Alternativa: Supabase.

---

### Opção A — Neon (recomendado)

#### 4A.1 Criar conta e projeto

1. Acesse [neon.tech](https://neon.tech/)
2. **Sign up** (GitHub é o mais rápido)
3. **New Project**
   - Nome: `freshy`
   - Região: escolha a mais perto da cidade piloto (ex. `South America` para SP)
4. Clique em **Create project**

- [ ] Projeto Neon criado

#### 4A.2 Copiar a connection string

1. No dashboard do projeto, ache **Connection string**
2. Selecione **URI**
3. Copie a URL (parece com `postgresql://usuario:senha@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`)

- [ ] `DATABASE_URL` copiada

#### 4A.3 Ativar PostGIS

1. No Neon, abra **SQL Editor**
2. Cole e execute:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

3. Deve aparecer `CREATE EXTENSION` sem erro

- [ ] PostGIS ativado no Neon

#### 4A.4 Rodar migrações do Freshy no banco remoto

No terminal, na pasta do projeto (substitua pela sua URL real):

```bash
DATABASE_URL="postgresql://usuario:senha@ep-xxx.neon.tech/neondb?sslmode=require" pnpm db:migrate
```

**Sucesso esperado:** Prisma aplica as migrações sem erro.

- [ ] Migrações aplicadas no banco remoto

**Deu erro?**

- `connection refused` → confira se copiou a URL inteira com `?sslmode=require`
- `permission denied` → use a URL do usuário principal do Neon, não uma read-only

#### 4A.5 Guardar a URL

Guarde a `DATABASE_URL` num gerenciador de senhas. Você vai colar no Cloudflare (Workers/Hyperdrive) quando a API subir.

- [ ] URL salva em local seguro (1Password, Bitwarden, etc.)

---

### Opção B — Supabase (alternativa)

#### 4B.1 Criar projeto

1. [supabase.com](https://supabase.com/) → **Start your project**
2. **New project** → nome `freshy`, senha forte, região próxima
3. Aguarde ~2 min até ficar **Active**

#### 4B.2 Pegar connection string

1. **Project Settings** (ícone engrenagem) → **Database**
2. Em **Connection string**, escolha **URI** e modo **Session**
3. Copie a URL e substitua `[YOUR-PASSWORD]` pela senha do projeto

#### 4B.3 PostGIS

No **SQL Editor**:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

#### 4B.4 Migrar

Mesmo comando do Neon:

```bash
DATABASE_URL="sua_url_supabase" pnpm db:migrate
```

- [ ] (Se escolheu Supabase) Projeto criado, PostGIS OK, migrações OK

---

## 5. Deploy no Cloudflare Pages (colocar o app na internet)

### 5.1 Criar conta e conectar o GitHub

1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com/) e crie uma conta (se ainda não tiver)
2. Vá em **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. Autorize o Cloudflare a acessar o GitHub e selecione o repositório **`freshy`**

- [ ] Conta Cloudflare criada e GitHub conectado

### 5.2 Configurar o projeto Pages

Na tela de configuração do projeto:

| Campo                   | Valor                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| **Project name**        | `freshy` (ou o nome que preferir)                                                          |
| **Production branch**   | `main`                                                                                     |
| **Framework preset**    | Next.js                                                                                    |
| **Build command**       | `cd ../.. && pnpm install && pnpm --filter @freshy/web build`                              |
| **Build output**        | `apps/web/.next` (ajuste conforme [OpenNext Cloudflare](https://opennext.js.org/cloudflare) se usar SSR completo) |
| **Root directory**      | `apps/web`                                                                                 |

Se o build falhar por monorepo, tente **Root directory** vazio e build command na raiz:

```bash
pnpm install && pnpm --filter @freshy/web build
```

- [ ] Projeto Pages criado
- [ ] Build settings configurados

### 5.3 Variáveis de ambiente (antes do primeiro deploy)

Em **Settings → Environment variables** do projeto Pages, adicione:

| Nome                       | Valor                                                      | Ambientes              |
| -------------------------- | ---------------------------------------------------------- | ---------------------- |
| `NEXT_PUBLIC_API_URL`      | `http://localhost:4000` por agora (troca quando API subir) | Production, Preview    |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | seu `pk.xxx` do passo 3                                    | Production, Preview    |

- [ ] `NEXT_PUBLIC_API_URL` configurada no Cloudflare Pages
- [ ] `NEXT_PUBLIC_MAPBOX_TOKEN` configurada no Cloudflare Pages

### 5.4 Fazer o deploy

1. Salve as configurações — o Cloudflare dispara o primeiro build automaticamente
2. Aguarde 2–5 minutos
3. Quando o build terminar, clique na URL (ex. `freshy.pages.dev`)

- [ ] Primeiro deploy terminou com sucesso

**Deu erro?**

- `pnpm not found` → em **Settings → Environment variables**, adicione `NODE_VERSION=20` e use build command com `npm i -g pnpm && ...`
- `Cannot find module @freshy/ui` → confira que o install roda da **raiz** do monorepo
- Build falhou → copie o log e abra uma issue; enquanto isso valide local com `pnpm build`

### 5.5 Testar as 4 telas em produção

Substitua `SEU-DOMINIO` pelo domínio que o Cloudflare deu (ex. `freshy.pages.dev`):

- [ ] `https://SEU-DOMINIO/explore` — abre OK
- [ ] `https://SEU-DOMINIO/cooling` — abre OK
- [ ] `https://SEU-DOMINIO/places/ice-coffee-central` — abre OK
- [ ] `https://SEU-DOMINIO/profile` — abre OK

### 5.6 Testar no celular

1. Abra a mesma URL `/explore` no Chrome/Safari do telefone
2. Confira: fonte legível, cores azuis/claras, menu fixo embaixo

- [ ] App abre bem no celular

### 5.7 Preview de Pull Request (automático)

1. Abra qualquer PR no GitHub
2. O Cloudflare Pages cria um **Preview deployment** (link no check do PR ou comentário do bot)
3. Clique e confira se `/explore` abre

- [ ] Preview de PR testado (pode ser em um PR existente)

### 5.8 Anotar URLs

```
Produção: https://__________.pages.dev
Preview:  (gerado automaticamente por PR)
```

- [ ] URL de produção anotada

---

## 6. (Recomendado) CI com screenshots no GitHub + Cloudflare R2

Sem isso o CI ainda passa (lint, test, build), mas o bot **não** posta imagens das páginas no PR.

Guia completo: [infrastructure/cloudflare/README.md](../infrastructure/cloudflare/README.md)

### 6.1 Resumo rápido

1. No [Cloudflare Dashboard](https://dash.cloudflare.com/) → **R2** → criar bucket `freshy-assets`
2. Criar **R2 API token** (Object Read & Write)
3. Habilitar acesso público no prefixo `ci/` (domínio customizado ou `*.r2.dev`)
4. No GitHub: repositório → **Settings → Secrets and variables → Actions → New repository secret**

| Secret                 | O que colar                          |
| ---------------------- | ------------------------------------ |
| `R2_ACCOUNT_ID`        | ID da conta Cloudflare               |
| `R2_ACCESS_KEY_ID`     | Access Key do token R2               |
| `R2_SECRET_ACCESS_KEY` | Secret Key do token R2               |
| `R2_BUCKET_NAME`       | `freshy-assets`                      |
| `R2_PUBLIC_URL`        | URL pública base (sem barra no final)|

- [ ] (Recomendado) Secrets R2 configurados no GitHub
- [ ] (Recomendado) PR de teste recebeu comentário com screenshots

**Deu erro?** Se não quiser R2 agora, ignore — não bloqueia a Fase 1. Screenshots ficam disponíveis como **Artifacts** no workflow.

### 6.2 (Opcional) Configurar R2 localmente

Para testar uploads de assets na API local:

```env
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=freshy-assets
R2_PUBLIC_URL=https://assets.seu-dominio.com
```

- [ ] (Opcional) R2 configurado no `.env` local

---

## 7. Decisões rápidas de produto (10 minutos)

Não precisa codar nada — só decidir e anotar.

| Pergunta                  | Sugestão padrão                                                                                | Sua decisão                |
| ------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------- |
| Categorias de lugares     | Manter as do Prisma: café, restaurante, biblioteca, shopping, museu, coworking, espaço público | [ ] OK / [ ] mudar: \_\_\_ |
| Escala de ar frio         | 3 níveis: Leve → Confortável → Gelado                                                          | [ ] OK / [ ] mudar         |
| Idioma da interface       | Português (pt-BR)                                                                              | [ ] OK                     |
| Login de usuário (Fase 4) | Clerk (mais rápido) **ou** Supabase (banco junto)                                              | [ ] Clerk / [ ] Supabase   |

- [ ] Decisões anotadas (mesmo bloco de notas da cidade piloto)

---

## 8. Conferência visual com o design (15 minutos)

Abra lado a lado: **app deployado** vs **imagem de referência**.

| Tela no app                  | Referência Stitch                                                | OK? |
| ---------------------------- | ---------------------------------------------------------------- | --- |
| `/explore`                   | [mapa_freshy/screen.png](stitch/mapa_freshy/screen.png)          | [ ] |
| `/cooling`                   | [categorias/screen.png](stitch/categorias_de_lugares/screen.png) | [ ] |
| `/places/ice-coffee-central` | [detalhes/screen.png](stitch/detalhes_do_local/screen.png)       | [ ] |
| `/profile`                   | [perfil/screen.png](stitch/meu_perfil/screen.png)                | [ ] |

Anote diferenças para corrigir na Fase 1 ou num PR de polish:

```
- Textos ainda em inglês em alguns lugares
- Ícones emoji em vez de Material Symbols
- BottomNavBar sem links (só visual)
```

- [ ] Comparativo feito
- [ ] Lista de gaps anotada (issue ou notas)

---

## 9. (Opcional) Domínio próprio

Só se já tiver domínio (ex. `freshy.app`). Recomendamos registrar e gerenciar DNS no **Cloudflare**.

1. Adicione o domínio em **Cloudflare DNS** (ou transfira)
2. Em **Workers & Pages** → projeto Freshy → **Custom domains** → **Set up a domain**
3. Para assets R2: bucket → **Connect Domain** → ex. `assets.freshy.app`
4. Aguarde propagação (geralmente minutos no Cloudflare)

- [ ] (Opcional) Domínio configurado no Cloudflare Pages
- [ ] (Opcional) Domínio R2 para assets públicos

---

## Posso começar a Fase 1?

Marque **todos** antes de pedir código da Fase 1:

| #   | Pergunta                                                         | Sim? |
| --- | ---------------------------------------------------------------- | ---- |
| 1   | `bash scripts/validation.sh` passou na sua máquina?              | [ ]  |
| 2   | Cidade piloto + lat/lng + raio anotados?                         | [ ]  |
| 3   | Token Mapbox no `.env` **e** no Cloudflare Pages?                | [ ]  |
| 4   | Banco remoto (Neon/Supabase) com PostGIS + `pnpm db:migrate` OK? | [ ]  |
| 5   | App no Cloudflare Pages abre as 4 telas no desktop **e** no celular? | [ ]  |

### Se todos = sim

Pode iniciar a **Fase 1** seguindo [development-cycle.md](development-cycle.md):

1. Escrever teste que falha (ex.: seed com 50 lugares na cidade piloto)
2. Implementar o mínimo para passar
3. `bash scripts/validation.sh`
4. Abrir PR

Ordem sugerida no código ([roadmap.md](roadmap.md)):

1. Seed ~50 lugares na cidade piloto
2. Mapbox GL JS em `/explore`
3. API `GET /places?lat&lng&radius&category&q`
4. Marcadores + card de preview

### Se algum = não

Volte ao passo correspondente neste documento. **Não comece a Fase 1** com ambiente incompleto — você vai perder tempo debugando deploy em vez de mapa.

---

## Cola de comandos (referência rápida)

```bash
# Banco local
bash scripts/setup-local-db.sh

# Setup completo local
pnpm install
pnpm db:generate && pnpm db:migrate && pnpm db:seed

# Dev
pnpm dev

# Validar tudo
bash scripts/validation.sh

# Migrar banco remoto (troque a URL)
DATABASE_URL="postgresql://..." pnpm db:migrate
```

---

## Referências

| Documento                                                    | Para quê                      |
| ------------------------------------------------------------ | ----------------------------- |
| [roadmap.md](roadmap.md)                                     | O que é cada fase             |
| [development-cycle.md](development-cycle.md)                 | Como codar (TDD)              |
| [infrastructure.md](infrastructure.md)                       | Cloudflare vs serviços externos |
| [CONTRIBUTING.md](../CONTRIBUTING.md)                        | Regras de PR e qualidade      |
| [DESIGN.md](stitch/freshy/DESIGN.md)                         | Cores e tipografia            |
| [cloudflare/README.md](../infrastructure/cloudflare/README.md) | R2, Pages, CI screenshots     |

---

_Última atualização: junho de 2026_
