import type { LinkListBlock, Story, StoryBlock, VideoAsset } from "../../types";

export interface CommitteeReportNode {
  type: "heading" | "paragraph" | "flourish" | "image" | "table";
  level?: number;
  text: string;
  block?: Extract<StoryBlock, { type: "flourish" | "image" | "table" }>;
}

export interface CommitteeReportDocument {
  slug: string;
  title: string;
  committeeName?: string;
  publishedDate?: string;
  blocks: CommitteeReportNode[];
}

type CommitteeMembersStoryBlock = Extract<StoryBlock, { type: "committee-members" }>;

export interface CommitteeReportBuilderOptions {
  document: CommitteeReportDocument;
  dek: string;
  hero: Story["hero"];
  launchVideo?: VideoAsset;
  byline?: string;
  date?: string;
  readingTime?: string;
  eyebrow?: string;
  featured?: boolean;
  heroLayout?: Story["heroLayout"];
  heroImagePosition?: string;
  showContents?: boolean;
  startHeadings?: string[];
  membershipHeading?: string;
  relatedHeading?: string;
  appendixHeadingPattern?: RegExp;
  normalizeParagraphs?: (
    heading: string | undefined,
    paragraphs: string[],
  ) => string[];
}

export interface ProseMirrorMark {
  type: "bold" | "italic" | "link" | "superscript";
  attrs?: {
    href?: string;
  };
}

export interface ProseMirrorNode {
  type:
    | "doc"
    | "heading"
    | "paragraph"
    | "text"
    | "hardBreak"
    | "orderedList"
    | "bulletList"
    | "listItem";
  attrs?: {
    level?: number;
    start?: number;
  };
  text?: string;
  marks?: ProseMirrorMark[];
  content?: ProseMirrorNode[];
}

export interface ProseMirrorDocument {
  type: "doc";
  content: ProseMirrorNode[];
}

export function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function bulletList(items: string[]) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

export function orderedList(items: string[]) {
  return `<ol>${items.map((item) => `<li>${item}</li>`).join("")}</ol>`;
}

function renderMarkedText(text: string, marks: ProseMirrorMark[] = []) {
  let output = escapeHtml(text);

  for (const mark of marks) {
    switch (mark.type) {
      case "bold":
        output = `<strong>${output}</strong>`;
        break;
      case "italic":
        output = `<em>${output}</em>`;
        break;
      case "superscript":
        output = `<sup>${output}</sup>`;
        break;
      case "link":
        if (mark.attrs?.href?.startsWith("#")) {
          break;
        }

        output = `<a href="${escapeHtml(mark.attrs?.href ?? "#")}">${output}</a>`;
        break;
    }
  }

  return output;
}

function renderInline(node: ProseMirrorNode): string {
  switch (node.type) {
    case "text":
      return renderMarkedText(node.text ?? "", node.marks);
    case "hardBreak":
      return "<br>";
    default:
      return (node.content ?? []).map(renderInline).join("");
  }
}

function renderList(node: ProseMirrorNode): string {
  const tag = node.type === "orderedList" ? "ol" : "ul";
  const items = (node.content ?? []).map((item) => {
    const body = (item.content ?? [])
      .map((child) => {
        if (child.type === "orderedList" || child.type === "bulletList") {
          return renderList(child);
        }

        return renderInline(child);
      })
      .join("");

    return `<li>${body}</li>`;
  });

  return `<${tag}>${items.join("")}</${tag}>`;
}

export function proseMirrorToCommitteeNodes(
  document: ProseMirrorDocument,
): CommitteeReportNode[] {
  const nodes: CommitteeReportNode[] = [];

  for (const node of document.content ?? []) {
    if (node.type === "heading") {
      const text = renderInline(node);
      if (!stripHtml(text)) continue;

      nodes.push({
        type: "heading",
        level: node.attrs?.level ?? 1,
        text,
      });
      continue;
    }

    if (node.type === "paragraph") {
      const text = renderInline(node);
      if (!stripHtml(text) && !text.includes("<br>")) continue;

      nodes.push({
        type: "paragraph",
        text,
      });
      continue;
    }

    if (node.type === "orderedList" || node.type === "bulletList") {
      nodes.push({
        type: "paragraph",
        text: renderList(node),
      });
    }
  }

  return nodes;
}

