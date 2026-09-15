# Unity Design System

Reference documentation generated from the Figma file **Unity - Design System** (Betika brand), extracted via the Figma Desktop Bridge plugin.

- **Figma file:** [Unity - Design System](https://www.figma.com/design/0diNFcr76QrtvRlj5Nmbbu/Unity---Design-System)
- **File key:** `0diNFcr76QrtvRlj5Nmbbu`
- **Extracted:** June 17, 2026
- **Scope:** 9 variable collections (636 variables), 82 text styles, 119 component sets/components

> **Note on source data:** Color values and component variant structures below were read directly from Figma variables and components through the Desktop Bridge plugin. The REST API token configured for this workspace returned an invalid-token error for the `styles` and standalone `components` endpoints, so a handful of legacy (non-variable) Figma color/effect/grid styles are not included here — everything modeled as a Figma **variable** (which covers the entire token system: colors, spacing, radius, opacity, breakpoints, typography) is fully represented.

---

## 1. Color Tokens

The system is built on two layers: a `.Primitives` collection (raw color ramps) and a `01. Semantic Colours` collection (role-based tokens that alias into primitives). Both primitives and semantics ship with two modes — for this product the two modes are **not** a conventional light-background/dark-background pair; both skew toward dark surfaces with white/cyan-tinted text, consistent with the Betika sports-betting product's dark-first UI. Treat them as **theme A / theme B** rather than assuming "Light" means a white background.

### 1.1 Semantic color tokens

Grouped by the UI area they style. Values are resolved (alias chains followed to their final primitive).

**Accordions**

| Token | Light UI | Dark UI |
|---|---|---|
| foreground | `#F1FDFF` | `#FFFFFF` |
| background | `rgba(255, 255, 255, 0.02)` | `rgba(255, 255, 255, 0.05)` |
| foreground-active | `#F1FDFF` | `#FFFFFF` |
| border | `rgba(255, 255, 255, 0.15)` | `rgba(255, 255, 255, 0.15)` |
| background-disabled | `rgba(255, 255, 255, 0.05)` | `#FFFFFF` |
| foreground-disabled | `rgba(255, 255, 255, 0.6)` | `rgba(255, 255, 255, 0.6)` |
| backgroun-active | `#111111` | `rgba(255, 255, 255, 0.15)` |

**Account Balance**

| Token | Light UI | Dark UI |
|---|---|---|
| background | `rgba(0, 21, 40, 0.7)` | `rgba(255, 255, 255, 0.05)` |
| foreground | `#F1FDFF` | `#FFFFFF` |
| border | `#A4A4A4` | `#A4A4A4` |

**Badges**

| Token | Light UI | Dark UI |
|---|---|---|
| background | `rgba(255, 255, 255, 0.05)` | `rgba(255, 255, 255, 0.05)` |
| foreground | `#F1FDFF` | `#001528` |
| success | `#47AA39` | `#007600` |
| success-foreground | `#020203` | `#FFFFFF` |
| destructive | `#AD0000` | `#AD0000` |
| destructive-foreground | `#020203` | `#FFFFFF` |
| ghost | `rgba(0, 21, 40, 0)` | `rgba(255, 255, 255, 0)` |
| ghost-foreground | `#F1FDFF` | `#FFFFFF` |
| ghost-border | `rgba(255, 255, 255, 0.15)` | `rgba(255, 255, 255, 0.15)` |
| verified-foreground | `#020203` | `#001528` |
| verified-background | `rgba(255, 255, 255, 0.8)` | `rgba(255, 255, 255, 0.8)` |
| Warning-foreground | `#FFFFFF` | `#020203` |
| Warning-background | `#FFDE24` | `#FFDE24` |

**Banner**

| Token | Light UI | Dark UI |
|---|---|---|
| background | `rgba(255, 255, 255, 0.8)` | `rgba(255, 255, 255, 0.8)` |
| foreground | `#020203` | `#001528` |
| icon-background | `rgba(255, 255, 255, 0.5)` | `rgba(255, 255, 255, 0.5)` |
| link | `#005B00` | `#007600` |
| icon-warning-foreground | `#FFDE24` | `#E3C200` |
| icon-error-foreground | `#CC3225` | `#AD0000` |
| icon-success-foreground | `#005B00` | `#007600` |

**Border**

| Token | Light UI | Dark UI |
|---|---|---|
| Black | `rgba(255, 255, 255, 0.15)` | `rgba(255, 255, 255, 0.15)` |
| White | `rgba(0, 21, 40, 0.15)` | `rgba(0, 21, 40, 0.15)` |
| Red | `#AD0000` | `#CC3225` |
| Green | `#47AA39` | `#47AA39` |
| Yellow | `#FFDE24` | `#FFDE24` |
| Black Solid | `#F1FDFF` | `#FFFFFF` |
| White Solid | `#020203` | `#001528` |
