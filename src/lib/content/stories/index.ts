import type { Story, StorySection } from "../types";
import { plainTextFromHtml } from "../text";

export interface StorySectionMeta {
  slug: StorySection;
  title: string;
  eyebrow?: string;
  intro: string;
}

export const storySections: StorySectionMeta[] = [
  {
    slug: "committees",
    title: "Committees",
    intro: "Track committee publications and research outputs.",
  },
  {
    slug: "parliamentary-budget-office",
    title: "Parliamentary Budget Office",
    intro:
      "Cut through the numbers with the PBO's fiscal, budgetary and economic analysis",
  },
  {
    slug: "library-research-service",
    title: "Library & Research Service",
    intro:
      "Explore research briefings, explainers and notes from the Library & Research Service.",
  },
];

function storyDateValue(story: Story) {
  const timestamp = Date.parse(story.date);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

const storyModules = import.meta.glob("./**/*.ts", {
  eager: true,
  import: "default",
}) as Record<string, Story>;

const storyList: Story[] = Object.entries(storyModules)
  .filter(([path]) => !path.endsWith("/index.ts"))
  .map(([, story]) => story);

export const stories: Story[] = [...storyList].sort(
  (a, b) => storyDateValue(b) - storyDateValue(a),
);

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
