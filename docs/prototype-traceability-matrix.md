# Design System Traceability Matrix

Maps prototype surfaces to their Unity Design System sources
(docs/unity-design-system.md), the prototype application rules
(docs/prototype-style-guide.md), where the presentation lives, and the
automated check that guards them. One row per surface; append rows as
surfaces land.

| Surface | Route / mount | Unity components used | Tokens / primitives | Presentation | Automated check |
|---|---|---|---|---|---|
| Dashboard → Promotion health card (PROTOTYPE, mock data) | `/admin/dashboard` → `.dash-kpis` grid, `frontend/src/components/dashboard/PromotionHealthCard.tsx` + `frontend/src/components/observability/PromotionHealth.tsx` | Dropdown Menu (Promotion / View selects), Chips (alert chips), Badge (Pill — firing count), segmented control (1h/24h/7d range, mirrors dashboard period control), Notices (error state) | `Badge` from `components/ui`; `T.navy`, `T.destructive`, `T.destructiveActive` (Recharts strokes); scoped `.promo-health` / `.promo-health-card` block annotated with T.* / Unity sources; type 20/15/14/12; spacer scale only | `frontend/src/app/design-system.css` (`.promo-health` block); sole inline style = funnel bar width; data from `frontend/src/lib/observability/mockPromotionHealth.ts`, selection persisted by `frontend/src/hooks/usePromotionHealthSelection.ts` (`promo-health:selection`) | `frontend/tests/promotion-health-card.spec.ts` (5 cases, `--workers=1`) |
