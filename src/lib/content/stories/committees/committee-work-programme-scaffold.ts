import type { Story } from "../../types";

export const committeeWorkProgrammeScaffold: Story = {
  slug: "committee-work-programme-scaffold",
  section: "parliamentary-budget-office",
  featured: true,
  heroLayout: "split",
  eyebrow: "Research Note",
  title: "The School Transport System",
  dek: "This placeholder feature shows how Stór can present committee outputs with editorial structure, embedded media and research links while the real repository content is being assembled.",
  byline: "Angelika Glapska",
  researcher: {
    name: "Angelika Glapska",
    role: "Visual data analyst",
    organisation: "Parliamentary Budget Office",
    bio: "",
  },
  date: "May 10, 2025",
  readingTime: "8 min read",
  hero: {
    src: "/media/bus.jpg",
    alt: "Placeholder committee feature hero media used for the Stór scaffold.",
  },
  blocks: [
    {
      type: "text",
      paragraphs: [
        "This scaffold story is a stand-in for a future committee repository feature in <strong>Stór</strong>.",
        "It mirrors the editorial structure of the source prototype while shifting the copy toward publications, evidence sessions and committee work programmes.",
        "Use this file as a template for future committee highlights, curated briefings or publication landing pieces.",
      ],
    },
    {
      type: "media-text",
      heading: "Framing committee activity",
      paragraphs: [
        "A Stór committee piece can introduce current areas of scrutiny, explain the publication context and direct readers to the most relevant output.",
        "This block demonstrates how a repository article can balance explanatory copy with embedded media or recorded committee moments.",
        "The intent is not to finalise committee wording here, only to preserve the component structure and presentation patterns.",
      ],
      mediaSide: "right",
      media: {
        type: "video",
        asset: {
          src: "/media/ceann-comhairle-europe-day.mp4",
          poster: "/media/ceann_comhairle_chair.jpg",
          caption:
            "Placeholder media in the Stór scaffold showing how rich media can sit beside committee context.",
        },
      },
    },
    {
      type: "text",
      heading: "Publication context",
      paragraphs: [
        "Repository content often needs short contextual sections explaining what a paper is, why it matters and how it connects to committee business.",
        "This scaffold keeps that pattern simple so editors can replace the sample text with real Stór summaries later.",
      ],
    },
    {
      type: "flourish",
      embedType: "chart",
      dataSrc: "story/3664032?657582",
      thumbnail: "https://public.flourish.studio/story/3664032/thumbnail",
      alt: "Placeholder data visualisation for the Stór scaffold",
      caption:
        "Placeholder visual space for future committee charts or research graphics.",
    },
    {
      type: "text",
      heading: "Where this pattern fits",
      paragraphs: [
        "This structure works for committee reports, consultation roundups, evidence summaries and publication announcements.",
        "The same page can later link readers to source documents, transcripts and related repository entries without changing the underlying architecture.",
      ],
    },
    {
      type: "link-list",
      eyebrow: "Repository links",
      links: [
        {
          label: "Committee publications",
          href: "https://www.oireachtas.ie/en/committees/",
          description:
            "Placeholder destination for published committee outputs and supporting material.",
        },
        {
          label: "How committee scrutiny works",
          href: "https://www.oireachtas.ie/en/how-parliament-is-run/houses-of-the-oireachtas-service/",
          description:
            "Reference link that can be replaced with a more specific Stór destination later.",
        },
      ],
    },
  ],
};

export default committeeWorkProgrammeScaffold;
