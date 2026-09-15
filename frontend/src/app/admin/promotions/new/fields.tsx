/**
 * Shared page-level form helpers for the New Promotion wizard (steps 1–7).
 * Composition only — primitives come from @/components/ui; colors from T.
 */
import type { CSSProperties, ReactNode } from 'react';
import T from '@/theme/tokens';

export function Field({
 label,
 required,
 error,
 hint,
 full,
 children,
}: {
 label: string;
 required?: boolean;
 error?: string;
 hint?: string;
 full?: boolean;
 children: ReactNode;
}) {
 return (
 <div className={`np-field${full ? ' np-field--full' : ''}`}>
 <label className="np-label" style={{ color: T.textPrimary }}>
 {label} {required && <span style={{ color: T.destructive }}>*</span>}
 </label>
 {children}
 {hint && !error && (
 <p className="np-hint" style={{ color: T.textSecondary }}>{hint}</p>
 )}
 {error && (
 <p className="np-error" role="alert" style={{ color: T.destructive }}>{error}</p>
 )}
 </div>
 );
}

export const inputStyle = (error?: string): CSSProperties => ({
 border: `1px solid ${error ? T.destructive : T.ghostBorder}`,
 borderRadius: T.radiusSm,
 color: T.textPrimary,
 background: T.white,
});


/** Number input with a ZMW suffix — shared money control for the wizard. */
export function MoneyInput({ value, onChange, error, placeholder, ariaLabel }: {
value: string; onChange: (value: string) => void; error?: string; placeholder?: string; ariaLabel: string;
}) {
return <div className="np-input-wrap">
<input type="number" min="0" step="0.01" className="np-input" style={inputStyle(error)} value={value} placeholder={placeholder} aria-label={ariaLabel} onChange={(e) => onChange(e.target.value)} />
<span className="np-input-suffix" style={{ color: T.textSecondary }}>ZMW</span>
</div>;
}

