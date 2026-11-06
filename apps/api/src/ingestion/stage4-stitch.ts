import { ProcessedVisionPage, PageElement } from './stage3-vision.js';
import { logger } from '../lib/logger.js';

export interface HeadingItem {
  level: number;
  text: string;
}

export interface StitchedElement {
  element: PageElement;
  page: number;
  endPage?: number;
  headingPath: HeadingItem[];
  imageRef: string;
}

export interface StitchedDocument {
  documentId: string;
  elements: StitchedElement[];
}

export function stage4CrossPageStitch(
  documentId: string,
  pages: ProcessedVisionPage[]
): StitchedDocument {
  logger.info({ documentId, pagesCount: pages.length }, 'Stage 4: Cross-page stitching and hierarchy resolution');

  // Sort pages by pageNumber
  const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
  const stitchedElements: StitchedElement[] = [];

  const headingStack: HeadingItem[] = [];

  for (let pageIdx = 0; pageIdx < sortedPages.length; pageIdx++) {
    const page = sortedPages[pageIdx];
    const elements = page.elements;

    for (let elIdx = 0; elIdx < elements.length; elIdx++) {
      const el = elements[elIdx];

      // Update heading hierarchy
      if (el.type === 'heading') {
        while (
          headingStack.length > 0 &&
          headingStack[headingStack.length - 1].level >= el.level
        ) {
          headingStack.pop();
        }
        headingStack.push({ level: el.level, text: el.text });
      }

      // Check for table continuation from previous stitched element
      if (el.type === 'table' && stitchedElements.length > 0) {
        const lastStitched = stitchedElements[stitchedElements.length - 1];
        if (
          lastStitched.element.type === 'table' &&
          (lastStitched.endPage || lastStitched.page) === page.pageNumber - 1
        ) {
          const prevTable = lastStitched.element;
          const currTable = el;

          const sameHeaders =
            JSON.stringify(prevTable.headers) === JSON.stringify(currTable.headers);
          const isContinuedMarker =
            (currTable.caption && /continued/i.test(currTable.caption)) ||
            (prevTable.headers[0] && currTable.rows[0] && prevTable.headers[0].length === currTable.rows[0].length);

          if (sameHeaders || isContinuedMarker) {
            logger.info(
              { fromPage: lastStitched.page, toPage: page.pageNumber },
              'Stitching continuing table across pages'
            );
            // Append rows
            prevTable.rows.push(...currTable.rows);

            // Update markdown
            const headerRow = prevTable.headers[0] || [];
            const headerMd = `| ${headerRow.join(' | ')} |\n| ${headerRow.map(() => '---').join(' | ')} |`;
            const rowsMd = prevTable.rows.map((r) => `| ${r.join(' | ')} |`).join('\n');
            prevTable.markdown = `${headerMd}\n${rowsMd}`;

            lastStitched.endPage = page.pageNumber;
            continue; // Skip adding redundant duplicate table
          }
        }
      }

      stitchedElements.push({
        element: el,
        page: page.pageNumber,
        headingPath: [...headingStack],
        imageRef: page.imageRef,
      });
    }
  }

  logger.info({ documentId, totalStitchedElements: stitchedElements.length }, 'Stage 4 complete: Elements stitched');
  return {
    documentId,
    elements: stitchedElements,
  };
}

