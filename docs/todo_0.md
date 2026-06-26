# Todo — antes da Fase 1

> Lista de tarefas **suas** (decisões, contas, deploy) para encerrar a Fase 0 e liberar o desenvolvimento da Fase 1.  
> O código da Fase 1 só começa quando todos os itens obrigatórios abaixo estiverem marcados.  
> Workflow de código: [development-cycle.md](development-cycle.md) · Roadmap: [roadmap.md](roadmap.md)

**Critério de saída da Fase 0:** app em produção/preview com branding, tipografia e navegação inferior corretos — ainda sem dados reais no mapa.

---

## Obrigatório — bloqueia o início da Fase 1

### 1. Deploy do shell vazio (Vercel)

- [ ] Criar projeto na [Vercel](https://vercel.com/) apontando para este repositório (`apps/web` como root do Next.js, ou monorepo com `Root Directory: apps/web`)
- [ ] Configurar variáveis de ambiente no painel Vercel (mínimo para o shell):
  - [ ] `NEXT_PUBLIC_API_URL` — URL da API (pode ser placeholder até a API subir)
  - [ ] `NEXT_PUBLIC_MAPBOX_TOKEN` — token público Mapbox (ver item 3)
- [ ] Confirmar que o **preview de PR** abre sem erro
- [ ] Confirmar que **produção** (`main`) abre as 4 telas: `/explore`, `/cooling`, `/places/ice-coffee-central`, `/profile`
- [ ] Verificar no mobile: tipografia Inter, cores do design system, `BottomNavBar` visível

### 2. Escolher cidade piloto

A Fase 1 usa dados de seed centrados em uma cidade. Decida antes de escrever seed ou estilo de mapa.

- [ ] Cidade escolhida: ************\_************ (ex.: São Paulo, Porto, Lisboa)
- [ ] Centro do mapa definido (lat/lng): ************\_************
- [ ] Raio inicial de busca acordado (ex.: 2 km): ************\_************
- [ ] Anotar a decisão num comentário no PR da Fase 1 ou em `docs/roadmap.md` (seção cidade piloto)

### 3. Conta e token Mapbox

- [ ] Criar conta em [Mapbox](https://www.mapbox.com/)
- [ ] Gerar **access token** público (escopo mínimo: styles + tiles)
- [ ] Adicionar `NEXT_PUBLIC_MAPBOX_TOKEN` em:
  - [ ] `.env` local (copiar de `.env.example`)
  - [ ] Vercel (preview + production)
- [ ] (Opcional, recomendado) Criar **estilo customizado** com paleta fria do Freshy — referência: [DESIGN.md](stitch/freshy/DESIGN.md)
- [ ] Guardar URL do estilo: `mapbox://styles/...` para usar na Fase 1

### 4. Banco de dados acessível pela API

A Fase 1 precisa de Postgres com dados reais. Local já funciona via Docker; para preview/produção:

- [ ] Escolher provedor: **Neon**, **Supabase** ou Postgres gerenciado com **PostGIS**
- [ ] Criar instância e obter `DATABASE_URL`
- [ ] Habilitar extensão **PostGIS** (`CREATE EXTENSION postgis;`) — necessário para geo na Fase 1+
- [ ] Rodar migrações contra o banco remoto:
  ```bash
  DATABASE_URL="postgresql://..." pnpm db:migrate
  ```
- [ ] Configurar `DATABASE_URL` na Vercel / ambiente da API quando `@freshy/api` estiver deployado

### 5. Validar o repositório localmente

Antes de abrir a Fase 1 no código:

- [ ] `bash scripts/setup-local-db.sh` — Postgres local sobe
- [ ] `pnpm install && pnpm db:generate && pnpm db:migrate && pnpm db:seed`
- [ ] `bash scripts/validation.sh` passa sem erros
- [ ] `pnpm dev` — web em `http://localhost:3000`, API em `http://localhost:4000`
- [ ] Screenshots locais (opcional): `pnpm screenshots` gera 4 imagens em `screenshots/`

---

## Recomendado — não bloqueia, mas evita retrabalho na Fase 1

### 6. Secrets do GitHub Actions (CI completo)

Sem isso o CI ainda roda lint/test/build, mas screenshots no PR podem não publicar no GCS.

- [ ] `GCP_PROJECT_ID` — ver [infrastructure/gcp/README.md](../infrastructure/gcp/README.md)
- [ ] `GCS_BUCKET_NAME`
- [ ] `GCP_SA_KEY` — JSON da service account (nunca commitar)
- [ ] Confirmar que um PR de teste recebe comentário com previews das 4 páginas

### 7. Decisões de produto para a Fase 1

Não precisam estar implementadas, mas devem estar decididas antes do primeiro commit da Fase 1:

- [ ] **Categorias iniciais** — usar enum atual do Prisma (`CAFE`, `RESTAURANT`, `LIBRARY`, …) ou ajustar lista?
- [ ] **Escala de frio (AC)** — manter 3 níveis (`LIGHTLY_COOLED` → `FRIGID`) como no design?
- [ ] **Idioma da UI** — confirmar pt-BR como padrão na Fase 1
- [ ] **Provedor de auth** — adiar para Fase 4, mas decidir: Clerk vs Supabase (anotar escolha)

### 8. Alinhar UI do shell com o Stitch

O shell existe; antes do mapa real, vale uma passada visual:

- [ ] Comparar `/explore` com [mapa_freshy](stitch/mapa_freshy/screen.png)
- [ ] Comparar `/cooling` com [categorias_de_lugares](stitch/categorias_de_lugares/screen.png)
- [ ] Comparar `/places/[slug]` com [detalhes_do_local](stitch/detalhes_do_local/screen.png)
- [ ] Comparar `/profile` com [meu_perfil](stitch/meu_perfil/screen.png)
- [ ] Listar gaps visíveis (copy pt-BR, ícones Material Symbols, links na `BottomNavBar`) num issue ou no PR da Fase 1

### 9. Domínio e URLs (opcional)

- [ ] Registrar domínio (ex.: `freshy.app`)
- [ ] Apontar DNS na Vercel
- [ ] Atualizar CORS do GCS se usar domínio customizado ([gcp/README.md](../infrastructure/gcp/README.md))

---

## Checklist rápido — “posso começar a Fase 1?”

Marque **sim** mentalmente só quando todos estiverem verdadeiros:

| #   | Pergunta                                               | Sim? |
| --- | ------------------------------------------------------ | ---- |
| 1   | App deployado na Vercel (preview + prod) sem erro?     | [ ]  |
| 2   | Cidade piloto e centro do mapa definidos?              | [ ]  |
| 3   | `NEXT_PUBLIC_MAPBOX_TOKEN` configurado local + Vercel? | [ ]  |
| 4   | Banco remoto com PostGIS e migrações aplicadas?        | [ ]  |
| 5   | `bash scripts/validation.sh` passa na sua máquina?     | [ ]  |

**Se os 5 estiverem OK → iniciar Fase 1** seguindo [development-cycle.md](development-cycle.md) (TDD: teste falhando primeiro).

---

## Primeiro passo da Fase 1 (quando liberar)

Ordem sugerida no código (já no [roadmap](roadmap.md)):

1. `test:` geo query / schema PostGIS (se ainda não houver índice espacial)
2. `feat:` seed ~50 lugares na cidade piloto
3. `feat:` Mapbox GL JS na tela `/explore`
4. `feat:` `GET /places?lat&lng&radius&category&q`
5. `feat:` marcadores + card de preview inferior

---

## Referências

| Documento                                                       | Uso                            |
| --------------------------------------------------------------- | ------------------------------ |
| [roadmap.md](roadmap.md)                                        | Fases 0–8 e critérios de saída |
| [development-cycle.md](development-cycle.md)                    | Ciclo TDD obrigatório          |
| [CONTRIBUTING.md](../CONTRIBUTING.md)                           | Regras de qualidade e PR       |
| [DESIGN.md](stitch/freshy/DESIGN.md)                            | Tokens e componentes visuais   |
| [infrastructure/gcp/README.md](../infrastructure/gcp/README.md) | GCS e secrets de CI            |

---

_Última atualização: junho de 2026_
