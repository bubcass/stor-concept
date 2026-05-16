import type { Story, StoryBlock, StorySection } from '../types';
import { buildCommitteeReportStory } from '../stories/committees/reportBuilder';
import {
  proseMirrorToCommitteeNodes,
  proseMirrorToNarrativeBlocks,
} from './prosemirror';
import type { StorDocument, StorEnhancement, StorRenderResult } from './types';
import { validateStorDocument } from './validate';

function destinationToSection(document: StorDocument): StorySection {
  if (document.section) return document.section;

  switch (document.destination) {
    case 'committee-reports':
      return 'committees';
    case 'library-research-service':
      return 'library-research-service';
    case 'parliamentary-budget-office':
      return 'parliamentary-budget-office';
  }
}

function formatDate(value?: string | null) {
  if (!value) return 'Unpublished';

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;

  return new Intl.DateTimeFormat('en-IE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(timestamp));
}

function estimateReadingTime(document: StorDocument) {
  const words = JSON.stringify(document.content)
    .replace(/[^A-Za-z0-9À-ÿ]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return `${Math.max(1, Math.round(words / 220))} min read`;
}

function firstVisibleContributor(document: StorDocument) {
  return (
    document.contributors?.find((contributor) => contributor.showAsAuthor) ??
    document.contributors?.[0] ??
    null
  );
}

function headingForBlock(block: StoryBlock) {
  if (block.type === 'text') return block.heading;
  if (block.type === 'media-text' || block.type === 'image') return block.heading;
  return undefined;
}

function applyEnhancements(blocks: StoryBlock[], enhancements: StorEnhancement[] = []) {
  if (!enhancements.length) return blocks;

  const output = [...blocks];

  for (const enhancement of enhancements) {
    if (!enhancement.afterHeading) {
      output.push(enhancement.block);
      continue;
    }

    const normalizedAnchor = enhancement.afterHeading.trim().toLowerCase();
    const index = output.findIndex((block) => {
      const heading = headingForBlock(block);
      return heading?.trim().toLowerCase() === normalizedAnchor;
    });

    if (index === -1) {
      output.push(enhancement.block);
      continue;
    }

    output.splice(index + 1, 0, enhancement.block);
  }

  return output;
}

function narrativeStoryFromStorDocument(document: StorDocument): Story {
  const contributor = firstVisibleContributor(document);
  const section = destinationToSection(document);
  const blocks = applyEnhancements(
    proseMirrorToNarrativeBlocks(document.content, {
      title: document.title,
    }),
    document.enhancements,
  );

  return {
    slug: document.slug,
    section,
    featured: document.featured ?? false,
    heroLayout: document.heroLayout ?? 'contained',
    showContents: document.showContents ?? true,
    flourishWidth: document.flourishWidth ?? 'prose',
    eyebrow:
      document.eyebrow ??
      document.committeeName ??
      (section === 'library-research-service'
        ? 'Library & Research Service'
        : section === 'parliamentary-budget-office'
          ? 'Parliamentary Budget Office'
          : 'Stór'),
    title: document.title,
    dek: document.dek,
    byline:
      document.byline ??
      contributor?.name ??
      document.committeeName ??
      (section === 'library-research-service'
        ? 'Library & Research Service'
        : section === 'parliamentary-budget-office'
          ? 'Parliamentary Budget Office'
          : 'Oireachtas Research'),
    abstract: document.abstract,
    researcher: document.researcher,
    date: formatDate(document.publishedDate),
    publishedDate: document.publishedDate,
    readingTime: estimateReadingTime(document),
    heroImagePosition: document.hero?.position ?? 'center center',
    hero: {
      src: document.hero?.src ?? '/media/report_launch.jpg',
      alt: document.hero?.alt ?? document.title,
      caption: document.hero?.caption ?? null,
      credit: document.hero?.credit ?? null,
    },
    blocks,
  };
}

export function storDocumentToStory(document: StorDocument): StorRenderResult {
  validateStorDocument(document);

  if (document.destination === 'committee-reports') {
    const story = buildCommitteeReportStory({
      document: {
        slug: document.slug,
        title: document.title,
        committeeName: document.committeeName,
        publishedDate: document.publishedDate ?? undefined,
        blocks: proseMirrorToCommitteeNodes(document.content),
      },
      dek: document.dek,
      featured: document.featured ?? false,
      eyebrow: document.eyebrow,
      byline: document.byline ?? document.committeeName,
      hero: {
        src: document.hero?.src ?? '/media/committee-members-speak-at-a-report-launch.jpg',
        alt: document.hero?.alt ?? document.title,
        caption: document.hero?.caption ?? null,
        credit: document.hero?.credit ?? null,
      },
      launchVideo: document.launchVideo,
      heroLayout: document.heroLayout,
      heroImagePosition: document.hero?.position ?? 'left center',
      showContents: document.showContents,
      startHeadings: ['Foreword', 'Cathaoirleach’s Foreword'],
    });

    return {
      source: document,
      story: {
        ...story,
        blocks: applyEnhancements(story.blocks, document.enhancements),
      },
    };
  }

  return {
    source: document,
    story: narrativeStoryFromStorDocument(document),
  };
}
