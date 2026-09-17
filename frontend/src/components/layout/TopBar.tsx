'use client';

import { ChevronDown } from 'lucide-react';
import { ZambiaFlag } from '@/components/ui';

/**
 * Global top bar: Internal Tool Shell (docs/prototype-style-guide.md).
 * White, full width, 1px bottom border (T.border). Left: "ionix Boost"
 * wordmark (navy 15px/700, "Boost" in T.yellow) + divider + Zambia flag
 * (20px, radiusXs, 1px border, accessible name "Zambia"). Right: avatar
 * initials + role + chevron-down (menu stub, non-functional). User identity
 * lives here exclusively, and the sidebar carries no brand or user block.
 * Styling lives in the .ds-topbar section of app/design-system.css.
 */
export default function TopBar() {
return (
<header className="ds-topbar">
<div className="ds-topbar__left">
<span className="ds-topbar__wordmark">
ionix <span className="ds-topbar__wordmark-accent">Boost</span>
</span>
<span className="ds-topbar__divider" aria-hidden="true" />
<ZambiaFlag size={20} />
</div>
<button
type="button"
className="ds-topbar__user"
aria-haspopup="menu"
aria-expanded={false}
aria-label="Account menu: Super Admin (coming soon)"
onClick={() => {}}
>
<span className="ds-topbar__avatar" aria-hidden="true">
NS
</span>
<span className="ds-topbar__role">Super Admin</span>
<span className="ds-topbar__chevron">
<ChevronDown size={16} />
</span>
</button>
</header>
);
}
