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

**Buttons**

| Token | Light UI | Dark UI |
|---|---|---|
| primary-background | `#FFDE24` | `#FFDE24` |
| secondary-background | `#C6E4FF` | `#001D3D` |
| destructive-background | `#AD0000` | `#AD0000` |
| warning | `#FFDE24` | `#FFDE24` |
| success | `#47AA39` | `#47AA39` |
| primary-foreground | `#F1FDFF` | `#001528` |
| secondary-foreground | `#020203` | `#FFFFFF` |
| Link-foreground | `#47AA39` | `#47AA39` |
| odds | `rgba(255, 255, 255, 0.05)` | `rgba(255, 255, 255, 0.1)` |
| odds-selected | `#FFDE24` | `#FFDE24` |
| odds-foreground | `#F1FDFF` | `#FFFFFF` |
| ghost-border | `#F1FDFF` | `#FFFFFF` |
| tabs | `#F1FDFF` | `#FFFFFF` |
| chips | `rgba(255, 255, 255, 0.1)` | `rgba(255, 255, 255, 0.1)` |
| destructive-foreground | `#020203` | `#FFFFFF` |
| warning-foreground | `#F1FDFF` | `#001528` |
| success-foreground | `#020203` | `#FFFFFF` |
| ghost-foreground | `#F1FDFF` | `#FFFFFF` |
| odds-selected-foreground | `#F1FDFF` | `#001528` |
| tabs-foreground | `#020203` | `#001528` |
| chips-foreground | `#020203` | `#001528` |
| primary-background-active | `#FFEA73` | `#FFEA73` |
| secondary-background-active | `#262626` | `#DEDEDE` |
| destructive-background-active | `#CC3225` | `#CC3225` |
| ghost-border-active | `#F1FDFF` | `#DEDEDE` |
| Side nav-background-active | `rgba(255, 255, 255, 0.05)` | `rgba(255, 255, 255, 0.05)` |
| Side nav-background-hover | `#262626` | `#DEDEDE` |
| Side nav-foreground-hover | `#F1FDFF` | `#001528` |

**Chips**

| Token | Light UI | Dark UI |
|---|---|---|
| foreground | `#F1FDFF` | `#FFFFFF` |
| background | `rgba(255, 255, 255, 0.05)` | `rgba(255, 255, 255, 0.05)` |
| background-active | `rgba(255, 255, 255, 0.05)` | `rgba(255, 255, 255, 0.05)` |
| primary-foreground-active | `#020203` | `#001528` |
| border | `#A4A4A4` | `#A4A4A4` |

**Date Picker**

| Token | Light UI | Dark UI |
|---|---|---|
| background | `rgba(0, 21, 40, 0.9)` | `#001D3D` |
| foreground | `#F1FDFF` | `#FFFFFF` |
| background-active | `#FFDE24` | `#FFDE24` |
| foreground-active | `#F1FDFF` | `#001528` |
| border | `#262626` | `#111111` |
| background-In Range | `rgba(255, 255, 255, 0.1)` | `rgba(255, 255, 255, 0.1)` |
| background-Hover | `rgba(255, 255, 255, 0.05)` | `rgba(255, 255, 255, 0.05)` |
| foreground-Hover | `#F1FDFF` | `#001528` |

**Dialog**

| Token | Light UI | Dark UI |
|---|---|---|
| background | `rgba(0, 21, 40, 0.9)` | `#001D3D` |
| foreground | `#F1FDFF` | `#FFFFFF` |
| border | `rgba(255, 255, 255, 0.15)` | `rgba(255, 255, 255, 0.15)` |

**Divider**

| Token | Light UI | Dark UI |
|---|---|---|
| border | `rgba(255, 255, 255, 0.15)` | `rgba(255, 255, 255, 0.15)` |

**Drawer**

