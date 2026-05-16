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
  type: 'heading' | 'paragraph' | 'flourish';
  level?: number;
  text: string;
  block?: Extract<StoryBlock, { type: 'flourish' }>;
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
  }

  flush();

  return blocks;
}
