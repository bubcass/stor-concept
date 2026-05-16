import { mergeAttributes, Node } from '@tiptap/core';

export const ImageBlock = Node.create({
  name: 'imageBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-src') || '',
        renderHTML: (attributes) => ({ 'data-src': attributes.src || '' }),
      },
      alt: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-alt') || '',
        renderHTML: (attributes) => ({ 'data-alt': attributes.alt || '' }),
      },
      caption: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-caption') || '',
        renderHTML: (attributes) => ({
          'data-caption': attributes.caption || '',
        }),
      },
      credit: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-credit') || '',
        renderHTML: (attributes) => ({ 'data-credit': attributes.credit || '' }),
      },
      layout: {
        default: 'inline',
        parseHTML: (element) => element.getAttribute('data-layout') || 'inline',
        renderHTML: (attributes) => ({
          'data-layout': attributes.layout || 'inline',
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'stor-image' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'stor-image',
      mergeAttributes(HTMLAttributes, {
        class: `stor-embedded-block stor-embedded-block--image stor-embedded-block--${
          node.attrs.layout || 'inline'
        }`,
      }),
      ['div', { class: 'stor-embedded-block__eyebrow' }, 'Image'],
      ['p', { class: 'stor-embedded-block__text' }, node.attrs.alt || 'Image'],
      [
        'p',
        { class: 'stor-embedded-block__meta' },
        node.attrs.src || 'No image path selected',
      ],
      ...(node.attrs.caption
        ? [['p', { class: 'stor-embedded-block__meta' }, node.attrs.caption]]
        : []),
    ];
  },
});

export const FlourishBlock = Node.create({
  name: 'flourishBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      dataSrc: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-src') || '',
        renderHTML: (attributes) => ({ 'data-src': attributes.dataSrc || '' }),
      },
      alt: {
        default: 'Flourish visualisation',
        parseHTML: (element) =>
          element.getAttribute('data-alt') || 'Flourish visualisation',
        renderHTML: (attributes) => ({ 'data-alt': attributes.alt || '' }),
      },
      caption: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-caption') || '',
        renderHTML: (attributes) => ({
          'data-caption': attributes.caption || '',
        }),
      },
      embedType: {
        default: 'chart',
        parseHTML: (element) => element.getAttribute('data-embed-type') || 'chart',
        renderHTML: (attributes) => ({
          'data-embed-type': attributes.embedType || 'chart',
        }),
      },
      width: {
        default: 'wide',
        parseHTML: (element) => element.getAttribute('data-width') || 'wide',
        renderHTML: (attributes) => ({ 'data-width': attributes.width || 'wide' }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'stor-flourish' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'stor-flourish',
      mergeAttributes(HTMLAttributes, {
        class: 'stor-embedded-block stor-embedded-block--flourish',
      }),
      ['div', { class: 'stor-embedded-block__eyebrow' }, 'Flourish'],
      [
        'p',
        { class: 'stor-embedded-block__text' },
        node.attrs.caption || node.attrs.alt || 'Flourish visualisation',
      ],
      [
        'p',
        { class: 'stor-embedded-block__meta' },
        node.attrs.dataSrc || 'No Flourish source selected',
      ],
    ];
  },
});

function decodeHtmlAttribute(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function summarizeTable(html: string) {
  const rowCount = (html.match(/<tr\b/gi) || []).length;
  const headerCount = (html.match(/<th\b/gi) || []).length;
  const cellCount = (html.match(/<td\b/gi) || []).length + headerCount;
  return { rowCount, cellCount };
}

export const TableBlock = Node.create({
  name: 'tableBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      html: {
        default: '',
        parseHTML: (element) =>
          decodeHtmlAttribute(element.getAttribute('data-html') || ''),
        renderHTML: (attributes) => ({
          'data-html': encodeURIComponent(attributes.html || ''),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'stor-table' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const summary = summarizeTable(String(node.attrs.html || ''));

    return [
      'stor-table',
      mergeAttributes(HTMLAttributes, {
        class: 'stor-embedded-block stor-embedded-block--table',
      }),
      ['div', { class: 'stor-embedded-block__eyebrow' }, 'Table'],
      [
        'p',
        { class: 'stor-embedded-block__text' },
        `${summary.rowCount} rows, ${summary.cellCount} cells`,
      ],
      ['p', { class: 'stor-embedded-block__meta' }, 'Imported from DOCX table markup'],
    ];
  },
});

export interface StructuredBlockSelection {
  type: 'imageBlock' | 'flourishBlock' | 'tableBlock';
  attrs: Record<string, unknown>;
  from: number;
  to: number;
}

export function getSelectedStructuredBlock(editor: {
  state: {
    selection: {
      from: number;
      to: number;
      node?: { type: { name: string }; attrs?: Record<string, unknown> } | null;
      $from: {
        nodeAfter?: {
          type: { name: string };
          attrs?: Record<string, unknown>;
          nodeSize: number;
        } | null;
      };
    };
  };
}) {
  const { selection } = editor.state;
  const selectedNode = selection.node;

  if (
    selectedNode &&
    (selectedNode.type.name === 'imageBlock' ||
      selectedNode.type.name === 'flourishBlock' ||
      selectedNode.type.name === 'tableBlock')
  ) {
    return {
      type: selectedNode.type.name,
      attrs: selectedNode.attrs || {},
      from: selection.from,
      to: selection.to,
    } as StructuredBlockSelection;
  }

  const nodeAfter = selection.$from.nodeAfter;
  if (
    nodeAfter &&
    (nodeAfter.type.name === 'imageBlock' ||
      nodeAfter.type.name === 'flourishBlock' ||
      nodeAfter.type.name === 'tableBlock')
  ) {
    return {
      type: nodeAfter.type.name,
      attrs: nodeAfter.attrs || {},
      from: selection.from,
      to: selection.from + nodeAfter.nodeSize,
    } as StructuredBlockSelection;
  }

  return null;
}
