import type {
  ProseMirrorDocument,
  ProseMirrorMark,
  ProseMirrorNode,
  StorDocument,
} from './types';

function esc(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function safeTagName(tagName: string) {
  return tagName.toLowerCase();
}

function inlineText(text: string, marks: ProseMirrorMark[] = []) {
  let output = esc(text);

  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        output = `<b>${output}</b>`;
        break;
      case 'italic':
        output = `<i>${output}</i>`;
        break;
      case 'underline':
        output = `<u>${output}</u>`;
        break;
      case 'strike':
        output = `<strike>${output}</strike>`;
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
        if (mark.attrs?.href) {
          output = `<a href="${esc(mark.attrs.href)}">${output}</a>`;
        }
        break;
    }
  }

  return output;
}

function serializeInline(node: ProseMirrorNode): string {
  switch (node.type) {
    case 'text':
      return inlineText(node.text ?? '', node.marks);
    case 'hardBreak':
      return '<br/>';
    default:
      return (node.content ?? []).map(serializeInline).join('');
  }
}

function serializeListNode(node: ProseMirrorNode): string {
  const tag = node.type === 'orderedList' ? 'list' : 'list';
  const typeAttr = node.type === 'orderedList' ? 'ordered' : 'bullet';
  const items = (node.content ?? [])
    .map((item) => {
      const body = (item.content ?? [])
        .map((child) => {
          if (child.type === 'paragraph') {
            return `<p>${serializeInline(child)}</p>`;
          }
          if (child.type === 'orderedList' || child.type === 'bulletList') {
            return serializeListNode(child);
          }
          return serializeInline(child);
        })
        .join('');
      return `<item>${body}</item>`;
    })
    .join('');

  return `<${tag} type="${typeAttr}">${items}</${tag}>`;
}

function serializeHtmlChildren(node: Node, document: Document): string {
  if (node.nodeType === document.TEXT_NODE) {
    return esc(node.textContent ?? '');
  }

  if (node.nodeType !== document.ELEMENT_NODE) {
    return '';
  }

  const element = node as HTMLElement;
  const tag = safeTagName(element.tagName);
  const children = Array.from(element.childNodes)
    .map((child) => serializeHtmlChildren(child, document))
    .join('');

  if (tag === 'br') return '<br/>';

  if (tag === 'a') {
    const href = element.getAttribute('href') ?? '';
    return `<a href="${esc(href)}">${children}</a>`;
  }

  if (tag === 'strong' || tag === 'b') return `<b>${children}</b>`;
  if (tag === 'em' || tag === 'i') return `<i>${children}</i>`;
  if (tag === 'u') return `<u>${children}</u>`;
  if (tag === 'sup') return `<sup>${children}</sup>`;
  if (tag === 'sub') return `<sub>${children}</sub>`;
  if (tag === 'code') return `<code>${children}</code>`;
  if (tag === 'p') return `<p>${children}</p>`;
  if (tag === 'ul') return `<list type="bullet">${children}</list>`;
  if (tag === 'ol') return `<list type="ordered">${children}</list>`;
  if (tag === 'li') return `<item>${children}</item>`;

  return children;
}

function serializeTableHtml(html: string) {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const table = document.querySelector('table');
  if (!table) return '';

  const theadRows = Array.from(table.querySelectorAll('thead > tr')).map((row) => {
    const cells = Array.from(row.children)
      .map((cell) => {
        const attrs = [`header="true"`];
        const colspan = cell.getAttribute('colspan');
        const rowspan = cell.getAttribute('rowspan');
        const scope = cell.getAttribute('scope');
        if (colspan) attrs.push(`colspan="${esc(colspan)}"`);
        if (rowspan) attrs.push(`rowspan="${esc(rowspan)}"`);
        if (scope) attrs.push(`scope="${esc(scope)}"`);
        const content = Array.from(cell.childNodes)
          .map((child) => serializeHtmlChildren(child, document))
          .join('');
        return `<cell ${attrs.join(' ')}>${content}</cell>`;
      })
      .join('');
    return `<row>${cells}</row>`;
  });

  const bodySource =
    table.querySelectorAll('tbody > tr').length > 0
      ? Array.from(table.querySelectorAll('tbody > tr'))
      : Array.from(table.querySelectorAll(':scope > tr'));

  const tbodyRows = bodySource.map((row) => {
    const cells = Array.from(row.children)
      .map((cell) => {
        const attrs: string[] = [];
        const colspan = cell.getAttribute('colspan');
        const rowspan = cell.getAttribute('rowspan');
        const scope = cell.getAttribute('scope');
        if (colspan) attrs.push(`colspan="${esc(colspan)}"`);
        if (rowspan) attrs.push(`rowspan="${esc(rowspan)}"`);
        if (scope) attrs.push(`scope="${esc(scope)}"`);
        const content = Array.from(cell.childNodes)
          .map((child) => serializeHtmlChildren(child, document))
          .join('');
        return `<cell${attrs.length ? ` ${attrs.join(' ')}` : ''}>${content}</cell>`;
      })
      .join('');
    return `<row>${cells}</row>`;
  });

  return `<table>${theadRows.length ? `<thead>${theadRows.join('')}</thead>` : ''}<tbody>${tbodyRows.join('')}</tbody></table>`;
}