| Token | Light UI | Dark UI |
|---|---|---|
| background | `#020203` | `#001D3D` |
| foreground | `#F1FDFF` | `#FFFFFF` |
| border | `rgba(255, 255, 255, 0.15)` | `rgba(255, 255, 255, 0.15)` |

**Dropdown Menu**

| Token | Light UI | Dark UI |
|---|---|---|
| foreground | `#F1FDFF` | `#FFFFFF` |
| background | `rgba(0, 21, 40, 0.9)` | `#001D3D` |

**Icon**

| Token | Light UI | Dark UI |
|---|---|---|
| primary | `#F1FDFF` | `#FFFFFF` |
| secondary | `#A4A4A4` | `#888888` |
| destructive | `#AD0000` | `#CC3225` |
| white | `#020203` | `#001528` |
| disabled | `#6E6E6E` | `#545454` |
| success | `#47AA39` | `#47AA39` |
| warning | `#FFDE24` | `#FFDE24` |
| static-white | `#020203` | `#FFFFFF` |

**Information**

| Token | Light UI | Dark UI |
|---|---|---|
| background | `rgba(0, 21, 40, 0.9)` | `#001D3D` |
| primary-foreground | `#F1FDFF` | `#FFFFFF` |
| border | `rgba(255, 255, 255, 0.15)` | `rgba(255, 255, 255, 0.15)` |

**Inputs**

| Token | Light UI | Dark UI |
|---|---|---|
| background | `rgba(255, 255, 255, 0.05)` | `rgba(255, 255, 255, 0.05)` |
| foreground | `#F1FDFF` | `#FFFFFF` |
| link | `#005B00` | `#007600` |
| icon-error-foreground | `#AD0000` | `#EB5141` |
| icon-success-foreground | `#005B00` | `#007600` |
| secondary-foreground | `#6E6E6E` | `#C0C0C0` |
| border | `rgba(255, 255, 255, 0.1)` | `rgba(255, 255, 255, 0.1)` |
| border-active | `rgba(255, 255, 255, 0.7)` | `rgba(255, 255, 255, 0.7)` |
| border-error | `#AD0000` | `#EB5141` |

**Link**

| Token | Light UI | Dark UI |
|---|---|---|
| foreground | `#F1FDFF` | `#FFFFFF` |

**Pagination**

| Token | Light UI | Dark UI |
|---|---|---|
| background | `rgba(255, 255, 255, 0.1)` | `rgba(255, 255, 255, 0.1)` |
| foreground | `#F1FDFF` | `#FFFFFF` |
| foreground-active | `rgba(255, 255, 255, 0.05)` | `rgba(255, 255, 255, 0.05)` |
| border | `rgba(255, 255, 255, 0.15)` | `rgba(255, 255, 255, 0.15)` |

**Progress**

| Token | Light UI | Dark UI |
|---|---|---|
| background | `rgba(255, 255, 255, 0)` | `rgba(255, 255, 255, 0)` |
| foreground | `#F1FDFF` | `#FFFFFF` |
| foregound-active | `#47AA39` | `#47AA39` |
| border | `rgba(255, 255, 255, 0.1)` | `rgba(255, 255, 255, 0.1)` |
| border-active | `rgba(255, 255, 255, 0.7)` | `rgba(255, 255, 255, 0.7)` |

**Scrim**

| Token | Light UI | Dark UI |
|---|---|---|
| background | `rgba(255, 255, 255, 0.8)` | `rgba(0, 21, 40, 0.3)` |

**Selection Controls**

| Token | Light UI | Dark UI |
|---|---|---|
| background | `rgba(255, 255, 255, 0.2)` | `rgba(255, 255, 255, 0.2)` |
| foreground | `#020203` | `#FFFFFF` |
| success | `#47AA39` | `#007600` |
| success-foreground | `#020203` | `#FFFFFF` |
| destructive | `#AD0000` | `#EB5141` |
| destructive-foreground | `#020203` | `#FFFFFF` |
| background-disabled | `rgba(255, 255, 255, 0.1)` | `rgba(255, 255, 255, 0.3)` |
| border | `rgba(255, 255, 255, 0.15)` | `rgba(255, 255, 255, 0.15)` |
| border-destructive | `#AD0000` | `#EB5141` |
| foreground-disabled | `rgba(255, 255, 255, 0.1)` | `rgba(255, 255, 255, 0.15)` |
| border-success | `#47AA39` | `#007600` |

