/**
 * Unity Design System — prototype tokens.
 * Canonical system: docs/unity-design-system.md
 * Application rules: docs/prototype-style-guide.md
 *
 * Light-surface adaptation: white cards on a light page background using
 * Dark-UI-mode semantic values (navy foregrounds) and the black-based
 * rgba(0,21,40,x) opacity tokens.
 */
export const T = {
  navy: '#001528',
  navyDeep: '#001d3d',
  yellow: '#ffde24',
  yellowActive: '#ffea73',
  white: '#ffffff',
  offWhite: '#fcfcfc',
  textPrimary: '#001528',
  textSecondary: 'rgba(0,21,40,0.7)',
  border: 'rgba(0,21,40,0.1)',
  ghostBorder: 'rgba(0,21,40,0.15)',
  success: '#007600',
  destructive: '#ad0000',
  destructiveActive: '#cc3225',
  /** @deprecated Legacy — prefer destructive; do not use in new work. */
  red: '#da0000',
  blue: '#213d8f',
  /** @deprecated Legacy — prefer success; do not use in new work. */
  green: '#1d880b',
  darkGrey: '#272728',
  scrim: 'rgba(0,21,40,0.45)',
/** Success notice fill (docs/prototype-style-guide.md → Interaction rules). */
successBg: 'rgba(0,118,0,0.08)',
  /** Radius/Extra Small — small media thumbnails (e.g. flags). Mirrors --ds-radius-xs. */
 radiusXs: '4px',
 radiusSm: '8px',
  radiusMd: '14px',
  radiusPill: '999px',
  /**
   * Domain status color (docs/prototype-style-guide.md → Domain conventions:
   * Draft=rgba(0,21,40,0.45)). Same value as scrim; kept as a separate token
   * so page files never hardcode rgba literals.
   */
  draft: 'rgba(0,21,40,0.45)',
 /**
 * Unity Green — Border/Green + Badges/success (Light UI) in
 * docs/unity-design-system.md. Used as Progress foreground-active
 * (stepper completed state). Distinct from `success` (#007600, Dark UI).
 */
 progressActive: '#47AA39',
 /**
 * Selected-card fill — black-based 3% opacity (sibling of border's 10%).
 * Used for the selected state of selectable cards (e.g. template picker).
 */
 selectionBg: 'rgba(0,21,40,0.03)',
 /** Hover raise shadow for selectable cards. */
 shadowRaise: '0 8px 20px rgba(0,21,40,0.08)',
} as const;

export type DesignTokens = typeof T;

export default T;
