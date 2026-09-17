import T from '@/theme/tokens';
import './ui.css';

export interface ZambiaFlagProps {
 /** Rendered width in px: 20 in page top bars, 16 in table rows. */
 size?: number;
}

/**
 * Zambia market flag (public/assets/flags/zm.svg). Replaces the old navy
 * "Zambia" text Badge wherever market context is shown.
 */
export function ZambiaFlag({ size = 20 }: ZambiaFlagProps) {
 return (
 // eslint-disable-next-line @next/next/no-img-element -- static public asset, no optimization needed at this size
 <img
 src="/assets/flags/zm.svg"
 alt="Zambia"
 className="ui-flag"
 style={{ width: size, borderRadius: T.radiusXs, border: `1px solid ${T.border}` }}
 />
 );
}

export default ZambiaFlag;