**Skeleton**

| Token | Light UI | Dark UI |
|---|---|---|
| background | `rgba(255, 255, 255, 0.1)` | `rgba(255, 255, 255, 0.15)` |

**Table**

| Token | Light UI | Dark UI |
|---|---|---|
| background | `rgba(255, 255, 255, 0)` | `rgba(255, 255, 255, 0)` |
| foreground | `#F1FDFF` | `#FFFFFF` |
| foreground-secondary | `#DEDEDE` | `#C0C0C0` |
| border | `rgba(255, 255, 255, 0.1)` | `rgba(255, 255, 255, 0.1)` |
| border-active | `rgba(255, 255, 255, 0.7)` | `rgba(255, 255, 255, 0.7)` |
| background-active | `rgba(255, 255, 255, 0.02)` | `rgba(255, 255, 255, 0.02)` |

**Tabs**

| Token | Light UI | Dark UI |
|---|---|---|
| background | `rgba(255, 255, 255, 0.05)` | `rgba(255, 255, 255, 0.05)` |
| foreground-active | `#001528` | `#001528` |
| foreground | `#F1FDFF` | `#FFFFFF` |
| Border | `#F1FDFF` | `#FFFFFF` |

**Text**

| Token | Light UI | Dark UI |
|---|---|---|
| primary | `#F1FDFF` | `#FFFFFF` |
| secondary | `#DEDEDE` | `#888888` |
| destructive | `#AD0000` | `#CC3225` |
| White | `#020203` | `#001528` |
| disabled | `#6E6E6E` | `#545454` |
| success | `#47AA39` | `#47AA39` |
| White-static | `#020203` | `#FFFFFF` |

**Toasts**

| Token | Light UI | Dark UI |
|---|---|---|
| background | `rgba(255, 255, 255, 0.8)` | `rgba(255, 255, 255, 0.8)` |
| foreground | `#020203` | `#001528` |
| link | `#005B00` | `#7EE271` |
| icon-background | `rgba(255, 255, 255, 0.6)` | `rgba(255, 255, 255, 0.6)` |
| icon-warning-foreground | `#FFDE24` | `#E3C200` |
| icon-error-foreground | `#CC3225` | `#AD0000` |
| icon-success-foreground | `#005B00` | `#007600` |

**Tooltip**

| Token | Light UI | Dark UI |
|---|---|---|
| background | `#111111` | `#001D3D` |
| primary-foreground | `#F1FDFF` | `#FFFFFF` |
### 1.2 Primitive color ramps

The raw color scales that semantic tokens reference. Each ramp runs from a light tint (low number) to a deep shade (high number), per Figma's `.Primitives` collection (modes: Dark / Light).


**App Store**

| Token | Dark mode value | Light mode value |
|---|---|---|
| betika-white | `#020203` | `#FFFFFF` |
| betika-black | `#FFFFFF` | `#020203` |

**Base**

| Token | Dark mode value | Light mode value |
|---|---|---|
| betika-black | `#020203` | `#FFFFFF` |
| betika-white | `#FFFFFF` | `#020203` |

**Betika Brand Blue**

| Token | Dark mode value | Light mode value |
|---|---|---|
| Betika Brand Blue | `#213D8F` | `#213D8F` |

**Blue**

