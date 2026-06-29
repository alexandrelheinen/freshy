# Milestones — Freshy

Checklists operacionais ligadas às [fases do roadmap](../roadmap.md). Cada milestone é um **gate**: marque todos os itens antes de começar a codar a fase seguinte.

## Milestone vs roadmap — o que é o quê?

| Documento | Papel | Pergunta que responde |
| --------- | ----- | --------------------- |
| **[roadmap.md](../roadmap.md)** | Backlog de produto e engenharia | _O que_ construir, em que ordem? |
| **milestones/** (esta pasta) | Preparação operacional por fase | _O que configurar_ (contas, deploy, decisões) antes de codar? |
| **[development-cycle.md](../development-cycle.md)** | Fluxo de código (TDD) | _Como_ implementar cada item do roadmap? |

O conteúdo que estava em `todo_0.md` é **uma milestone só** — a bootstrap da Fase 0. Não são várias milestones num arquivo: é o checklist completo para sair da Fase 0 e entrar na Fase 1 (mapa com dados reais).

## Milestones ativas

| Milestone | Documento | Fase do roadmap | Conteúdo |
| --------- | --------- | --------------- | -------- |
| **0 — Bootstrap** | [phase-0-bootstrap.md](phase-0-bootstrap.md) | Fase 0 — Foundation | Ambiente local, cidade piloto, Mapbox, Postgres remoto, Cloudflare Pages, R2/CI, decisões de produto, QA visual |
| **1 — Mapa** | _(futuro)_ | Fase 1 — Places & Map | Será criado se a fase exigir setup manual além do código |
| **2+** | _(futuro)_ | Fases 2–7 | Um doc por fase, só quando houver passos operacionais |

## Critério de saída da Milestone 0

App aberto na internet com visual Freshy (cores, fonte, menu inferior) — ainda **sem** mapa real nem API de lugares. Depois disso, siga a [Fase 1 no roadmap](../roadmap.md#phase-1--places--map-read-only-mvp).

---

_Última atualização: junho de 2026_
