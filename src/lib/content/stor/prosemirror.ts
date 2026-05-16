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

  return `<${tag}>${items.join('')}</${tag}>`;
}

export interface CommitteeReportNode {
  type: 'heading' | 'paragraph' | 'flourish' | 'image' | 'table';
  level?: number;
  text: string;
  block?: Extract<StoryBlock, { type: 'flourish' | 'image' | 'table' }>;
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

function flourishBlockFromNode(node: ProseMirrorNode) {
  const dataSrc = String(node.attrs?.dataSrc ?? '').trim();
  if (!dataSrc) return null;

  const width = String(node.attrs?.width ?? '').trim();
  const embedType = String(node.attrs?.embedType ?? '').trim();

  return {
    type: 'flourish' as const,
    dataSrc,
    alt: String(node.attrs?.alt ?? '').trim() || 'Flourish visualisation',
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

      nodes.push({
        type: 'paragraph',
        text,
      });
      continue;
    }

    if (node.type === 'orderedList' || node.type === 'bulletList') {
      nodes.push({
        type: 'paragraph',
        text: renderList(node),
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

  return nodes;
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

  return blocks;
}