| Token | Dark mode value | Light mode value |
|---|---|---|
| betika-50 | `#F1FDFF` | `#001528` |
| betika-100 | `#C6E4FF` | `#001D3D` |
| betika-200 | `#9FCAFF` | `#2B5185` |
| betika-300 | `#87B1EB` | `#41689D` |
| betika-400 | `#6F98D1` | `#587FB7` |
| betika-500 | `#587FB7` | `#6F98D1` |
| betika-600 | `#587FB7` | `#6F98D1` |
| betika-700 | `#41689D` | `#87B1EB` |
| betika-800 | `#2B5185` | `#9FCAFF` |
| betika-900* | `#001D3D` | `#C6E4FF` |
| betika-950 | `#001528` | `#F1FDFF` |

**Green**

| Token | Dark mode value | Light mode value |
|---|---|---|
| betika-50 | `#E7FFE1` | `#001100` |
| betika-100 | `#9AFE8C` | `#002800` |
| betika-200 | `#7EE271` | `#004100` |
| betika-300 | `#63C656` | `#005B00` |
| betika-400 | `#47AA39` | `#005B00` |
| betika-500 | `#299019` | `#007600` |
| betika-600* | `#007600` | `#47AA39` |
| betika-700 | `#005B00` | `#63C656` |
| betika-800 | `#004100` | `#7EE271` |
| betika-900 | `#002800` | `#9AFE8C` |
| betika-950 | `#001100` | `#E7FFE1` |

**Grey**

| Token | Dark mode value | Light mode value |
|---|---|---|
| betika-50 | `#FCFCFC` | `#111111` |
| betika-100 | `#DEDEDE` | `#262626` |
| betika-200 | `#C0C0C0` | `#3C3C3C` |
| betika-300 | `#A4A4A4` | `#545454` |
| betika-400 | `#888888` | `#6E6E6E` |
| betika-500 | `#6E6E6E` | `#888888` |
| betika-600 | `#545454` | `#A4A4A4` |
| betika-700 | `#3C3C3C` | `#C0C0C0` |
| betika-800 | `#262626` | `#DEDEDE` |
| betika-900 | `#111111` | `#FCFCFC` |
| 950* | `#050505` | `#050505` |

**Red**

| Token | Dark mode value | Light mode value |
|---|---|---|
| betika-100 | `#FFCEC3` | `#FFCEC3` |
| betika-200 | `#FFA293` | `#FFA293` |
| betika-300 | `#FF6F5C` | `#FF6F5C` |
| betika-400 | `#EB5141` | `#EB5141` |
| betika-500 | `#CC3225` | `#CC3225` |
| betika-600* | `#AD0000` | `#AD0000` |
| betika-700 | `#8D0000` | `#8D0000` |
| betika-800 | `#670000` | `#670000` |
| betika-900 | `#440000` | `#440000` |
| betika-950 | `#240000` | `#240000` |

**Yellow**

| Token | Dark mode value | Light mode value |
|---|---|---|
| betika-50 | `#FFFDAE` | `#FFFDAE` |
| betika-100* | `#FFDE24` | `#FFDE24` |
| betika-200 | `#E3C200` | `#E3C200` |
| betika-300 | `#C7A800` | `#C7A800` |
| betika-400 | `#A98E00` | `#A98E00` |
| betika-500 | `#8D7600` | `#8D7600` |
| betika-600 | `#715E00` | `#715E00` |
| betika-700 | `#574700` | `#574700` |
| betika-800 | `#3E3100` | `#3E3100` |
| betika-900 | `#261D00` | `#261D00` |
---

## 2. Typography

Base typeface is **Inter** for product UI. Platform-native type styles (Apple SF Pro, Android Roboto) are also defined for native app surfaces — see §2.2.

### 2.1 Type scale (Inter)

Values come from the `09. Typography` variable collection, which has separate **Mobile** and **Desktop** modes — most styles share line-height between breakpoints but bump font-size on desktop for Display and Heading styles.

