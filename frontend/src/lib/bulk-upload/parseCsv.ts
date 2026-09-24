/**
 * Bulk FreeBet Upload (PROTOTYPE) — hand-rolled CSV parser.
 *
 * Handles a UTF-8 BOM, CRLF / LF / lone-CR line endings and RFC 4180 quoted
 * fields (embedded commas, newlines and doubled-quote escapes). Fully blank
 * lines (e.g. a trailing newline) are dropped. No dependencies, no network.
 */

export interface ParsedCsv {
  /** Header cells as written in the file (trimmed, BOM removed). */
  headers: string[];
  /** Data rows (header excluded), each cell trimmed. */
  rows: string[][];
}

/**
 * Normalise a header cell for matching: lowercase with spaces and
 * underscores removed, e.g. "Cash Turnover" → "cashturnover",
 * "short_bet_id" → "shortbetid".
 */
export function normaliseHeader(raw: string): string {
  return raw.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[\s_]+/g, '');
}

export function parseCsv(input: string): ParsedCsv {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const records: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let i = 0;
  const n = text.length;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRecord = () => {
    endField();
    records.push(row);
    row = [];
  };

  while (i < n) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      quoted = true;
      i += 1;
      continue;
    }
    if (ch === ',') {
      endField();
      i += 1;
      continue;
    }
    if (ch === '\r') {
      /* CRLF → one line break; a lone CR is treated as a line break too. */
      if (text[i + 1] === '\n') i += 1;
      endRecord();
      i += 1;
      continue;
    }
    if (ch === '\n') {
      endRecord();
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field.length > 0 || row.length > 0) endRecord();

  const nonBlank = records.filter((cells) => cells.some((cell) => cell.trim() !== ''));
  if (nonBlank.length === 0) return { headers: [], rows: [] };

  const [headerRow, ...rest] = nonBlank;
  return {
    headers: headerRow.map((cell) => cell.trim()),
    rows: rest.map((cells) => cells.map((cell) => cell.trim())),
  };
}

/** Quote a cell for CSV output when it contains a comma, quote or newline. */
export function escapeCsvCell(cell: string): string {
  return /[",\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

/** Serialise rows to CSV text (CRLF line endings, no BOM). */
export function toCsv(rows: string[][]): string {
  return rows.map((cells) => cells.map(escapeCsvCell).join(',')).join('\r\n');
}
