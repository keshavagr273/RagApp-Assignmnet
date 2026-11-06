export interface TableBlock {
  type: 'table';
  headers: string[];
  alignments: ('left' | 'center' | 'right')[];
  rows: string[][];
  rawMarkdown?: string;
}

export interface HeadingBlock {
  type: 'heading';
  level: number;
  text: string;
}

export interface ListBlock {
  type: 'list';
  ordered: boolean;
  items: string[];
}

export interface CodeBlock {
  type: 'code';
  language: string;
  content: string;
}

export interface ParagraphBlock {
  type: 'paragraph';
  text: string;
}

export type MarkdownBlock = TableBlock | HeadingBlock | ListBlock | CodeBlock | ParagraphBlock;

/**
 * Checks if a line matches markdown table separator pattern e.g. |---|:---:|---:|
 */
export function isTableSeparator(line: string): boolean {
  const t = line.trim();
  return /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(t);
}

/**
 * Splits a markdown table row into cells, handling escaped pipes \|
 */
export function splitMarkdownRow(raw: string): string[] {
  let line = raw.trim();
  if (line.startsWith('|')) line = line.slice(1);
  if (line.endsWith('|') && !line.endsWith('\\|')) line = line.slice(0, -1);

  const cells: string[] = [];
  let current = '';
  let escaped = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === '|') {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

/**
 * Parses markdown text into structured semantic blocks (tables, headings, lists, code, paragraphs)
 */
export function parseMarkdownBlocks(text: string): MarkdownBlock[] {
  if (!text) return [];
  const lines = text.split('\n');
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for markdown table: line starts with '|' and next line is a separator
    if (trimmed.startsWith('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headers = splitMarkdownRow(trimmed);
      const sepParts = splitMarkdownRow(lines[i + 1]);
      const alignments = sepParts.map((p) => {
        const t = p.trim();
        if (t.startsWith(':') && t.endsWith(':')) return 'center';
        if (t.endsWith(':')) return 'right';
        return 'left' as 'left' | 'center' | 'right';
      });

      const rows: string[][] = [];
      const tableLines: string[] = [trimmed, lines[i + 1].trim()];
      i += 2;

      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const rowLine = lines[i].trim();
        if (rowLine.length > 0) {
          tableLines.push(rowLine);
          const rawCells = splitMarkdownRow(rowLine);
          // Pad row to match headers length if needed
          while (rawCells.length < headers.length) {
            rawCells.push('');
          }
          rows.push(rawCells.slice(0, Math.max(headers.length, rawCells.length)));
        }
        i++;
      }

      blocks.push({
        type: 'table',
        headers,
        alignments,
        rows,
        rawMarkdown: tableLines.join('\n'),
      });
      continue;
    }

    // Code block ```
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      blocks.push({
        type: 'code',
        language: lang,
        content: codeLines.join('\n'),
      });
      continue;
    }

    // Heading (# to ######)
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // Unordered or Ordered List item
    const listMatch = trimmed.match(/^([-*+]|\d+\.)\s+(.*)$/);
    if (listMatch) {
      const items: string[] = [];
      const isOrdered = /^\d+\./.test(listMatch[1]);
      while (i < lines.length) {
        const itemMatch = lines[i].trim().match(/^([-*+]|\d+\.)\s+(.*)$/);
        if (!itemMatch) break;
        items.push(itemMatch[2].trim());
        i++;
      }
      blocks.push({
        type: 'list',
        ordered: isOrdered,
        items,
      });
      continue;
    }

    // Empty line
    if (!trimmed) {
      i++;
      continue;
    }

    // Paragraph (collect consecutive non-empty, non-special lines)
    const pLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('|') &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !/^([-*+]|\d+\.)\s+/.test(lines[i].trim())
    ) {
      pLines.push(lines[i]);
      i++;
    }

    if (pLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        text: pLines.join(' '),
      });
    }
  }

  return blocks;
}