| Style | Mobile size/line-height | Desktop size/line-height | Weight | Letter-spacing |
|---|---|---|---|---|
| Display/D1 | 60/96px | 64/96px | 700 | -2px |
| Display/D2 | 50/90px | 52/90px | 700 | -2px |
| Display/D3 | 48/80px | 52/80px | 700 | -2px |
| Heading/H1/Regular | 36/44px | 40/44px | 400 | -1px |
| Heading/H1/Bold | 36/44px | 40/44px | 500 | -1px |
| Heading/H2/Regular | 32/40px | 36/44px | 400 | -1px |
| Heading/H2/Bold | 32/40px | 36/44px | 500 | -1px |
| Heading/H3/Regular | 26/36px | 28/38px | 400 | -1px |
| Heading/H3/Bold | 26/36px | 28/38px | 500 | -1px |
| Heading/H4/Regular | 22/30px | 24/40px | 400 | 0px |
| Heading/H4/Bold | 22/30px | 24/40px | 500 | 0px |
| Heading/H5/Regular | 18/28px | 20/30px | 400 | 0px |
| Heading/H5/Bold | 18/28px | 20/30px | 500 | 0px |
| Body/B1/Regular | 15/22px | 15/19px | 400 | 0px |
| Body/B1/Regular Underline | 15/22px | 15/19px | — | 0px |
| Body/B1/Bold | 15/22px | 15/19px | 700 | 0px |
| Body/B1/Bold Underline | 15/22px | 15/21px | — | 0px |
| Body/B2/Regular | 14/20px | 14/21px | 400 | 0px |
| Body/B2/Regular Underline | 14/20px | 14/21px | — | 0px |
| Body/B2/Bold | 14/20px | 14/21px | 700 | 0px |
| Body/B2/Bold Underline | 14/20px | 14/21px | — | 0px |
| Footnote/Regular | 14/19px | 14/19px | 400 | 0px |
| Footnote/Regular Underline | 14/19px | 14/19px | — | 0px |
| Footnote/Bold Underline | 14/19px | 14/19px | — | 0px |
| Footnote/Bold | 14/19px | 14/19px | 700 | 0px |
| Caption/Regular | 12/Nonepx | 12/Nonepx | 400 | 0.17299999296665192px |
| Caption/Regular Underline | 12/16px | 12/16px | — | 0.17299999296665192px |
| Caption/Bold | 12/16px | 12/16px | 500 | 0.17299999296665192px |
| Caption/Bold Underline | 12/16px | 12/16px | 700 | 0.17299999296665192px |
| TermsConditions | 8/16px | 8/16px | 400 | 0.17299999296665192px |
### 2.2 Platform-native text styles

In addition to the responsive Inter scale, the file defines fixed-size text styles matching each OS's native type system — useful when a screen needs to look like stock iOS or Android chrome (system sheets, permission prompts, keyboards) rather than the branded Inter scale.

**Apple SF Pro** — Large Title (34px) down to Caption 2 (11px), each with Regular / Emphasised / Italic variants, matching Apple's Human Interface Guidelines type scale.

**Android Roboto** — Display Large (57px) down to Label Small (11px), following Material Design 3's type scale (Display / Headline / Title / Label / Body tiers).

Full list of the 82 raw text styles is available in Figma's Text Styles panel (Dev Mode) under "7. Apple SF Pro/…" and "8. Android Roboto/…".

---

## 3. Spacing, Radius & Layout

### 3.1 Spacers

Single-mode scale used for gaps and padding (`02. Spacing` collection):

| Token | Value (px) |
|---|---|
| Spacer 0 | 0 |
| Spacer 1 | 1 |
| Spacer 2 | 2 |
| Spacer 4 | 4 |
| Spacer 8 | 8 |
| Spacer 12 | 12 |
| Spacer 14 | 14 |
| Spacer 16 | 16 |
| Spacer 18 | 18 |
| Spacer 20 | 20 |
| Spacer 24 | 24 |
| Spacer 32 | 32 |
| Spacer 48 | 48 |
| Spacer 60 | 60 |
| Spacer 80 | 80 |
| Spacer 120 | 120 |

