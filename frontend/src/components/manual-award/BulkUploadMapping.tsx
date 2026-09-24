'use client';

import { Columns3 } from 'lucide-react';
import { CANONICAL_FIELDS, MANDATORY_FIELDS } from '@/lib/bulk-upload/columnMap';
import type { CanonicalField, ColumnMapping, MappingOverrides } from '@/lib/bulk-upload/columnMap';

export interface BulkUploadMappingProps {
  /** File header row, in original order. */
  headers: string[];
  /** Effective mapping (auto map + current overrides). */
  mapping: ColumnMapping;
  /** Mandatory fields still unmapped. */
  unmapped: CanonicalField[];
  overrides: MappingOverrides;
  onChange: (next: MappingOverrides) => void;
}

/**
 * Step 2b — Map columns. Shown only when auto-mapping leaves a mandatory
 * canonical field unresolved: one row per canonical field with a select of
 * the file's headers. Continue is gated by the stepper on `unmapped` being empty.
 */
export function BulkUploadMapping({ headers, mapping, unmapped, overrides, onChange }: BulkUploadMappingProps) {
  const setField = (field: CanonicalField, raw: string) => {
    onChange({ ...overrides, [field]: raw === '' ? null : Number(raw) });
  };
  /* Headers already assigned to another field are disabled so two fields cannot claim one column. */
  const takenBy = (index: number) => (Object.keys(mapping) as CanonicalField[]).find((f) => mapping[f] === index);

  return (
    <div className="bulk-upload__mapping" data-testid="bulk-mapping">
      <div className="bulk-upload__notice" role="status" data-testid="bulk-mapping-notice">
        <Columns3 size={16} aria-hidden="true" />
        <span>
          Some required fields could not be matched to the file&apos;s columns.
          <span className="bulk-upload__notice-sub"> Choose which column holds each field — the mapping is used for this upload only.</span>
        </span>
      </div>

      <div className="bulk-upload__table-wrap">
        <table className="bulk-upload__table">
          <thead>
            <tr>
              <th scope="col">Field</th>
              <th scope="col">Accepted headers</th>
              <th scope="col">File column</th>
            </tr>
          </thead>
          <tbody>
            {CANONICAL_FIELDS.map((f) => {
              const current = mapping[f.key];
              const missing = f.mandatory && current === undefined;
              return (
                <tr key={f.key} data-testid={`bulk-mapping-row-${f.key}`} data-mapped={current !== undefined}>
                  <td>
                    <span className="bulk-upload__cell-title">
                      {f.label}{f.mandatory && <span className="bulk-upload__required" aria-hidden="true"> *</span>}
                    </span>
                    <span className="bulk-upload__cell-sub">{f.mandatory ? 'Required' : 'Optional'}</span>
                  </td>
                  <td className="bulk-upload__cell-sub">{f.examples}</td>
                  <td>
                    <select
                      className={`bulk-upload__select${missing ? ' bulk-upload__select--invalid' : ''}`}
                      data-testid={`bulk-mapping-select-${f.key}`}
                      aria-label={`Column for ${f.label}`}
                      aria-invalid={missing || undefined}
                      value={current === undefined ? '' : String(current)}
                      onChange={(e) => setField(f.key, e.target.value)}
                    >
                      <option value="">{f.mandatory ? 'Select a column…' : 'Not in this file'}</option>
                      {headers.map((h, i) => {
                        const owner = takenBy(i);
                        return (
                          <option key={`${h}-${i}`} value={i} disabled={owner !== undefined && owner !== f.key}>
                            {h || `(column ${i + 1})`}{owner && owner !== f.key ? ` — used by ${CANONICAL_FIELDS.find((c) => c.key === owner)?.label}` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="bulk-upload__hint" data-testid="bulk-mapping-status">
        {unmapped.length === 0
          ? 'All required fields are mapped. Continue to validate the rows.'
          : `Still needed: ${unmapped.map((k) => CANONICAL_FIELDS.find((c) => c.key === k)?.label ?? k).join(', ')} (${MANDATORY_FIELDS.length} required in total).`}
      </p>
    </div>
  );
}

export default BulkUploadMapping;
