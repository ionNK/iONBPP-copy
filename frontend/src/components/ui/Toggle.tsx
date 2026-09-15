'use client';

import T from '@/theme/tokens';
import './ui.css';

export interface ToggleProps {
checked: boolean;
onChange?: (checked: boolean) => void;
/** Locked state (e.g. mandatory business rules) — renders dimmed, non-interactive. */
disabled?: boolean;
ariaLabel: string;
}

/** Toggle switch — Unity Switch control (navy track when on). */
export function Toggle({ checked, onChange, disabled, ariaLabel }: ToggleProps) {
return (
<button
type="button"
role="switch"
aria-checked={checked}
aria-label={ariaLabel}
disabled={disabled}
onClick={() => onChange?.(!checked)}
className="ui-toggle"
style={{ background: checked ? T.navy : T.ghostBorder, borderRadius: T.radiusPill }}
>
<span
className={`ui-toggle__knob${checked ? ' ui-toggle__knob--on' : ''}`}
style={{ background: T.white, borderRadius: T.radiusPill }}
/>
</button>
);
}

export default Toggle;