### 3.2 Border radius

| Token | Value (px) |
|---|---|
| Extra Small | 4 |
| Small | 8 |
| Medium | 14 |
| Large | 20 |
| Extra Large | 999 (fully rounded / pill) |

### 3.3 Breakpoints & grid

From the `08. Breakpoints` collection — four responsive tiers:

| Property | Mobile | Tablet Portrait | Tablet Landscape | Desktop |
|---|---|---|---|---|
| Default width | 375 | 768 | 1366 | 1920 |
| Default height | 812 | 1024 | 1024 | 1080 |
| Min screen | 320 | 640 | 1280 | 1920 |
| Max screen | 640 | 1280 | 1920 | 2560 |
| Screen padding | 20 | 28 | 36 | 44 |
| Screen margin | 24 | 36 | 48 | 60 |
| Grid columns | 4 | 8 | 12 | 16 |
| Grid gutter | 24 | 24 | 24 | 24 |


---

## 4. Opacity / Transparency Tokens

A dedicated `07. Opacity` collection provides white and black overlay tints at fixed alpha steps, used for scrims, disabled states, dividers, and subtle fills rather than hardcoding `rgba()` values. Values are theme-aware (the underlying color flips between white-based and black-based depending on mode, while the alpha stays constant):

| Token | Theme A (Light UI) | Theme B (Dark UI) |
|---|---|---|
| 2% | rgba(255,255,255,0.02) | rgba(0,21,40,0.02) |
| 5% | rgba(255,255,255,0.05) | rgba(0,21,40,0.05) |
| 10% | rgba(255,255,255,0.1) | rgba(0,21,40,0.1) |
| 15% | rgba(255,255,255,0.15) | rgba(0,21,40,0.15) |
| 25% | rgba(255,255,255,0.2) | rgba(0,21,40,0.2) |
| 50% | rgba(255,255,255,0.5) | rgba(0,21,40,0.5) |
| 60% | rgba(255,255,255,0.6) | rgba(0,21,40,0.6) |
| 70% | rgba(255,255,255,0.7) | rgba(0,21,40,0.7) |
| 80% | rgba(255,255,255,0.8) | rgba(0,21,40,0.8) |
| 90% | rgba(255,255,255,0.9) | rgba(0,21,40,0.9) |

Plus inverse "Black"-prefixed tokens (same alpha steps, opposite base color) and a dedicated **Scrim** token (`rgba(0,20,37,0.8)` on Theme A / `rgba(0,20,37,0.3)` on Theme B) used behind modals and drawers.

---

## 5. Component Library

119 components/component sets across the file. Below: detailed variant structure for the most-used interactive components, followed by a complete inventory grouped by purpose.

### 5.1 Key components — variant structure

**Button** — the largest component set (133 variants): `Variant` × `State` × `Size`
- Variant: Default, Secondary, Ghost, Outline, Destructive, Link
- State: Default, Hover, Focus, Pressed, Disabled, Loading
- Size: sm, default, lg, icon

**Badge** — 17 variants: `Shape` × `Variant` × `Size`
- Shape: Pill, Circle
- Variant: Default, Secondary, Outline, Warning, Destructive, Live, Verified
- Size: Small, Large

**Checkbox** — 5 variants: `State` = Default, Hover, Active, Disabled, Error

**Text Field** — 7 variants: `State` = Default, Hover, Focused, Completed, Error, Disabled, Stake (a betting-specific input state)

**Tabs** — 2 variants: `Style` = Pill, Line

**Dialog** — 5 variants: `Viewport` (Desktop / Mobile) × `Type` (Basic, Guided, Media)

**Tooltip** — 12 variants: `Direction` (Top, Bottom, Left, Right) × `Pointer Position` (Leading, Middle, Trailing)

**Accordion** — 8 variants: `Active` (On/Off) × `State` (Default, Hover, Focus, Pressed)

