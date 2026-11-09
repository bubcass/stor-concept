import type {
  ProseMirrorDocument,
  ProseMirrorMark,
  ProseMirrorNode,
} from './types';
import type { StoryBlock } from '../types';

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function renderMarkedText(text: string, marks: ProseMirrorMark[] = []) {
  let output = escapeHtml(text);

  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        output = `<strong>${output}</strong>`;
        break;
      case 'italic':
        output = `<em>${output}</em>`;
        break;
      case 'underline':
        output = `<u>${output}</u>`;
        break;
      case 'strike':
        output = `<s>${output}</s>`;
        break;
      case 'code':
        output = `<code>${output}</code>`;
        break;
      case 'superscript':
        output = `<sup>${output}</sup>`;
        break;
      case 'subscript':
        output = `<sub>${output}</sub>`;
        break;
      case 'link':
        if (mark.attrs?.href?.startsWith('#')) {
          break;
        }

        output = `<a href="${escapeHtml(mark.attrs?.href ?? '#')}">${output}</a>`;
        break;
    }
  }

  return output;
}

export function renderInline(node: ProseMirrorNode): string {
  switch (node.type) {
    case 'text':
      return renderMarkedText(node.text ?? '', node.marks);
    case 'hardBreak':
      return '<br>';
    default:
      return (node.content ?? []).map(renderInline).join('');
  }
}

export function renderList(node: ProseMirrorNode): string {
  const tag = node.type === 'orderedList' ? 'ol' : 'ul';
  const start =
    node.type === 'orderedList' && typeof node.attrs?.start === 'number' && node.attrs.start > 1
      ? Math.floor(node.attrs.start)
      : null;
  const items = (node.content ?? []).map((item) => {
    const body = (item.content ?? [])
      .map((child) => {
        if (child.type === 'orderedList' || child.type === 'bulletList') {
          return renderList(child);
        }

        return renderInline(child);
      })
      .join('');

    return `<li>${body}</li>`;
  });

  const attrs = tag === 'ol' && start ? ` start="${start}"` : '';

  return `<${tag}${attrs}>${items.join('')}</${tag}>`;
}

/**
 * Imported documents often carry internal footnote IDs from their source editor.
 * Those IDs are not always consistent after import, so give footnotes a stable,
 * article-local identity based on their displayed number instead.
 */
