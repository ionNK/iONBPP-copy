'use client';

import T from '@/theme/tokens';
import { Badge } from '@/components/ui';
import type { ExperimentStatus } from '@/lib/experiments/mockExperiments';

/* Domain status colours (docs/prototype-style-guide.md): Running=success,
 * Completed=darkGrey, Draft=draft token as a ghost pill. */
const STATUS: Record<ExperimentStatus, { color: string; ghost?: boolean }> = {
  Running: { color: T.success },
  Completed: { color: T.darkGrey },
  Draft: { color: T.draft, ghost: true },
};

export function ExperimentStatusBadge({ status }: { status: ExperimentStatus }) {
  return <Badge color={STATUS[status].color} ghost={STATUS[status].ghost}>{status}</Badge>;
}

export default ExperimentStatusBadge;