### 5.2 Full component inventory


#### Buttons & Actions

| Component | Type | Variants / Size |
|---|---|---|
| Button | Component Set | 133 variants (Variant x State x Size) |
| Button Odds | Component Set | 8 variants |
| Odds Group | Component Set | 3 variants |
| Text Link | Component Set | 4 variants |
| Continue with Facebook / Centre / Fixed | Component | 345x44 |
| Continue with Google / Centre / Fixed | Component | 345x44 |
| Continue with Apple / Centre / Fixed | Component | 345x44 |

#### Forms & Inputs

| Component | Type | Variants / Size |
|---|---|---|
| Text Field | Component Set | 7 variants (State) |
| Text Field/Default | Component | 327x48 |
| Textarea | Component Set | 5 variants |
| Checkbox | Component Set | 5 variants (State) |
| Checkbox With Text | Component Set | 5 variants |
| Radio Button | Component Set | 8 variants |
| Switch | Component Set | 3 variants |
| Dropdown | Component | 109x354 |
| Country Selector | Component | 52x33 |
| InputOTP / Slot | Component Set | 3 variants |
| InputOTP | Component | 316x73 |
| Stepper | Component | 327x32 |
| File Upload | Component Set | 8 variants |
| Upload File | Component Set | 3 variants |
| Prefix/Sufix | Component Set | 2 variants |
| .Suffix | Component Set | 2 variants |
| .Prefix | Component Set | 3 variants |
| Wallet Input | Component | 343x134 |
| Stake/Pick/ID | Component | 319x33 |

#### Navigation

| Component | Type | Variants / Size |
|---|---|---|
| Navigation | Component Set | 4 variants |
| Nav Sidebar | Component Set | 3 variants |
| Sidebar link | Component Set | 5 variants |
| Tabs | Component Set | 2 variants (Style: Pill / Line) |
| Tabs / Trigger | Component Set | 4 variants |
| Breadcrumb | Component Set | 2 variants |
| Breadcrumb / BreadcrumbItem | Component Set | 11 variants |
| Pagination | Component Set | 2 variants |
| Pagination Items | Component Set | 12 variants |
| Pagination: Timer | Component Set | 16 variants |
| Sub Navigation | Component | 715x32 |
| Tap Nav | Component | 366x57 |

#### Feedback & Status

| Component | Type | Variants / Size |
|---|---|---|
| Badge | Component Set | 17 variants (Shape x Variant x Size) |
| Badge Status | Component Set | 5 variants |
| Banner | Component Set | 2 variants |
| Toast | Component | 521x76 |
| Toast/Icon | Component Set | 3 variants |
| Tooltip | Component Set | 12 variants (Direction x Pointer Position) |
| Dialog | Component Set | 5 variants (Viewport x Type) |
| Cookie Modal | Component Set | 2 variants |
| Drawer Header | Component Set | 2 variants |
| Drawer bottom App | Component Set | 2 variants |
| Popover | Component | 250x201 |
| Scrim | Component | 375x369 |
| Skeleton | Component Set | 4 variants |
| Empty States | Component Set | 3 variants |
| .Feedback | Component Set | 3 variants |
| Info Section | Component Set | 2 variants |

#### Disclosure & Content

| Component | Type | Variants / Size |
|---|---|---|
| Accordion / AccordionItem | Component Set | 8 variants (Active x State) |
| Accordion | Component | 360x196 |
| Chips | Component Set | 8 variants |
| Table/Cell | Component Set | 8 variants |
| Table / Head | Component Set | 2 variants |
| Table | Component | 638x614 |
| Divider Line Solid | Component Set | 2 variants |
| Calendar | Component | 264x320 |
| Step Number Small | Component Set | 4 variants |

#### Identity & Media

