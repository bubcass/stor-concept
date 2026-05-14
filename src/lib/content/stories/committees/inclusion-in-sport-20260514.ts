import type { LinkListBlock, Story, StoryBlock, TextBlock } from "../../types";
import reportDocument from "./inclusion-in-sport-20260514.json";

type ReportNode = (typeof reportDocument.blocks)[number];

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function bulletList(items: string[]) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function orderedList(items: string[]) {
  return `<ol>${items.map((item) => `<li>${item}</li>`).join("")}</ol>`;
}

function combineBulletParagraphs(paragraphs: string[]) {
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

function recommendationList(paragraphs: string[]) {
  const items: string[] = [];

  for (let index = 0; index < paragraphs.length; index += 1) {
    const current = stripHtml(paragraphs[index]);
    const next = paragraphs[index + 1] ? stripHtml(paragraphs[index + 1]) : "";

    if (/^\d+$/.test(current) && next) {
      items.push(escapeHtml(next));
      index += 1;
    }
  }

  if (!items.length) return paragraphs;

  const intro = paragraphs.find((paragraph) =>
    stripHtml(paragraph).startsWith("In its report, the Committee outlines"),
  );

  return [intro ?? paragraphs[0], orderedList(items)];
}

function simpleListAfterHeading(paragraphs: string[], label: string) {
  const filtered = paragraphs.filter(
    (paragraph) => stripHtml(paragraph) !== label,
  );
  if (!filtered.length) return paragraphs;

  return [
    `<ul>${filtered.map((paragraph) => `<li>${paragraph}</li>`).join("")}</ul>`,
  ];
}

function oralHearingsList(paragraphs: string[]) {
  const items: string[] = [];

  for (let index = 0; index < paragraphs.length; index += 2) {
    const date = paragraphs[index] ? stripHtml(paragraphs[index]) : "";
    const transcript = paragraphs[index + 1];

    if (!date || date === "Date" || date === "Transcript" || !transcript)
      continue;

    items.push(`<strong>${escapeHtml(date)}</strong>: ${transcript}`);
  }

  return items.length ? [bulletList(items)] : paragraphs;
}

function executiveSummaryTopics(paragraphs: string[]) {
  return paragraphs.map((paragraph) => {
    const text = stripHtml(paragraph);

    if (!text.startsWith("3. The Committee identified")) return paragraph;

    return (
      "3. The Committee identified a number of key issues in this domain, which are examined in depth in this report:" +
      bulletList([
        "Sport and women",
        "Sport and disability",
        "Sport and LGBTQIA+ communities",
        "Sport and ethnic minority",
        "Grassroots sport and socioeconomic diversity",
        "Sport and older people",
        "Intersectionality in sport",
      ])
    );
  });
}

function normalizeParagraphs(
  heading: string | undefined,
  paragraphs: string[],
) {
  let normalized = [...paragraphs];

  normalized = executiveSummaryTopics(normalized);
  normalized = combineBulletParagraphs(normalized);

  if (heading === "Key Recommendations") {
    return recommendationList(normalized);
  }

  if (heading === "Members") {
    return [
      `<ul>${normalized.map((paragraph) => `<li>${paragraph}</li>`).join("")}</ul>`,
    ];
  }

  if (heading === "List of written submissions") {
    return simpleListAfterHeading(normalized, "Stakeholder");
  }

  if (heading === "List of public oral hearings") {
    return oralHearingsList(normalized);
  }

  return normalized;
}

function buildResourcesBlock(nodes: ReportNode[]): LinkListBlock | null {
  const relatedIndex = nodes.findIndex(
    (node) =>
      node.type === "heading" && stripHtml(node.text) === "Related information",
  );
  const membershipIndex = nodes.findIndex(
    (node) =>
      node.type === "heading" &&
      stripHtml(node.text) === "Committee Membership",
  );

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

function buildReportBlocks(nodes: ReportNode[]): StoryBlock[] {
  const forewordIndex = nodes.findIndex(
    (node) => node.type === "heading" && stripHtml(node.text) === "Foreword",
  );
  const membershipIndex = nodes.findIndex(
    (node) =>
      node.type === "heading" &&
      stripHtml(node.text) === "Committee Membership",
  );
  const appendixIndex = nodes.findIndex(
    (node) => node.type === "heading" && stripHtml(node.text) === "Appendix 1",
  );

  const mainNodes =
    forewordIndex >= 0
      ? nodes.slice(
          forewordIndex,
          appendixIndex >= 0 ? appendixIndex : undefined,
        )
      : nodes;
  const appendixNodes =
    appendixIndex >= 0
      ? nodes.slice(
          appendixIndex,
          membershipIndex >= 0 ? membershipIndex : undefined,
        )
      : [];
  const membershipNodes =
    membershipIndex >= 0
      ? nodes.slice(
          membershipIndex,
          forewordIndex >= 0 ? forewordIndex : undefined,
        )
      : [];
  const sourceNodes = [...mainNodes, ...appendixNodes, ...membershipNodes];

  const blocks: StoryBlock[] = [];
  let currentHeading: string | undefined;
  let currentHeadingLevel: 2 | 3 = 2;
  let currentParagraphs: string[] = [];

  function flush() {
    if (!currentHeading && currentParagraphs.length === 0) return;

    const normalizedParagraphs = normalizeParagraphs(
      currentHeading,
      currentParagraphs,
    );
    const headingLevel =
      currentHeading && /^Appendix\s+\d+/i.test(currentHeading)
        ? 3
        : currentHeadingLevel;

    blocks.push({
      type: "text",
      heading: currentHeading,
      headingLevel: currentHeading ? headingLevel : undefined,
      paragraphs: normalizedParagraphs,
    });

    currentHeading = undefined;
    currentHeadingLevel = 2;
    currentParagraphs = [];
  }

  for (const node of sourceNodes) {
    if (node.type === "heading") {
      flush();
      currentHeading = stripHtml(node.text);
      currentHeadingLevel = node.level === 2 ? 3 : 2;
      continue;
    }

    currentParagraphs.push(node.text);
  }

  flush();

  const resourcesBlock = buildResourcesBlock(nodes);
  if (resourcesBlock) {
    blocks.push(resourcesBlock);
  }

  return blocks;
}

export const committeeReport: Story = {
  slug: reportDocument.slug,
  section: "committees",
  featured: true,
  heroLayout: "contained",
  heroImagePosition: "left center",
  showContents: true,
  eyebrow: "Committee Report",
  title: reportDocument.title,
  dek: "Report of the Joint Committee on Tourism, Culture, Arts, Sport and Media on inclusion in sport, published in May 2026.",
  byline: "Joint Committee on Tourism, Culture, Arts, Sport and Media",
  date: "16 May 2026",
  readingTime: "20 min read",
  hero: {
    src: "/media/inclusion-in-sport.jpg",
    alt: "Cover graphic for the Report on Inclusion in Sport",
  },
  blocks: buildReportBlocks(reportDocument.blocks),
};

export default committeeReport;