export function combineBulletParagraphs(paragraphs: string[]) {
  const normalized: string[] = [];
  let bulletItems: string[] = [];

  function flushBullets() {
    if (!bulletItems.length) return;
    normalized.push(bulletList(bulletItems));
    bulletItems = [];
  }

  for (const paragraph of paragraphs) {
    const text = stripHtml(paragraph);

    if (text.startsWith("• ")) {
      bulletItems.push(escapeHtml(text.slice(2).trim()));
      continue;
    }

    flushBullets();
    normalized.push(paragraph);
  }

  flushBullets();

  return normalized;
}

function formatStoryDate(value?: string) {
  if (!value) return "15 May 2026";

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;

  return new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(timestamp));
}

function estimateReadingTime(nodes: CommitteeReportNode[]) {
  const words = nodes
    .map((node) => stripHtml(node.text))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min read`;
}

function findHeadingIndex(nodes: CommitteeReportNode[], candidates: string[]) {
  const normalizedCandidates = candidates.map((candidate) => candidate.trim());

  return nodes.findIndex(
    (node) =>
      node.type === "heading" &&
      normalizedCandidates.includes(stripHtml(node.text)),
  );
}

function renderRecommendationItems(items: { body: string[]; nested: string[] }[]) {
  return `<ol>${items
    .map(({ body, nested }) => {
      const content = body.join("");
      const nestedList = nested.length ? orderedList(nested) : "";
      return `<li>${content}${nestedList}</li>`;
    })
    .join("")}</ol>`;
}

function parseCollapsedRecommendationParagraph(paragraph: string) {
  const text = stripHtml(paragraph);
  const normalized = text.replace(/^No\.?\s*Recommendation/, "");

  if (normalized === text) {
    return null;
  }

  const items: { body: string[]; nested: string[] }[] = [];
  let cursor = 0;
  let expected = 1;

  while (expected < 100) {
    const marker = String(expected);
    const atStart =
      expected === 1
        ? normalized.startsWith(marker, cursor)
        : normalized.slice(cursor, cursor + marker.length) === marker;

    if (!atStart) {
      break;
    }

    const bodyStart = cursor + marker.length;
    const nextMarker = String(expected + 1);
    const nextPattern = new RegExp(`${nextMarker}(?=[A-Z])`);
    const remainder = normalized.slice(bodyStart);
    const nextMatch = remainder.match(nextPattern);
    const nextOffset =
      nextMatch && nextMatch.index !== undefined
        ? bodyStart + nextMatch.index
        : normalized.length;

    const body = normalized.slice(bodyStart, nextOffset).trim();
    if (!body) {
      break;
    }

    items.push({ body: [escapeHtml(body)], nested: [] });

    if (nextOffset >= normalized.length) {
      break;
    }

    cursor = nextOffset;
    expected += 1;
  }

  return items.length ? items : null;
}

function structuredRecommendationList(paragraphs: string[]) {
  if (paragraphs.length === 1) {
    const collapsedItems = parseCollapsedRecommendationParagraph(paragraphs[0]);
    if (collapsedItems) {
      return [renderRecommendationItems(collapsedItems)];
    }
  }

  const intro: string[] = [];
  const items: { body: string[]; nested: string[] }[] = [];

  for (let index = 0; index < paragraphs.length; index += 1) {
    const current = paragraphs[index];
    const currentText = stripHtml(current);

    if (
      !items.length &&
      (currentText === "Number" || currentText === "Recommendation")
    ) {
      continue;
    }

    if (/^\d+$/.test(currentText)) {
      const next = paragraphs[index + 1];
      if (!next) continue;

      items.push({ body: [next], nested: [] });
      index += 1;
      continue;
    }

    if (/^\d+\.\s+/.test(currentText) && items.length) {
      items.at(-1)?.nested.push(current.replace(/^\d+\.\s+/, ""));
      continue;
    }

    if (items.length) {
      items.at(-1)?.body.push(current);
      continue;
    }

    intro.push(current);
  }

  if (!items.length) return paragraphs;

  return intro.length ? [...intro, renderRecommendationItems(items)] : [renderRecommendationItems(items)];
}

function defaultNormalizeParagraphs(
  heading: string | undefined,
  paragraphs: string[],
) {
  const normalized = combineBulletParagraphs(paragraphs);

  if (
    heading === "The Committee recommends" ||
    heading === "Key Recommendations"
  ) {
    return structuredRecommendationList(normalized);
  }

  if (heading === "Members") {
    return [
      `<ul>${normalized.map((paragraph) => `<li>${paragraph}</li>`).join("")}</ul>`,
    ];
  }

  return normalized;
}

function buildResourcesBlock(
  nodes: CommitteeReportNode[],
  relatedHeading: string,
  membershipHeading: string,
): LinkListBlock | null {
  const relatedIndex = findHeadingIndex(nodes, [relatedHeading]);
  const membershipIndex = findHeadingIndex(nodes, [membershipHeading]);

  if (relatedIndex < 0 || membershipIndex <= relatedIndex) return null;

  const resourceNodes = nodes.slice(relatedIndex + 1, membershipIndex);
  const links: LinkListBlock["links"] = [];
  let currentLabel = "";

  for (const node of resourceNodes) {
    if (node.type === "heading" && node.level === 2) {
      currentLabel = stripHtml(node.text);
      continue;
    }

    if (node.type !== "paragraph" || !currentLabel) continue;

    const hrefMatch = node.text.match(/href="([^"]+)"/i);
    if (!hrefMatch) continue;

    links.push({
      label: currentLabel,
      href: hrefMatch[1],
      description: stripHtml(node.text),
    });
    currentLabel = "";
  }

  if (!links.length) return null;

  return {
    type: "link-list",
    eyebrow: "Resources",
    heading: "Related information",
    links,
  };
}

function memberImageFromHref(href: string) {
  const decodedHref = decodeHtmlEntities(href);
  const match = decodedHref.match(/\/members\/member\/([^/]+)\/?$/i);
  if (!match?.[1]) return undefined;

  const memberId = decodeURIComponent(match[1]);
  return `https://data.oireachtas.ie/ie/oireachtas/member/id/${encodeURIComponent(memberId)}/image/large`;
}