function normaliseFootnotes(blocks: StoryBlock[]): StoryBlock[] {
  const referenceNumbers = new Set<number>();
  for (const block of blocks) {
    if (block.type !== 'text') continue;
    for (const paragraph of block.paragraphs) {
      for (const match of paragraph.matchAll(/<sup>\s*(?:<a\b[^>]*>)?\[(\d+)\](?:<\/a>)?\s*<\/sup>/gi)) {
        referenceNumbers.add(Number(match[1]));
      }
    }
  }
  const hasCitationList = blocks.some(
    (block) =>
      block.type === 'text' &&
      block.paragraphs.some((paragraph) => /<ol\b[\s\S]*?(?:↑|href=["']#footnote-ref-\d+)/i.test(paragraph)),
  );

  // A small number of imported reports contain citation markers without their
  // matching reference list. Keep those markers visible, but do not emit a
  // broken fragment link that would fail static prerendering.
  if (!hasCitationList) {
    return blocks.map((block) => {
      if (block.type !== 'text') return block;
      return {
        ...block,
        paragraphs: block.paragraphs.map((paragraph) =>
          paragraph.replace(
            /<sup>\s*<a\b[^>]*href=["']#footnote-\d+["'][^>]*>([\s\S]*?)<\/a>\s*<\/sup>/gi,
            '<sup>$1</sup>',
          ),
        ),
      };
    });
  }

  let foundCitationList = false;

  return blocks.map((block) => {
    if (block.type !== 'text') return block;

    return {
      ...block,
      paragraphs: block.paragraphs.map((paragraph) => {
        const withReferences = paragraph.replace(
          /<sup>\s*(?:<a\b[^>]*>)?\[(\d+)\](?:<\/a>)?\s*<\/sup>/gi,
          (_match, number) => `<sup><a id="footnote-reference-${number}" href="#footnote-${number}" aria-label="Read footnote ${number}">[${number}]</a></sup>`,
        );

        return withReferences.replace(/<ol(\b[^>]*)?>([\s\S]*?)<\/ol>/gi, (list, attributes = '', items) => {
          if (foundCitationList || !/(?:↑|href=["']#footnote-ref-\d+)/i.test(items)) return list;
          foundCitationList = true;
          let position = 0;

          const linkedItems = items.replace(/<li(\b[^>]*)?>([\s\S]*?)<\/li>/gi, (_item: string, itemAttributes: string = '', item: string) => {
            position += 1;
            const attributesWithoutId = itemAttributes.replace(/\s+id=(['"]).*?\1/i, '');
            const backlink = referenceNumbers.has(position)
              ? `<a class="footnote-backlink" href="#footnote-reference-${position}" aria-label="Back to footnote reference ${position}">↩</a>`
              : '';
            const citation = item
              .replace(/<a\b[^>]*href=["']#footnote-ref-\d+["'][^>]*>\s*↑\s*<\/a>/gi, backlink)
              .replace(/\s*↑\s*$/u, ` ${backlink}`);
            return `<li${attributesWithoutId} id="footnote-${position}">${citation}</li>`;
          });

          return `<ol${attributes} class="footnotes">${linkedItems}</ol>`;
        });
      }),
    };
  });
}

function normaliseCommitteeFootnotes(nodes: CommitteeReportNode[]): CommitteeReportNode[] {
  const referenceNumbers = new Set<number>();
  for (const node of nodes) {
    if (node.type !== 'paragraph') continue;
    for (const match of node.text.matchAll(/<sup>\s*(?:<a\b[^>]*>)?\[(\d+)\](?:<\/a>)?\s*<\/sup>/gi)) {
      referenceNumbers.add(Number(match[1]));
    }
  }
  const hasCitationList = nodes.some(
    (node) =>
      node.type === 'paragraph' &&
      /<ol\b[\s\S]*?(?:↑|href=["']#footnote-ref-\d+)/i.test(node.text),
  );

  if (!hasCitationList) {
    return nodes.map((node) =>
      node.type === 'paragraph'
        ? {
            ...node,
            text: node.text.replace(
              /<sup>\s*<a\b[^>]*href=["']#footnote-\d+["'][^>]*>([\s\S]*?)<\/a>\s*<\/sup>/gi,
              '<sup>$1</sup>',
            ),
          }
        : node,
    );
  }

  let foundCitationList = false;
  return nodes.map((node) => {
    if (node.type !== 'paragraph') return node;

    const withReferences = node.text.replace(
      /<sup>\s*(?:<a\b[^>]*>)?\[(\d+)\](?:<\/a>)?\s*<\/sup>/gi,
      (_match, number) => `<sup><a id="footnote-reference-${number}" href="#footnote-${number}" aria-label="Read footnote ${number}">[${number}]</a></sup>`,
    );
    const text = withReferences.replace(/<ol(\b[^>]*)?>([\s\S]*?)<\/ol>/gi, (list, attributes = '', items) => {
      if (foundCitationList || !/(?:↑|href=["']#footnote-ref-\d+)/i.test(items)) return list;
      foundCitationList = true;
      let position = 0;
      const linkedItems = items.replace(/<li(\b[^>]*)?>([\s\S]*?)<\/li>/gi, (_item: string, itemAttributes: string = '', item: string) => {
        position += 1;
        const attributesWithoutId = itemAttributes.replace(/\s+id=(['"]).*?\1/i, '');
        const backlink = referenceNumbers.has(position)
          ? `<a class="footnote-backlink" href="#footnote-reference-${position}" aria-label="Back to footnote reference ${position}">↩</a>`
          : '';
        const citation = item
          .replace(/<a\b[^>]*href=["']#footnote-ref-\d+["'][^>]*>\s*↑\s*<\/a>/gi, backlink)
          .replace(/\s*↑\s*$/u, ` ${backlink}`);
        return `<li${attributesWithoutId} id="footnote-${position}">${citation}</li>`;
      });
      return `<ol${attributes} class="footnotes">${linkedItems}</ol>`;
    });

    return { ...node, text };
  });
}

function isOrderedListHtml(value: string) {
  return /^\s*<ol(?:\s[^>]*)?>/i.test(value) && /<\/ol>\s*$/i.test(value);
}

function mergeOrderedListHtml(previous: string, current: string) {
  if (!isOrderedListHtml(previous) || !isOrderedListHtml(current)) {
    return null;
  }

  const previousItems = previous
    .replace(/^\s*<ol(?:\s[^>]*)?>/i, '')
    .replace(/<\/ol>\s*$/i, '');
  const currentItems = current
    .replace(/^\s*<ol(?:\s[^>]*)?>/i, '')
    .replace(/<\/ol>\s*$/i, '');

  return `<ol>${previousItems}${currentItems}</ol>`;
}

function appendParagraphToLastListItem(listHtml: string, paragraphHtml: string) {
  if (!isOrderedListHtml(listHtml)) return null;

  return listHtml.replace(/<\/li>(?![\s\S]*<\/li>)/i, `${paragraphHtml}</li>`);
}

function endsWithSentencePunctuation(value: string) {
  return /[.!?;:]$/.test(stripHtml(value));
}

export interface CommitteeReportNode {
  type: 'heading' | 'paragraph' | 'flourish' | 'observable' | 'image' | 'table' | 'media-text';
  level?: number;
  text: string;
  block?: Extract<StoryBlock, { type: 'flourish' | 'observable' | 'image' | 'table' | 'media-text' }>;
}

function parseFlourishMarker(text: string) {
  const match = text.match(/^\[\[flourish:(.+)\]\]$/i);
  if (!match) return null;

  const dataSrc = match[1]?.trim();
  if (!dataSrc) return null;

  return {
    type: 'flourish' as const,
    embedType: 'chart' as const,
    dataSrc,
    alt: 'Flourish visualisation',
  };
}

function imageBlockFromNode(node: ProseMirrorNode) {
  const src = String(node.attrs?.src ?? '').trim();
  if (!src) return null;

  return {
    type: 'image' as const,
    image: {
      src,
      alt: String(node.attrs?.alt ?? '').trim() || 'Image',
      caption: String(node.attrs?.caption ?? '').trim() || null,
      credit: String(node.attrs?.credit ?? '').trim() || null,
    },
    layout:
      (String(node.attrs?.layout ?? '').trim() as
        | 'inline'
        | 'wide'
        | 'full'
        | 'portrait') || 'inline',
  };
}

function mediaTextBlockFromNode(
  node: ProseMirrorNode,
): Extract<StoryBlock, { type: 'media-text' }> | null {
  const src = String(node.attrs?.src ?? '').trim();
  if (!src) return null;
  const mediaSide: 'left' | 'right' =
    String(node.attrs?.mediaSide ?? '').trim() === 'left' ? 'left' : 'right';
  const mediaType = String(node.attrs?.mediaType ?? '').trim() === 'video' ? 'video' : 'image';

  const paragraphs = Array.isArray(node.attrs?.paragraphs)
    ? (node.attrs?.paragraphs as unknown[])
        .map((value) => String(value ?? '').trim())
        .filter(Boolean)
        .map((value) => escapeHtml(value))
    : [];

  return {
    type: 'media-text' as const,
    ...(String(node.attrs?.eyebrow ?? '').trim()
      ? { eyebrow: String(node.attrs?.eyebrow ?? '').trim() }
      : {}),
    ...(String(node.attrs?.heading ?? '').trim()
      ? { heading: String(node.attrs?.heading ?? '').trim() }
      : {}),
    paragraphs: paragraphs.length ? paragraphs : [''],
    media: {
      type: mediaType,
      asset:
        mediaType === 'video'
          ? {
              src,
              ...(String(node.attrs?.poster ?? '').trim()
                ? { poster: String(node.attrs?.poster ?? '').trim() }
                : {}),
              ...(String(node.attrs?.captions ?? '').trim()
                ? { captions: String(node.attrs?.captions ?? '').trim() }
                : {}),
              caption: String(node.attrs?.caption ?? '').trim() || null,
              credit: String(node.attrs?.credit ?? '').trim() || null,
            }
          : {
              src,
              alt: String(node.attrs?.alt ?? '').trim() || 'Image',
              caption: String(node.attrs?.caption ?? '').trim() || null,
              credit: String(node.attrs?.credit ?? '').trim() || null,
            },
    },
    mediaSide,
  };
}

function flourishBlockFromNode(node: ProseMirrorNode) {
  const dataSrc = String(node.attrs?.dataSrc ?? '').trim();
  if (!dataSrc) return null;

  const width = String(node.attrs?.width ?? '').trim();
  const embedType = String(node.attrs?.embedType ?? '').trim();

  return {
    type: 'flourish' as const,
    dataSrc,
    alt: String(node.attrs?.alt ?? '').trim() || 'Flourish visualisation',
    ...(String(node.attrs?.thumbnail ?? '').trim()
      ? { thumbnail: String(node.attrs?.thumbnail ?? '').trim() }
      : {}),
    ...(String(node.attrs?.caption ?? '').trim()
      ? { caption: String(node.attrs?.caption ?? '').trim() }
      : {}),
    ...(embedType === 'story' || embedType === 'visualisation' || embedType === 'chart'
      ? { embedType: embedType as 'chart' | 'story' | 'visualisation' }
      : {}),
    ...(width === 'prose' || width === 'wide'
      ? { width: width as 'prose' | 'wide' }
      : {}),
  };
}

function observableBlockFromNode(node: ProseMirrorNode) {
  const moduleUrl = String(node.attrs?.moduleUrl ?? '').trim();
  const cellName = String(node.attrs?.cellName ?? '').trim();
  if (!moduleUrl || !cellName) return null;

  const width = String(node.attrs?.width ?? '').trim();

  return {
    type: 'observable' as const,
    moduleUrl,
    cellName,
    alt: String(node.attrs?.alt ?? '').trim() || 'Observable visualisation',
    ...(String(node.attrs?.caption ?? '').trim()
      ? { caption: String(node.attrs?.caption ?? '').trim() }
      : {}),
    ...(String(node.attrs?.notebookUrl ?? '').trim()
      ? { notebookUrl: String(node.attrs?.notebookUrl ?? '').trim() }
      : {}),
    ...(String(node.attrs?.creditHref ?? '').trim()
      ? { creditHref: String(node.attrs?.creditHref ?? '').trim() }
      : {}),
    ...(String(node.attrs?.creditText ?? '').trim()
      ? { creditText: String(node.attrs?.creditText ?? '').trim() }
      : {}),
    ...(width === 'prose' || width === 'wide'
      ? { width: width as 'prose' | 'wide' }
      : {}),
  };
}

function tableBlockFromNode(node: ProseMirrorNode) {
  const html = String(node.attrs?.html ?? '').trim();
  if (!html) return null;

  return {
    type: 'table' as const,
    html,
  };
}

export function proseMirrorToCommitteeNodes(
  document: ProseMirrorDocument,
): CommitteeReportNode[] {
  const nodes: CommitteeReportNode[] = [];

  for (const node of document.content ?? []) {
    if (node.type === 'heading') {
      const text = renderInline(node);
      if (!stripHtml(text)) continue;

      nodes.push({
        type: 'heading',
        level: Number(node.attrs?.level ?? 1),
        text,
      });
      continue;
    }

    if (node.type === 'paragraph') {
      const text = renderInline(node);
      if (!stripHtml(text) && !text.includes('<br>')) continue;

      const flourish = parseFlourishMarker(stripHtml(text));
      if (flourish) {
        nodes.push({
          type: 'flourish',
          text,
          block: flourish,
        });
        continue;
      }

      const previous = nodes.at(-1);
      if (
        previous?.type === 'paragraph' &&
        isOrderedListHtml(previous.text) &&
        !endsWithSentencePunctuation(previous.text)
      ) {
        const merged = appendParagraphToLastListItem(previous.text, text);
        if (merged) {
          previous.text = merged;
          continue;
        }
      }

      nodes.push({
        type: 'paragraph',
        text,
      });
      continue;
    }

    if (node.type === 'orderedList' || node.type === 'bulletList') {
      const listHtml = renderList(node);
      const previous = nodes.at(-1);

      if (
        node.type === 'orderedList' &&
        previous?.type === 'paragraph' &&
        isOrderedListHtml(previous.text)
      ) {
        const merged = mergeOrderedListHtml(previous.text, listHtml);
        if (merged) {
          previous.text = merged;
          continue;
        }
      }

      nodes.push({
        type: 'paragraph',
        text: listHtml,
      });
      continue;
    }

    if (node.type === 'flourishBlock') {
      const block = flourishBlockFromNode(node);
      if (!block) continue;

      nodes.push({
        type: 'flourish',
        text: block.caption ?? block.alt ?? block.dataSrc,
        block,
      });
      continue;
    }

    if (node.type === 'observableBlock') {
      const block = observableBlockFromNode(node);
      if (!block) continue;

      nodes.push({
        type: 'observable',
        text: block.caption ?? block.alt ?? `${block.moduleUrl}#${block.cellName}`,
        block,
      });
      continue;
    }

    if (node.type === 'mediaTextBlock') {
      const block = mediaTextBlockFromNode(node);
      if (!block) continue;

      nodes.push({
        type: 'media-text',
        text: block.heading ?? block.paragraphs[0] ?? 'Media/text block',
        block,
      });
      continue;
    }

    if (node.type === 'imageBlock') {
      const block = imageBlockFromNode(node);
      if (!block) continue;

      nodes.push({
        type: 'image',
        text: block.image.alt,
        block,
      });
      continue;
    }

    if (node.type === 'tableBlock') {
      const block = tableBlockFromNode(node);
      if (!block) continue;

      nodes.push({
        type: 'table',
        text: 'Table',
        block,
      });
    }
  }

  return normaliseCommitteeFootnotes(nodes);
}

export function proseMirrorToNarrativeBlocks(
  document: ProseMirrorDocument,
  options: { title?: string } = {},
): StoryBlock[] {
  const blocks: StoryBlock[] = [];
  let currentHeading: string | undefined;
  let currentHeadingLevel: 2 | 3 = 2;
  let currentParagraphs: string[] = [];
  let encounteredBodyContent = false;

  const normalizedTitle = options.title
    ?.replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  function flush() {
    if (!currentHeading && currentParagraphs.length === 0) return;

    blocks.push({
      type: 'text',
      heading: currentHeading,
      headingLevel: currentHeading ? currentHeadingLevel : undefined,
      paragraphs: currentParagraphs,
    });

    currentHeading = undefined;
    currentHeadingLevel = 2;
    currentParagraphs = [];
  }

  for (const node of document.content ?? []) {
    if (node.type === 'heading') {
      const heading = stripHtml(renderInline(node));
      const level = Number(node.attrs?.level ?? 1);
      const normalizedHeading = heading.replace(/\s+/g, ' ').trim().toLowerCase();

      if (
        !encounteredBodyContent &&
        level === 1 &&
        (!normalizedTitle || normalizedHeading === normalizedTitle)
      ) {
        continue;
      }

      flush();
      currentHeading = heading;
      currentHeadingLevel = level > 2 ? 3 : 2;
      continue;
    }

    if (node.type === 'paragraph') {
      const html = renderInline(node);
      if (!stripHtml(html) && !html.includes('<br>')) continue;

      const flourish = parseFlourishMarker(stripHtml(html));
      if (flourish) {
        flush();
        blocks.push(flourish);
        encounteredBodyContent = true;
        continue;
      }

      encounteredBodyContent = true;
      currentParagraphs.push(html);
      continue;
    }

    if (node.type === 'bulletList' || node.type === 'orderedList') {
      encounteredBodyContent = true;
      currentParagraphs.push(renderList(node));
      continue;
    }

    if (node.type === 'flourishBlock') {
      const flourish = flourishBlockFromNode(node);
      if (!flourish) continue;

      flush();
      blocks.push(flourish);
      encounteredBodyContent = true;
      continue;
    }

    if (node.type === 'observableBlock') {
      const observable = observableBlockFromNode(node);
      if (!observable) continue;

      flush();
      blocks.push(observable);
      encounteredBodyContent = true;
      continue;
    }

    if (node.type === 'mediaTextBlock') {
      const mediaText = mediaTextBlockFromNode(node);
      if (!mediaText) continue;

      flush();
      blocks.push(mediaText);
      encounteredBodyContent = true;
      continue;
    }

    if (node.type === 'imageBlock') {
      const image = imageBlockFromNode(node);
      if (!image) continue;

      flush();
      blocks.push(image);
      encounteredBodyContent = true;
      continue;
    }

    if (node.type === 'tableBlock') {
      const table = tableBlockFromNode(node);
      if (!table) continue;

      flush();
      blocks.push(table);
      encounteredBodyContent = true;
    }
  }

  flush();

  return normaliseFootnotes(blocks);
}
