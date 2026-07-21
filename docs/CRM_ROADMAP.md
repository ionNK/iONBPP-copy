# iGaming CRM — Feature List & Roadmap

**Vision:** Build a player-centric CRM (in the spirit of Fast Track, Xtremepush, OpenSignal) that acts as the **data + intelligence backbone** of the platform. Players are **synced from the gaming platform** — never created manually. The existing **Promotions** module is the *activation/engagement layer* that sits on top of the CRM and fires against CRM segments, triggers, and player scores.

```
                        ┌─────────────────────────────────────────┐
                        │              PROMOTIONS (exists)          │  ← Activation layer
                        │   journeys · bonuses · multi-channel      │
                        └───────────────▲───────────────▲──────────┘
                                        │ segments      │ triggers/scores
        ┌───────────────────────────────┴───────────────┴───────────────────────┐
        │                              CRM CORE                                   │
        │  Player 360  ·  Segmentation  ·  Intelligence  ·  RG/Compliance  ·  Analytics │
        └───────────────────────────────▲─────────────────────────────────────────┘
                                         │ event stream + batch sync
                              ┌──────────┴──────────┐
                              │   Gaming Platform    │  (source of truth for players)
                              └──────────────────────┘
```

---

## What already exists (reuse, do not rebuild)

| Existing module | Role in CRM |
|---|---|
| `admin/promotions` | Engagement/activation layer — **excluded** from CRM build, wired later |
| `admin/predictions/churn` | Intelligence: churn scoring — surface on Player 360 & segments |
| `admin/predictions/promotions` | Intelligence: promo propensity |
| `admin/predictions/responsible-gambling` | RG risk scoring — feeds RG/Compliance |
| `admin/segments/create` | Segmentation starting point — extend into full engine |
| `admin/governance` | Compliance surface |
| `admin/reports`, `admin/experiments` | Analytics & A/B testing |

**Net-new for CRM:** Player Data Layer (Player 360), and a real Segmentation Engine. Everything else is *connective tissue* linking existing modules into one CRM experience.

---

## Phase 1 — Player Data Layer (Foundation) 🎯 *build first*

Players are ingested from the platform; the CRM never has an "Add Customer" action.

- **Player list (synced)** — searchable/filterable table of platform players; no manual create.
- **Player 360 profile:**
  - Identity & KYC status, account status, registration date, country/currency.
  - Balances (real / bonus), deposit & withdrawal history.
  - Gaming activity: sportsbook vs casino, bets, sessions, favourite games.
  - Bonus history & current active bonuses.
  - Financial metrics: GGR, NGR, LTV, ARPU, deposit frequency, bonus cost ratio.
  - RG flags & communication consents (read-only from platform where applicable).
- **Unified activity timeline** — chronological event feed (login, deposit, bet, win, bonus, withdrawal, session).
- **Data ingestion** — event stream/webhook (real-time) + nightly batch reconciliation. (Mock/adapter layer first, real integration later.)

## Phase 2 — Segmentation Engine

- **Dynamic segment builder** — visual rule builder (AND/OR conditions on player attributes & behaviors), auto-refreshing membership. Extend existing `segments/create`.
- **Predefined lifecycle segments** — New, Active, VIP/High-roller, At-risk, Dormant, Churned, Reactivated.
- **Value & behavioral segments** — RFM scoring, LTV tiers, product preference (sportsbook/casino).
- **Segment → Promotions handoff** — expose segments to the Promotions module as targeting audiences.

## Phase 3 — Intelligence / Predictions (wire in existing)

- Surface **churn score**, **promo propensity**, and **RG risk** directly on Player 360 and in segment rules.
- **Next-best-action** recommendations & cross-sell (sportsbook ↔ casino).
- **CLV forecast** and **bonus-abuse / fraud risk** indicators.

## Phase 4 — Responsible Gaming & Compliance (connect `governance`)

- RG monitoring: deposit/loss/time limits, self-exclusion, intervention triggers.
- Consent & suppression management: marketing consent, frequency caps, cool-off suppression that Promotions must respect.

## Phase 5 — Analytics & Reporting (connect `reports` / `experiments`)

- Player & cohort dashboards, retention curves, funnel analysis.
- Campaign/segment performance: conversion, uplift vs control, bonus ROI (A/B via experiments).

---

## Suggested build order

1. **Phase 1 — Player Data Layer + Player 360** (rework current CRM to sync-based, remove manual add). ← recommended next
2. **Phase 2 — Segmentation Engine** (feeds Promotions targeting).
3. **Phase 3 — Intelligence wiring** (reuse prediction pages).
4. **Phase 4 & 5 — Compliance + Analytics connections.**

> Note: The **Promotions** module already covers journeys, multi-channel delivery, triggers, and bonus activation. It is intentionally **out of scope** for the CRM build and will be updated later to consume CRM segments/triggers.
