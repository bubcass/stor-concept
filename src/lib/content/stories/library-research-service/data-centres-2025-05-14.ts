import type { Story } from "../../types";

export const researchBriefing: Story = {
  slug: "the-future-of-data-centres-in-ireland-2025-05-14",
  section: "library-research-service",
  heroLayout: "split",
  showContents: true,
  flourishWidth: "prose",
  eyebrow: "Research Matters",
  title: "The future of data centres in Ireland",
  dek: "Ireland is a key hub for data centres and although technology multinationals bring large corporation tax takings, the growing energy needs of data centres poses a challenge for the country's climate ambitions.",
  byline: "Kate Walsh",
  abstract:
    "<strong>Summary:</strong> Ireland’s growing data centre sector is a key challenge, pitting climate goals against growth of the digital economy. Amidst a global boom in digitalisation and artificial intelligence, Ireland has become a leading hub for data centres which are viewed as anchors for foreign direct investment. Aside from banning them altogether, what policy avenues are ahead?",
  researcher: {
    name: "Kate Walsh",
    role: "Senior Researcher",
    image: "/media/kate-walsh-headshot.jpg",
    organisation: "Parliamentary Research Service",
    bio: "",
  },
  date: "May 14, 2025",
  readingTime: "9 min read",
  hero: {
    src: "/media/server.jpg",
    alt: "A computer server in a rack",
  },
  blocks: [
    {
      type: "text",
      paragraphs: [
        "Ireland is a leading hub for data centres, attracting the likes of Microsoft, Meta, Google, and Amazon. Technology multinationals bring significant corporation tax takings, yet data centres are power-hungry and their growing energy needs pose a challenge for Ireland’s climate ambitions. Using carbon-free energy would be the optimum solution. However, Ireland’s progress on doubling its renewable electricity (RES-E) to 80% by 2030 is mismatched by the growing power demand faced today.",
        `<strong>Data centres currently consume one fifth of Ireland’s electricity</strong> and are projected to use one-third in the next few years. This rise mostly relates to expansion by existing data centres, rather than new centres in the pipeline. Ireland’s current strategy (since 2021) is to essentially pause new electricity grid connections especially around Dublin pending a new decision on ‘large energy users’ by the Commission for Regulation of Utilities (CRU). Beyond a complete ban on new data centre sites in the future, there is a series of policy avenues ahead.`,
      ],
    },
    {
      type: "text",
      heading: "Electricity demand is outpacing generation",
      paragraphs: [
        "Electricity supply and grid stability are real concerns. Central to Ireland’s national climate action plan is energy decarbonisation via widespread electrification – of transport, homes, heating, and industry. In the Dublin area in particular, these sectors are all putting additional strain on the grid, but data centres are by far the most demanding. To date, the pace of renewable electricity development has lagged behind the rapid growth in data centre power consumption (see Figure 1).",
      ],
    },
    {
      type: "flourish",
      embedType: "chart",
      dataSrc: "visualisation/20888306?657582",
      thumbnail:
        "https://public.flourish.studio/visualisation/20888306/thumbnail",
      alt: "Flourish visualisation",
    },
    {
      type: "text",
      heading: "Data centres across Ireland",
      paragraphs: [
        `Every year, EirGrid publishes a ten-year forecast for the electricity market of the island of Ireland. In 2024, it said <strong>89% of the growth in total electricity needed in the next decade is attributed to data centres</strong>.`,
        "Data centres (orange symbols) are located close to the ESB Telecoms high-capacity fibre network (blue lines.) Of these, 16 data centre sites (grey symbols) are licensed by the Environmental Protection Agency for industrial emissions associated with on-site power generation capacity (as at November 2024.)",
      ],
    },
    {
      type: "arcgis-map",
      itemId: "2e251089a58d4944ad16017808b25083",
      caption: "Figure 2: Data centres and communications networks in Ireland.",
      height: "600px",
      theme: "light",
      legendEnabled: true,
      headingEnabled: true,
      informationEnabled: true,
      layout: "wide",
    },
    {
      type: "text",
      heading: "Development of data centres outside Dublin",
      paragraphs: [
        `Capacity constraints in the Dublin region are a key concern of the regulator, CRU. One strategy would be a <strong>plan-based approach, for new clusters of data centres in other regions</strong> that are close to coastal landing points for subsea power and communications interconnections. There is scope to develop infrastructure along existing road and rail conduits, making the likes of Cork, Limerick, and Waterford new candidate data centre hubs. Figure 2 shows maps of data centres and the existing high-capacity communications network.`,
      ],
    },
    {
      type: "text",
      heading: "Long-term strategic infrastructure development",
      paragraphs: [
        `Recently there have been a series of <strong>data centre planning application refusals</strong>, many citing energy concerns. Currently, all planning applications are made to local authorities. However, Section 49 of the <em>Planning and Development (Amendment) Act 2018</em> adds large data centres (defined by land footprint not energy demands) to the list of <strong>strategic infrastructure development</strong>.`,
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