| Component | Type | Variants / Size |
|---|---|---|
| Avatar: Thumbnail | Component Set | 3 variants |
| Game Thumbnail | Component Set | 3 variants |
| Logo | Component Set | 2 variants |
| App Store | Component Set | 2 variants |
| Regulation Logos | Component Set | 6 variants |
| Social | Component Set | 6 variants |
| Footer | Component Set | 2 variants |
| Promo Banner | Component Set | 3 variants |
| Icon | Component Set | 2 variants |

#### Betting Product

| Component | Type | Variants / Size |
|---|---|---|
| Cards | Component Set | 2 variants |
| Match Listing | Component Set | 2 variants |
| Match Detail | Component Set | 7 variants |
| Betslip Match Selection | Component Set | 5 variants |
| Betslip Warnings | Component Set | 3 variants |
| Betslip Breakdown | Component | 270x112 |
| Freebet Ticket | Component Set | 2 variants |
| Single Open | Component Set | 2 variants |
| Multiple Open | Component Set | 2 variants |
| Card Header | Component | 319x24 |
| 1X2 | Component | 373x23 |
| Account Balance | Component | 343x159 |
| Dims | Component Set | 4 variants |
| _Days | Component Set | 6 variants |

#### Layout Helpers

| Component | Type | Variants / Size |
|---|---|---|
| Spacer | Component Set | 34 variants |
| Container spacer | Component Set | 4 variants |
| _Spacing | Component | 360x24 |
| _Container | Component | 1280x708 |
| _Swatch base | Component | 158x155 |

#### Platform / OS Chrome

| Component | Type | Variants / Size |
|---|---|---|
| 2. System Bar | Component Set | 3 variants |
| Keyboard/Default | Component Set | 2 variants |
| Keyboard/Numpad | Component Set | 2 variants |
| iOS Alphbetic Keyboard / English | Component Set | 4 variants |
| iOS Numeric Keyboard | Component Set | 2 variants |
| G-Board Alphabetic / English | Component Set | 4 variants |
| G-Board Numeric | Component Set | 2 variants |
| Permission iOS | Component Set | 14 variants |
| Permission Android | Component Set | 14 variants |
| Face ID Prompt | Component Set | 2 variants |
| Face ID Alert | Component Set | 3 variants |
| Touch ID Alert | Component Set | 3 variants |
| Passkey | Component Set | 8 variants |
| .icons | Component Set | 7 variants |

#### Docs / Meta

| Component | Type | Variants / Size |
|---|---|---|
| Designer Avatar | Component Set | 1 variant |
| Accessbility states | Component Set | 2 variants |
| Instances Mode Title | Component Set | 2 variants |
| H1 | Component | 188x28 |
| H2 | Component | 127x21 |
| H3 | Component | 99x16 |
| H4 | Component | 85x14 |
| Overview | Component | 500x758 |
| Log | Component | 404x74 |
| Doc/Header | Component | 738x244 |
| Design system header | Component | 2388x428 |
| Design system note | Component | 960x22 |
| Design system footer | Component | 2388x276 |
| Check | Component | 24x24 |

---

## 6. Caveats & Extraction Notes

- This document was generated from **token and component structure data** (variables, variant axes, text styles). It does not include rendered visual screenshots — request those separately via `includeImages` if needed for pixel-matching.
- The REST API token in this environment is invalid for this file, so legacy Figma Styles (non-variable color/effect/grid styles, if any exist) and the REST-based `components` metadata endpoint were not accessible. All data above came through the Desktop Bridge plugin instead, which covers the full token system used by this file.
- "Light UI" / "Dark UI" (and "Dark"/"Light" at the primitive level) are Figma's literal mode names in this file — they are **not** a standard light-background/dark-background pair. Don't assume "Light UI" implies a white surface; verify against a rendered frame before shipping.
- Component variant counts above are component **instances within a set**, not configurable props — actual prop/boolean toggles (e.g. "Show Icon") would need `figma_get_component_details` per component if your code generation needs the full property API rather than just variants.
