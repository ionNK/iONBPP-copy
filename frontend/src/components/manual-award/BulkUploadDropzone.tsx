'use client';

import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { Download, FileText, Upload, TriangleAlert } from 'lucide-react';
import { GhostButton } from '@/components/ui';
import { blankTemplateCsv } from '@/lib/bulk-upload/validate';
import { parseCsv } from '@/lib/bulk-upload/parseCsv';

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_DATA_ROWS = 10_000;

export interface SelectedFile {
  name: string;
  size: number;
  text: string;
}

export interface BulkUploadDropzoneProps {
  file: SelectedFile | null;
  /** Called with the file text once it passes the type / size / row-count limits. */
  onFile: (file: SelectedFile) => void;
  onClear: () => void;
  /** File-level validation error from the Validate step (e.g. unmapped columns). */
  fileError?: string | null;
  /** 'info' renders the fileError as a neutral notice (recoverable via the Map columns step). */
  fileErrorTone?: 'error' | 'info';
  fileWarnings?: string[];
}

const formatSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/* Uses the same quote-aware parser as validation so embedded newlines do not inflate the 10,000-row cap. */
const countDataRows = (text: string) => parseCsv(text).rows.length;

/** Step 2 — CSV dropzone with file input, limits and a client-side blank template download. */
export function BulkUploadDropzone({ file, onFile, onClear, fileError, fileErrorTone = 'error', fileWarnings = [] }: BulkUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const accept = (f: File) => {
    setLocalError(null);
    if (!/\.csv$/i.test(f.name)) {
      setLocalError('Only .csv files are accepted.');
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setLocalError(`File is ${formatSize(f.size)}; the limit is 5 MB.`);
      return;
    }
    f.text().then((text) => {
      const rows = countDataRows(text);
      if (rows > MAX_DATA_ROWS) {
        setLocalError(`File has ${rows.toLocaleString('en-GB')} data rows; the limit is ${MAX_DATA_ROWS.toLocaleString('en-GB')}.`);
        return;
      }
      onFile({ name: f.name, size: f.size, text });
    });
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) accept(f);
  };

  const downloadTemplate = () => {
    const blob = new Blob([blankTemplateCsv()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-freebet-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const error = localError ?? fileError ?? null;

  return (
    <div className="bulk-upload__dropzone-wrap">
      <div
        className={`bulk-upload__dropzone${dragging ? ' bulk-upload__dropzone--active' : ''}${error ? ' bulk-upload__dropzone--error' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <span className="bulk-upload__dropzone-icon" aria-hidden="true">
          {file ? <FileText size={20} /> : <Upload size={20} />}
        </span>
        {file ? (
          <>
            <p className="bulk-upload__dropzone-title" data-testid="bulk-file-name">{file.name}</p>
            <p className="bulk-upload__dropzone-body">{formatSize(file.size)} · {countDataRows(file.text).toLocaleString('en-GB')} data rows</p>
          </>
        ) : (
          <>
            <p className="bulk-upload__dropzone-title">Drop your CSV here</p>
            <p className="bulk-upload__dropzone-body">.csv only · up to 5 MB · up to {MAX_DATA_ROWS.toLocaleString('en-GB')} data rows</p>
          </>
        )}
        <div className="bulk-upload__dropzone-actions">
          <GhostButton small onClick={() => inputRef.current?.click()}>{file ? 'Choose a different file' : 'Choose file'}</GhostButton>
          {file && <GhostButton small onClick={() => { setLocalError(null); onClear(); }}>Remove</GhostButton>}
        </div>
        <input
          ref={inputRef}
          className="bulk-upload__file-input"
          data-testid="bulk-file-input"
          type="file"
          accept=".csv,text/csv"
          aria-label="Upload CSV"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) accept(f);
            e.target.value = '';
          }}
        />
      </div>

      {error && (
        /* Local (type / size) errors are always destructive; a recoverable mapping gap uses the neutral notice. */
        <div
          className={`bulk-upload__notice${localError || fileErrorTone === 'error' ? ' bulk-upload__notice--error' : ''}`}
          role={localError || fileErrorTone === 'error' ? 'alert' : 'status'}
          data-testid="bulk-file-error"
          data-tone={localError ? 'error' : fileErrorTone}
        >
          <TriangleAlert size={16} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      {fileWarnings.map((w) => (
        <div key={w} className="bulk-upload__notice" data-testid="bulk-file-warning">
          <TriangleAlert size={16} aria-hidden="true" />
          <span>{w}</span>
        </div>
      ))}

      <div className="bulk-upload__template">
        <span className="bulk-upload__hint">
          Required: a customer column (profile_id or msisdn) and an amount column (amount / freebetCalculated). Optional: units, bet_id, Cash Turnover. Other headers can be mapped after upload.
        </span>
        <button type="button" className="bulk-upload__link" data-testid="bulk-template-download" onClick={downloadTemplate}>
          <Download size={14} aria-hidden="true" /> Download blank template
        </button>
      </div>
    </div>
  );
}

export default BulkUploadDropzone;
