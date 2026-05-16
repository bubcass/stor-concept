import type { Story } from "../../types";

export const researchBriefing: Story = {
  slug: "tackling-homelessness-2025-05-12",
  section: "library-research-service",
  heroLayout: "immersive",
  showContents: true,
  flourishWidth: "prose",
  eyebrow: "Research Matters",
  title: "Tackling homelessness",
  dek: "Homelessness is one of the most challenging issues facing policy makers. The Housing First approach as implemented in Finland shows a possible path to improvement.",
  byline: "Eoin McLoughlin",
  abstract:
    "<strong>Summary:</strong> Emergency accommodation use in Ireland continues to rise, driven by a mix of structural, personal, institutional and relationship factors. This briefing outlines the current scale of homelessness, the reasons households enter emergency accommodation, and policy frameworks aimed at reducing homelessness over time.",
  researcher: {
    name: "Eoin McLoughlin",
    role: "Senior Researcher",
    image: "/media/eoin-mcloughlin-headshot.jpg",
    organisation: "Parliamentary Research Service",
    bio: "",
  },
  date: "12 May 2026",
  publishedDate: "2026-05-12",
  readingTime: "8 min read",
  hero: {
    src: "/media/housing.mp4",
    alt: "An artistic housing picture",
  },
  blocks: [
    {
      type: "text",
      paragraphs: [
        "Homelessness is one of the most challenging issues facing policy makers. As of October 2024, there were 14,966 people accessing emergency accommodation, including 4,645 children (around 30% of the total).",
        "This figure represents an increase of 1,787 people when compared with October 2023, and an increase of 206 people when compared with September 2024. Some 53% of adults accessing emergency accommodation were between the age of 25 and 44, while 61% were male.",
      ],
    },
    {
      type: "flourish",
      embedType: "chart",
      dataSrc: "visualisation/20815059?657582",
      thumbnail: "https://public.flourish.studio/story/20815059/thumbnail",
      alt: "Flourish visualisation",
      caption:
        "The trend in the number of people living in emergency accommodation since 2015. Except for a period during COVID-19, the figures have been rising every year since 2015.",
    },
    {
      type: "text",
      heading: "Reasons for homelessness",
      paragraphs: [
        "The reasons people become homeless are complex and are often made up of many factors, including:",
        `<ul>
          <li><strong>Structural</strong>, for example, lack of affordable housing, and issues in the private rental market.</li>
          <li><strong>Personal circumstances</strong>, for example, mental health, and drug addiction.</li>
          <li><strong>Institutional</strong>, for example, those leaving prisons and direct provision centres.</li>
          <li><strong>Relationship</strong>, for example, domestic violence and financial stress.</li>
        </ul>`,
        "This mix of factors can be seen in Figure 2 below, which shows the primary reasons for homelessness given by new entrants to emergency accommodation in quarter 3 2024. 'Notice of termination' was the main reason given (as represented by the bubble size), followed closely by 'relationship breakdown and family circumstance'.",
      ],
    },
    {
      type: "flourish",
      embedType: "chart",
      dataSrc: "visualisation/20262746?657582",
      thumbnail: "https://public.flourish.studio/story/20262746/thumbnail",
      alt: "Flourish visualisation",
    },
    {
      type: "text",
      heading: "Types of emergency accommodation for homeless households",
      paragraphs: [
        "Currently, most newly homeless households in Ireland are provided with private emergency accommodation until long-term housing is found. The different types of emergency accommodation used are:",
        `<ul>
          <li><strong>Private accommodation:</strong>such as hotels, B&Bs and other residential facilities that are used on an emergency basis.</li>
          <li><strong>Supported accommodation:</strong> such as family hubs and hostels, with onsite professional support.</li>
          <li><strong>Temporary accommodation:</strong> emergency accommodation with no (or minimal) support, operated both by NGOs and private operators.</li>
        </ul>`,
        "As shown in Figure 3, most homeless adults availing of emergency accommodation are in Dublin (7,388), and in many regions homeless adults are more likely to be staying in Private Emergency Accommodation.",
      ],
    },
    {
      type: "flourish",
      embedType: "chart",
      dataSrc: "visualisation/20816049?657582",
      thumbnail: "https://public.flourish.studio/story/20816049/thumbnail",
      alt: "Flourish visualisation",
    },
    {
      type: "text",
      heading: "Tackling homelessness",
      paragraphs: [
        "Ireland signed up to the Lisbon Declaration on the European Platform on Combatting Homelessness in June 2021. The Declaration commits all signatories to working towards ending homelessness by 2030. To this end, the ‘Housing for All’ strategy aims to reduce the number of families and individuals that experience homelessness in Ireland. It seeks to end homelessness by 2030 through a range of measures, including increasing social housing.",
        "The Organisation for Economic Cooperation and Development (OECD) has developed a toolkit that aims to provide guidance to policy makers to:",
        `<ul>
          <li>prevent people from becoming homeless;</li>
          <li>support people who are experiencing homelessness;</li>
          <li>provide effective, sustainable pathways out of homelessness.</li>
        </ul>`,
        "The toolkit features nine ‘building blocks’. Each block represents a key area for action towards tackling homelessness. The toolkit aims to support policy makers throughout the policy design, implementation, and management phases. The OECD toolkit is outlined in Figure 4 below.",
      ],
    },
    {
      type: "image",
      layout: "wide",
      image: {
        src: "/media/homelessness-policy-framework.svg",
        alt: "Diagram showing nine homelessness policy actions across policy design and monitoring, policy implementation, and policy management.",
      },
    },
    {
      type: "text",
      heading: "Prioritising prevention",
      paragraphs: [
        "Homelessness prevention can be grouped into the following categories:",
        `<ul>
          <li>Primary prevention, which includes activities that reduce the risk of homelessness among the general population, for example, housing, and social protection policy.</li>
          <li>Secondary prevention, targeted on ‘at risk’ populations, such as those leaving state institutions like prisons, those with mental health issues or experiencing drug abuse, or those facing eviction.</li>
          <li>Tertiary prevention, which includes rapid rehousing services that try to reduce the period of homelessness once it has occurred, and services designed to prevent repeated experiences of homelessness.</li>
        </ul>`,
        "Norway provides a notable example, having successfully reduced homelessness by 47% between 2012 and 2020. This was achieved through, in part, a housing-led approach along with sustained investment in affordable housing. Since 2010, homelessness prevention has been included as a key pillar in Norway’s national strategies. It has targets to reduce evictions, end homelessness, and limit stays in temporary accommodations.",
      ],
    },
    {
      type: "text",
      heading: "Tailoring supports",
      paragraphs: [
        "The increasing diversity of the homeless population requires varied housing and service solutions. For example, in addition to housing support, homeless populations such as youths, veterans, migrants and domestic violence victims need specific social supports, including health services, counselling, childcare, language classes, or support finding a job.",
        "The ‘Housing First’ policy approach is an internationally recognised way of addressing homelessness. It seeks to house people who have high and complex needs, as well as providing access to recovery-oriented supports. This is different from approaches that expect individuals to show that they are ‘housing ready’ before they are rehoused. The Housing First model is becoming more widespread. However, its implementation can vary widely across countries which have adopted this approach.",
        "In Ireland, Housing First initially became active in the Dublin region in 2011, where it began as a demonstration project. To assist with the national rollout of the Housing First programme, a Housing First National Implementation Plan was published in September 2018. The latest plan covers the period 2022 to 2026, with the Housing Agency tasked with overseeing a national, cross-government approach to implementation.",
      ],
    },
    {
      type: "text",
      heading: "Long-term political support and funding: the Finnish approach",
      paragraphs: [
        "Countries that have successfully reduced homelessness have highlighted the importance of long-term political commitment, at all levels of government, along with sustained investment. In Finland, single homelessness (homeless people who live alone) fell by 57% between 2008 and 2023.",
        "This success was driven by a Housing First approach, launched in 2008, as part of the National Programme to End Long-term Homelessness (Paavo). A key aspect of the strategy was to replace shelters and temporary accommodation with permanent rental housing for the long-term homeless population.",
        "Finland’s Housing First model has four guiding principles:",
        `<ol>
          <li><strong>Housing enables independent lives</strong> – the person who is homeless can go straight to living in a rental apartment without temporary arrangements.</li>
          <li><strong>Respect of choice</strong> – the client has the opportunity to choose treatments and services.</li>
          <li><strong>Rehabilitation and empowerment of the resident</strong> – staff meet and treat the client as an equal.</li>
          <li><strong>Integration into the community and society</strong> – in supported housing units, significant neighbourhood work is done with residents, such as holding information meetings or through taking security precautions, to relieve any fears they may have.</li>
        </ol>`,
        "The Finnish experience demonstrates the effectiveness of tackling homelessness through a mix of policy levers. These include financial assistance, integrated and targeted support services, and more housing supply.",
      ],
    },
    {
      type: "text",
      heading: "Lessons for Ireland",
      paragraphs: [
        "Some key aspects of Finland’s approach which could be considered for Ireland include:",
        `<ul>
          <li><strong>Sufficient supply of affordable and social housing</strong> – a non-profit organisation called the Y-Foundation acquires and builds affordable rental accommodation and is the fourth largest landlord in Finland. The municipality of Helsinki also owns around 70% of its land area and is therefore able to play a major role in providing and promoting affordable housing. Funding has been provided in the past from the Finnish Slot Machine Association and a government agency (ARA).</li>
          <li><strong>Type of Housing First model</strong> – Finnish 'Housing First' is a housing-led approach across all elements of strategy, combined with harm-reduction services. An emphasis is placed on choice and control for people experiencing homelessness associated with multiple and complex needs.</li>
          <li><strong>Governance</strong> – cooperation between local authorities, NGOs providing homelessness services, Y-Foundation and the central government has proven essential. It resulted in developing a mix of better access to social housing, preventative services, less concentrated supported accommodation using flats scattered throughout apartment complexes, and the Housing First services that reduced long-term homelessness.</li>
          <li><strong>Prevention</strong> – in Finland, 'housing councillors' or 'housing social workers' can perform multi-level assessments, bringing in other agencies as necessary that triage people to eviction prevention, rapid rehousing or rapid rehousing with support/treatment packages.</li>
          <li><strong>Wider definition of homelessness</strong> – accounting for 'hidden homelessness', such as those sofa-surfing with friends and family, means that broader interventions are developed.</li>
        </ul>`,
      ],
    },
    {
      type: "link-list",
      eyebrow: "Explore further",
      links: [
        {
          label: "The Research Matters series",
          href: "https://www.oireachtas.ie/en/how-parliament-is-run/houses-of-the-oireachtas-service/library-and-research-service/research-matters/",
          description:
            "Discover our curated collection of research articles to inform parliamentary debate",
        },
        {
          label: "Research focus | Housing and homelessness",
          href: "https://www.oireachtas.ie/en/publications/?q=housing&date=&term=%2Fie%2Foireachtas%2Fhouse%2Fdail%2F34&fromDate=14%2F05%2F2026&toDate=14%2F05%2F2026",
          description: "Further research from across Stór",
        },
      ],
    },
  ],
};

export default researchBriefing;
