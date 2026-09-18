'use client';

import { useId, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Check, Minus } from 'lucide-react';
import T from '@/theme/tokens';
import './ui.css';

export interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: ReactNode;
    description?: string;
    disabled?: boolean;
    indeterminate?: boolean;
    id?: string;
    name?: string;
}

/**
 * Checkbox: Unity Checkbox control. A visually hidden native input keeps
 * keyboard, form and a11y semantics; the custom 18px box carries the
 * navy/white check styling previously done with browser-native styling in the wizard.
 */
export function Checkbox({ checked, onChange, label, description, disabled, indeterminate, id, name }: CheckboxProps) {
    const autoId = useId();
    const inputId = id ?? autoId;
    const descriptionId = description ? `${inputId}-description` : undefined;
    const [hovered, setHovered] = useState(false);
    const filled = checked || Boolean(indeterminate);
    return (
        <label
            className={`ui-checkbox${disabled ? ' ui-checkbox--disabled' : ''}`}
            style={{ color: T.textPrimary }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <input
                id={inputId}
                name={name}
                type="checkbox"
                className="ui-checkbox__input"
                checked={checked}
                disabled={disabled}
                aria-checked={indeterminate ? 'mixed' : checked}
                aria-describedby={descriptionId}
                ref={(el) => {
                    if (el) el.indeterminate = Boolean(indeterminate);
                }}
                onChange={(e) => onChange(e.target.checked)}
            />
            <span
                className="ui-checkbox__box"
                aria-hidden="true"
                style={
                    {
                        background: filled ? T.navy : T.white,
                        border: `1px solid ${filled || (hovered && !disabled) ? T.navy : T.ghostBorder}`,
                        borderRadius: T.radiusSm,
                        '--ui-checkbox-ring': T.focusRing,
                    } as CSSProperties
                }
            >
                {indeterminate ? (
                    <Minus size={14} color={T.white} aria-hidden="true" />
                ) : checked ? (
                    <Check size={14} color={T.white} aria-hidden="true" />
                ) : null}
            </span>
            {(label || description) && (
                <span className="ui-checkbox__text">
                    {label && <span className="ui-checkbox__label">{label}</span>}
                    {description && (
                        <span id={descriptionId} className="ui-checkbox__description" style={{ color: T.textSecondary }}>
                            {description}
                        </span>
                    )}
                </span>
            )}
        </label>
    );
}

export default Checkbox;
