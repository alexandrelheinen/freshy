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

O mapa da Fase 1 usa Mapbox. O token é **público** (vai no front-end), mas não commite no Git — use `.env` e painel da Vercel.

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

**Não compartilhe** esse token publicamente em redes sociais. Para o Freshy, uso em `.env` e Vercel é normal.

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

- [ ] Token guardado para usar na Vercel (passo 5)

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

Guarde a `DATABASE_URL` num gerenciador de senhas. Você vai colar na Vercel quando a API subir.

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

## 5. Deploy na Vercel (colocar o app na internet)

### 5.1 Criar conta e conectar o GitHub

1. Acesse [vercel.com](https://vercel.com/)
2. **Sign Up** → use **Continue with GitHub**
3. Autorize a Vercel a ver seus repositórios

- [ ] Conta Vercel criada e GitHub conectado

### 5.2 Importar o repositório Freshy

1. No dashboard Vercel: **Add New…** → **Project**
2. Na lista, ache **`freshy`** (ou `alexandrelheinen/freshy`)
3. Clique **Import**

### 5.3 Configurar o monorepo (IMPORTANTE)

Na tela **Configure Project**, ajuste:

| Campo                | Valor                                                                     |
| -------------------- | ------------------------------------------------------------------------- |
| **Framework Preset** | Next.js (deve detectar sozinho)                                           |
| **Root Directory**   | `apps/web` ← clique **Edit** e selecione esta pasta                       |
| **Build Command**    | deixe o padrão ou `cd ../.. && pnpm build --filter=@freshy/web` se falhar |
| **Install Command**  | `cd ../.. && pnpm install`                                                |

Se a Vercel não achar o `pnpm`, em **Settings → General → Build & Development**:

- **Install Command:** `pnpm install` (na raiz, com Root Directory vazio) **ou** use a config acima com Root `apps/web`

**Configuração mais simples que costuma funcionar:**

1. **Root Directory:** deixe vazio (raiz do repo)
2. **Framework:** Next.js
3. Override **Root Directory** para build: em Project Settings → General, defina:
   - Root Directory: `apps/web`

- [ ] Root Directory = `apps/web`
- [ ] Framework = Next.js

### 5.4 Variáveis de ambiente (antes do primeiro deploy)

Ainda na tela de import (ou depois em **Settings → Environment Variables**), adicione:

| Nome                       | Valor                                                      | Ambientes                        |
| -------------------------- | ---------------------------------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_API_URL`      | `http://localhost:4000` por agora (troca quando API subir) | Production, Preview, Development |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | seu `pk.xxx` do passo 3                                    | Production, Preview, Development |

Para cada variável:

1. **Key** = nome da coluna
2. **Value** = valor
3. Marque **Production**, **Preview** e **Development**
4. **Save**

- [ ] `NEXT_PUBLIC_API_URL` configurada na Vercel
- [ ] `NEXT_PUBLIC_MAPBOX_TOKEN` configurada na Vercel

### 5.5 Fazer o deploy

1. Clique **Deploy**
2. Aguarde 2–5 minutos
3. Quando aparecer **Congratulations**, clique na URL (ex. `freshy-xxx.vercel.app`)

- [ ] Primeiro deploy terminou com sucesso

**Deu erro?**

- `pnpm not found` → em Project Settings, ative **Node.js 20** e Install Command `npm i -g pnpm && pnpm install`
- `Cannot find module @freshy/ui` → Root Directory errado; o monorepo precisa instalar da **raiz**. Tente Root Directory vazio + Build: `pnpm install && pnpm --filter @freshy/web build`
- Build falhou → copie o log e abra uma issue; enquanto isso valide local com `pnpm build`

### 5.6 Testar as 4 telas em produção

Substitua `SEU-DOMINIO` pelo domínio que a Vercel deu:

- [ ] `https://SEU-DOMINIO.vercel.app/explore` — abre OK
- [ ] `https://SEU-DOMINIO.vercel.app/cooling` — abre OK
- [ ] `https://SEU-DOMINIO.vercel.app/places/ice-coffee-central` — abre OK
- [ ] `https://SEU-DOMINIO.vercel.app/profile` — abre OK

### 5.7 Testar no celular

1. Abra a mesma URL `/explore` no Chrome/Safari do telefone
2. Confira: fonte legível, cores azuis/ claras, menu fixo embaixo

- [ ] App abre bem no celular

### 5.8 Preview de Pull Request (automático)

1. Abra qualquer PR no GitHub
2. A Vercel comenta com um link **Visit Preview**
3. Clique e confira se `/explore` abre

- [ ] Preview de PR testado (pode ser em um PR existente)

### 5.9 Anotar URLs

```
Produção: https://__________.vercel.app
Preview:  (gerado automaticamente por PR)
```

- [ ] URL de produção anotada

---

## 6. (Recomendado) CI com screenshots no GitHub

Sem isso o CI ainda passa (lint, test, build), mas o bot **não** posta imagens das páginas no PR.

Guia completo: [infrastructure/gcp/README.md](../infrastructure/gcp/README.md)

### 6.1 Resumo rápido

1. Criar projeto no [Google Cloud](https://console.cloud.google.com/)
2. Criar bucket `freshy-assets` (região perto de você)
3. Criar service account + baixar JSON da chave
4. No GitHub: repositório → **Settings → Secrets and variables → Actions → New repository secret**

| Secret            | O que colar                          |
| ----------------- | ------------------------------------ |
| `GCP_PROJECT_ID`  | ID do projeto GCP                    |
| `GCS_BUCKET_NAME` | `freshy-assets`                      |
| `GCP_SA_KEY`      | conteúdo **inteiro** do arquivo JSON |

- [ ] (Recomendado) Secrets GCP configurados no GitHub
- [ ] (Recomendado) PR de teste recebeu comentário com screenshots

**Deu erro?** Se não quiser GCP agora, ignore — não bloqueia a Fase 1.

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

Só se já tiver domínio (ex. `freshy.app`).

1. Compre o domínio (Registro.br, Cloudflare, Namecheap…)
2. Na Vercel: **Project → Settings → Domains → Add**
3. Siga as instruções de DNS (geralmente registro `CNAME`)
4. Aguarde propagação (5 min – 48 h)

- [ ] (Opcional) Domínio configurado

---

## Posso começar a Fase 1?

Marque **todos** antes de pedir código da Fase 1:

| #   | Pergunta                                                         | Sim? |
| --- | ---------------------------------------------------------------- | ---- |
| 1   | `bash scripts/validation.sh` passou na sua máquina?              | [ ]  |
| 2   | Cidade piloto + lat/lng + raio anotados?                         | [ ]  |
| 3   | Token Mapbox no `.env` **e** na Vercel?                          | [ ]  |
| 4   | Banco remoto (Neon/Supabase) com PostGIS + `pnpm db:migrate` OK? | [ ]  |
| 5   | App na Vercel abre as 4 telas no desktop **e** no celular?       | [ ]  |

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

| Documento                                        | Para quê                 |
| ------------------------------------------------ | ------------------------ |
| [roadmap.md](roadmap.md)                         | O que é cada fase        |
| [development-cycle.md](development-cycle.md)     | Como codar (TDD)         |
| [CONTRIBUTING.md](../CONTRIBUTING.md)            | Regras de PR e qualidade |
| [DESIGN.md](stitch/freshy/DESIGN.md)             | Cores e tipografia       |
| [gcp/README.md](../infrastructure/gcp/README.md) | Screenshots no CI        |

---

_Última atualização: junho de 2026_