function buildCommitteeMembersBlock(
  nodes: CommitteeReportNode[],
  membershipHeading: string,
): CommitteeMembersStoryBlock | null {
  const membershipIndex = findHeadingIndex(nodes, [membershipHeading]);
  if (membershipIndex < 0) return null;

  const membershipNodes = nodes.slice(membershipIndex + 1);
  const members: CommitteeMembersStoryBlock["members"] = [];
  let currentRole: string | undefined;

  for (const node of membershipNodes) {
    if (node.type === "heading") {
      if (node.level === 1) break;
      currentRole = stripHtml(node.text);
      continue;
    }

    if (node.type !== "paragraph") continue;

    const hrefMatch = node.text.match(/href="([^"]+)"/i);
    const href = hrefMatch?.[1] ? decodeHtmlEntities(hrefMatch[1]) : undefined;
    const name = decodeHtmlEntities(stripHtml(node.text)).split(",")[0]?.trim();

    if (!name) continue;

    members.push({
      name,
      href,
      image: href ? memberImageFromHref(href) : undefined,
      role: currentRole,
    });
  }

  if (!members.length) return null;

  return {
    type: "committee-members",
    heading: "Committee members",
    members,
  };
}

function buildReportBlocks(
  nodes: CommitteeReportNode[],
  options: Pick<
    CommitteeReportBuilderOptions,
    | "launchVideo"
    | "appendixHeadingPattern"
    | "membershipHeading"
    | "normalizeParagraphs"
    | "relatedHeading"
    | "startHeadings"
  >,
): StoryBlock[] {
  const startHeadings = options.startHeadings ?? [
    "Foreword",
    "Cathaoirleach’s Foreword",
  ];
  const membershipHeading = options.membershipHeading ?? "Committee Membership";
  const relatedHeading = options.relatedHeading ?? "Related information";
  const appendixHeadingPattern =
    options.appendixHeadingPattern ?? /^Appendix\s+\d+/i;
  const normalizeParagraphs =
    options.normalizeParagraphs ?? defaultNormalizeParagraphs;
  const launchVideo = options.launchVideo;

  const startIndex = findHeadingIndex(nodes, startHeadings);
  const membershipIndex = findHeadingIndex(nodes, [membershipHeading]);
  const relatedIndex = findHeadingIndex(nodes, [relatedHeading]);
  const appendixIndex = nodes.findIndex(
    (node) =>
      node.type === "heading" && appendixHeadingPattern.test(stripHtml(node.text)),
  );

  const mainStart = startIndex >= 0 ? startIndex : 0;
  const mainEnd =
    appendixIndex >= 0
      ? appendixIndex
      : relatedIndex >= 0
        ? relatedIndex
        : undefined;

  const mainNodes = nodes.slice(mainStart, mainEnd);
  const appendixNodes =
    appendixIndex >= 0
      ? nodes.slice(
          appendixIndex,
          relatedIndex >= 0
            ? relatedIndex
            : membershipIndex >= 0
              ? membershipIndex
              : undefined,
        )
      : [];
  const membershipNodes =
    membershipIndex >= 0
      ? nodes.slice(
          membershipIndex,
          startIndex >= 0 && membershipIndex < startIndex ? startIndex : undefined,
        )
      : [];
  const sourceNodes = [...mainNodes, ...appendixNodes];
  const committeeMembersBlock = buildCommitteeMembersBlock(
    membershipNodes,
    membershipHeading,
  );

  const blocks: StoryBlock[] = [];
  let currentHeading: string | undefined;
  let currentHeadingLevel: 2 | 3 = 2;
  let currentParagraphs: string[] = [];

  function flush() {
    if (!currentHeading && currentParagraphs.length === 0) return;

    const headingLevel =
      currentHeading && appendixHeadingPattern.test(currentHeading)
        ? 3
        : currentHeadingLevel;

    blocks.push({
      type: "text",
      heading: currentHeading,
      headingLevel: currentHeading ? headingLevel : undefined,
      paragraphs: normalizeParagraphs(currentHeading, currentParagraphs),
    });

    currentHeading = undefined;
    currentHeadingLevel = 2;
    currentParagraphs = [];
  }

  for (const node of sourceNodes) {
    if (node.type === "heading") {
      flush();
      currentHeading = stripHtml(node.text);
      currentHeadingLevel = node.level && node.level > 1 ? 3 : 2;
      continue;
    }

    if (node.type === "flourish" || node.type === "image" || node.type === "table") {
      flush();

      if (node.block) {
        blocks.push(node.block);
      }

      continue;
    }

    currentParagraphs.push(node.text);
  }

  flush();

  const resourcesBlock = buildResourcesBlock(
    nodes,
    relatedHeading,
    membershipHeading,
  );
  if (committeeMembersBlock) {
    blocks.unshift(committeeMembersBlock);
  }

  if (launchVideo) {
    blocks.unshift({
      type: "video",
      video: launchVideo,
    });
  }

  if (resourcesBlock) {
    blocks.push(resourcesBlock);
  }

  return blocks;
}

export function buildCommitteeReportStory(
  options: CommitteeReportBuilderOptions,
): Story {
  const {
    document,
    dek,
    hero,
    byline = document.committeeName ?? "Committee report",
    date = formatStoryDate(document.publishedDate),
    readingTime = estimateReadingTime(document.blocks),
    eyebrow = document.committeeName ?? "Committee Report",
    featured = false,
    heroLayout = "contained",
    heroImagePosition = "left center",
    showContents = true,
    launchVideo,
  } = options;

  return {
    slug: document.slug,
    section: "committees",
    featured,
    heroLayout,
    heroImagePosition,
    showContents,
    eyebrow,
    title: document.title,
    dek,
    byline,
    date,
    publishedDate: document.publishedDate,
    readingTime,
    hero,
    blocks: buildReportBlocks(document.blocks, {
      ...options,
      launchVideo,
    }),
  };
}
