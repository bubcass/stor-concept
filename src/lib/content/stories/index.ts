import type { Story, StoryDocumentType, StorySection } from "../types";
import { storStories } from "../stor";
import { plainTextFromHtml } from "../text";

export interface StorySectionMeta {
  slug: StorySection;
  title: string;
  eyebrow?: string;
  intro: string;
  accentColor?: string;
}

export interface StoryDocumentTypeMeta {
  value: StoryDocumentType;
  label: string;
}

export const storySections: StorySectionMeta[] = [
  {
    slug: "committees",
    title: "Committees",
    intro: "Find committee reports and research.",
  },
  {
    slug: "houses-of-the-oireachtas",
    title: "Houses of the Oireachtas",
    accentColor: "#4b5563",
    intro:
      "Browse recent publications produced across the Houses of the Oireachtas.",
  },
  {
    slug: "parliamentary-budget-office",
    title: "Parliamentary Budget Office",
    accentColor: "#670048",
    intro:
      "Cut through the numbers with the PBO's fiscal, budgetary and economic analysis",
  },
  {
    slug: "library-research-service",
    title: "Library & Research Service",
    accentColor: "#1c3194",
    intro:
      "Explore research briefings, explainers and notes from the Library & Research Service.",
  },
];

export const storyDocumentTypes: StoryDocumentTypeMeta[] = [
  { value: "committee-report", label: "Committee report" },
  { value: "article", label: "Article" },
  { value: "briefing", label: "Briefing" },
  { value: "visual-data-analysis", label: "Visual data analysis" },
  { value: "research-note", label: "Research note" },
  { value: "bill-digest", label: "Bill digest" },
];

function storyDateValue(story: Story) {
  const timestamp = Date.parse(story.publishedDate ?? story.date);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function getStoryDateValue(story: Story) {
  return storyDateValue(story);
}

export function getStoryDateIso(story: Story) {
  if (story.publishedDate && /^\d{4}-\d{2}-\d{2}$/.test(story.publishedDate)) {
    return story.publishedDate;
  }

  const timestamp = storyDateValue(story);
  if (!timestamp) return null;

  return new Date(timestamp).toISOString().slice(0, 10);
}

export function getEffectiveStoryDocumentType(story: Story): StoryDocumentType {
  if (story.documentType) return story.documentType;

  if (story.section === "committees") {
    return "committee-report";
  }

  return "article";
}

export function getStoryDocumentTypeMeta(type: StoryDocumentType) {
  return storyDocumentTypes.find((entry) => entry.value === type);
}

const storyModules = import.meta.glob(["./**/*.ts", "!./**/reportBuilder.ts"], {
  eager: true,
  import: "default",
}) as Record<string, Story>;

const storyList: Story[] = Object.entries(storyModules)
  .filter(([path]) => !path.endsWith("/index.ts"))
  .map(([, story]) => story);

const mergedStories = [...storyList, ...storStories];

export const stories: Story[] = Array.from(
  new Map(mergedStories.map((story) => [story.slug, story])).values(),
).sort((a, b) => storyDateValue(b) - storyDateValue(a));

export const publishedCommitteeNames = Array.from(
  new Set(
    stories
      .filter((story) => story.section === "committees")
      .map((story) => story.committeeName?.trim())
      .filter((value): value is string => Boolean(value)),
  ),
).sort((a, b) => a.localeCompare(b));

export function getStory(slug: string) {
  return stories.find((story) => story.slug === slug);
}

export function getStoriesBySection(section: StorySection) {
  return stories.filter((story) => story.section === section);
}

export function getStorySection(section: StorySection) {
  return storySections.find((entry) => entry.slug === section);
}

function searchableStoryText(story: Story) {
  return [
    story.title,
    story.byline,
    story.researcher?.name,
    story.researcher?.role,
    story.researcher?.organisation,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function searchStories(items: Story[], query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) return items;

  return items.filter((story) =>
    searchableStoryText(story).includes(normalized),
  );
}

export interface StorySearchResult {
  story: Story;
  score: number;
}

export function searchStoriesRanked(items: Story[], query: string) {
  const normalized = query.trim().toLowerCase();
  const terms = normalized.split(/\s+/).filter(Boolean);

  if (!terms.length) {
    return [] satisfies StorySearchResult[];
  }

  return items
    .map((story) => {
      const title = story.title.toLowerCase();
      const byline = story.byline.toLowerCase();
      const researcherName = story.researcher?.name?.toLowerCase() ?? "";
      const researcherRole = story.researcher?.role?.toLowerCase() ?? "";
      const researcherOrganisation =
        story.researcher?.organisation?.toLowerCase() ?? "";
      const dek = plainTextFromHtml(story.dek).toLowerCase();
      const combined = [
        title,
        byline,
        researcherName,
        researcherRole,
        researcherOrganisation,
        dek,
      ].join(" ");

      const matchesAllTerms = terms.every((term) => combined.includes(term));
      if (!matchesAllTerms) return null;

      let score = 0;

      if (title.includes(normalized)) score += 60;
      if (byline.includes(normalized) || researcherName.includes(normalized)) {
        score += 40;
      }
      if (
        researcherRole.includes(normalized) ||
        researcherOrganisation.includes(normalized)
      ) {
        score += 20;
      }
      if (dek.includes(normalized)) score += 12;

      for (const term of terms) {
        if (title.includes(term)) score += 14;
        if (byline.includes(term) || researcherName.includes(term)) score += 10;
        if (
          researcherRole.includes(term) ||
          researcherOrganisation.includes(term)
        ) {
          score += 5;
        }
        if (dek.includes(term)) score += 3;
      }

      return { story, score };
    })
    .filter((entry): entry is StorySearchResult => Boolean(entry))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return storyDateValue(b.story) - storyDateValue(a.story);
    });
}