function serializeBodyNode(node: ProseMirrorNode): string {
  switch (node.type) {
    case 'heading':
      return `<heading level="${esc(node.attrs?.level ?? 1)}">${serializeInline(node)}</heading>`;
    case 'paragraph':
      return `<p>${serializeInline(node)}</p>`;
    case 'blockquote':
      return `<blockquote>${(node.content ?? [])
        .map((child) => {
          if (child.type === 'paragraph') return `<p>${serializeInline(child)}</p>`;
          return serializeInline(child);
        })
        .join('')}</blockquote>`;
    case 'bulletList':
    case 'orderedList':
      return serializeListNode(node);
    case 'imageBlock':
      return `<image src="${esc(String(node.attrs?.src ?? ''))}" alt="${esc(
        String(node.attrs?.alt ?? ''),
      )}" layout="${esc(String(node.attrs?.layout ?? 'inline'))}">${
        node.attrs?.caption ? `<caption>${esc(String(node.attrs.caption))}</caption>` : ''
      }${node.attrs?.credit ? `<credit>${esc(String(node.attrs.credit))}</credit>` : ''}</image>`;
    case 'flourishBlock':
      return `<flourish dataSrc="${esc(String(node.attrs?.dataSrc ?? ''))}" embedType="${esc(
        String(node.attrs?.embedType ?? 'chart'),
      )}" width="${esc(String(node.attrs?.width ?? 'wide'))}" alt="${esc(
        String(node.attrs?.alt ?? ''),
      )}">${
        node.attrs?.caption ? `<caption>${esc(String(node.attrs.caption))}</caption>` : ''
      }</flourish>`;
    case 'tableBlock':
      return serializeTableHtml(String(node.attrs?.html ?? ''));
    case 'codeBlock':
      return `<codeblock>${esc((node.text ?? '') || '')}</codeblock>`;
    default:
      return '';
  }
}

function serializeKeywords(keywords: string[] | undefined) {
  if (!keywords?.length) return '';
  return `<keywords>${keywords
    .map((keyword) => `<keyword>${esc(keyword)}</keyword>`)
    .join('')}</keywords>`;
}

function serializeContributors(document: StorDocument) {
  if (!document.contributors?.length) return '';

  return `<contributors>${document.contributors
    .map((contributor) => {
      const attrs = [`role="${esc(contributor.role)}"`];
      if (typeof contributor.showAsAuthor === 'boolean') {
        attrs.push(`showAsAuthor="${contributor.showAsAuthor ? 'true' : 'false'}"`);
      }

      return `<contributor ${attrs.join(' ')}><name>${esc(contributor.name)}</name>${
        contributor.affiliation
          ? `<affiliation>${esc(contributor.affiliation)}</affiliation>`
          : ''
      }${contributor.profileRole ? `<profileRole>${esc(contributor.profileRole)}</profileRole>` : ''}${
        contributor.profileImage ? `<profileImage>${esc(contributor.profileImage)}</profileImage>` : ''
      }${contributor.bio ? `<bio>${esc(contributor.bio)}</bio>` : ''
      }</contributor>`;
    })
    .join('')}</contributors>`;
}

function serializeTopics(topics: string[] | undefined) {
  if (!topics?.length) return '';
  return `<topics>${topics.map((topic) => `<topic>${esc(topic)}</topic>`).join('')}</topics>`;
}

function serializeResearcher(document: StorDocument) {
  if (!document.researcher) return '';
  const researcher = document.researcher;

  return `<researcher>${researcher.name ? `<name>${esc(researcher.name)}</name>` : ''}<role>${esc(
    researcher.role,
  )}</role>${
    researcher.organisation
      ? `<organisation>${esc(researcher.organisation)}</organisation>`
      : ''
  }${researcher.bio ? `<bio>${esc(researcher.bio)}</bio>` : ''}${
    researcher.image ? `<image>${esc(researcher.image)}</image>` : ''
  }</researcher>`;
}

function serializeHero(document: StorDocument) {
  if (!document.hero) return '';
  return `<hero src="${esc(document.hero.src)}" alt="${esc(document.hero.alt)}">${
    document.hero.caption ? `<caption>${esc(document.hero.caption)}</caption>` : ''
  }${document.hero.credit ? `<credit>${esc(document.hero.credit)}</credit>` : ''}${
    document.hero.position ? `<position>${esc(document.hero.position)}</position>` : ''
  }</hero>`;
}

export function storDocumentToXml(document: StorDocument) {
  const pmDocument: ProseMirrorDocument = document.content;
  const body = (pmDocument.content ?? []).map(serializeBodyNode).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<storDocument version="${esc(document.version ?? '0.1')}" xml:lang="${esc(
    document.language ?? 'en',
  )}">
  <metadata>
    <id>${esc(document.id)}</id>
    <slug>${esc(document.slug)}</slug>
    <destination>${esc(document.destination)}</destination>
    <type>${esc(document.type)}</type>
    <title>${esc(document.title)}</title>
    <dek>${esc(document.dek)}</dek>
    ${document.eyebrow ? `<eyebrow>${esc(document.eyebrow)}</eyebrow>` : ''}
    ${document.byline ? `<byline>${esc(document.byline)}</byline>` : ''}
    ${document.abstract ? `<abstract>${esc(document.abstract)}</abstract>` : ''}
    ${document.committeeName ? `<committeeName>${esc(document.committeeName)}</committeeName>` : ''}
    ${document.status ? `<status>${esc(document.status)}</status>` : ''}
    ${document.publishedDate ? `<publishedDate>${esc(document.publishedDate)}</publishedDate>` : ''}
    ${document.license ? `<license>${esc(document.license)}</license>` : ''}
    ${document.doi ? `<doi>${esc(document.doi)}</doi>` : ''}
    ${document.publisher ? `<publisher>${esc(document.publisher)}</publisher>` : ''}
    ${serializeKeywords(document.keywords)}
    ${serializeTopics(document.topics)}
    ${serializeContributors(document)}
    ${serializeResearcher(document)}
    ${serializeHero(document)}
  </metadata>
  <body>${body}</body>
</storDocument>`;
}
