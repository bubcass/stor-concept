import type { Story } from "../../types";

export const researchBriefing: Story = {
  slug: "the-future-of-data-centres-in-ireland-2025-05-14",
  section: "library-research-service",
  featured: false,
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
  publishedDate: "2026-05-14",
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
        "Once Section 49 is commenced, planning applications for any large data centre will be lodged directly with An Coimisiún Pleanála (formerly An Bord Pleanála.) A strategic national approach to planning any new data centres might serve to better balance competing energy, greenhouse gas emissions and digital infrastructure challenges.",
      ],
    },
    {
      type: "text",
      heading: "Interim measures",
      paragraphs: [
        `Planned data centres must obtain a contract to connect to the grid before they are built. There is no moratorium on new data centres, but there are more hurdles than ever. The Dublin region grid is near maxed out in terms of its capacity. Since 2021, the CRU require that a data centre seeking a <strong>new connection to the electricity grid must provide on-site power generation or storage</strong> to match its power load needs. Industry and environmental campaigners are critical of this approach. In the short-term, bigger data centres are installing large generators on-site, making each an industrial greenhouse gas emitter.  Figure 2 displays data centres with an industrial emissions licence from the EPA.`,
      ],
    },
    {
      type: "text",
      heading: "Renewables and power purchase agreements (PPAs)",
      paragraphs: [
        `The 2024 Climate Action Plan sets ambitions to <strong>develop Irish renewable electricity sources in the next five years</strong>. Key 2030 targets are to:`,
        `<ul>
          <li>build offshore wind generation capacity to 5 Gigawatts (GW) – enough to power over 3.5 million homes;</li>
          <li>grow onshore wind power to 9 GW (from 4.5 GW today);</li>
          <li>target solar power of 8 GW (currently 1.2 GW); and</li>
          <li>secure 15% of renewable electricity via Power Purchase Agreements (PPAs).</li>
        </ul>`,
        "Should the 2030 targets be reached, the planned generation capacity is enough to cover the anticipated growth in demand by data centres. Further, energy analysts argue that large electricity users including data centres would be necessary to balance the grid load.",
        "Today, many data centre operators are pursuing corporate PPAs to shore up their renewable energy needs, improve their sustainability credentials and underpin their social licence to operate. There is currently no requirement for data centres to adopt PPAs, yet there is pent up demand amongst larger operators with hard decarbonisation targets. It is anticipated that future energy supply from wind and solar farms would be ‘gobbled up’ by the sector as a result.",
      ],
    },
    {
      type: "text",
      heading: "Going off-grid",
      paragraphs: [
        `Data centre operators complain that they cannot innovate their own energy solutions, as all electricity transmission is via a single national grid. In response to connection restrictions, new data centres plan to use natural gas which has a much worse carbon footprint than the grid electricity mix.`,
        `<strong>Legislating for private wire connections</strong> would free large energy users to connect directly to renewable sources such as wind and solar farms and bypass the national grid. Such connections could enable the establishment of <strong>energy parks</strong>, where data centres co-locate with renewable power sources and buy their power directly (via PPA). Some envisage islanded hubs of data centres that are independent of the grid altogether. However, such an approach would likely not meet the requirements of the top-tier data centre operators for power backup and data security. A national Private Wires Policy Framework is in development.`,
      ],
    },
    {
      type: "text",
      heading: "Energy Efficiency Directive and making use of waste heat",
      paragraphs: [
        `Under the recast Energy Efficiency Directive (EU/2023/1791) from May 2025 data centres will be required to <strong>report on their energy use</strong> and environmental impact annually.`,
        "The goal is greater transparency and comparable sustainability metrics. Ireland needs to transpose the Directive by October 2025.",
        `Data centres provide an opportunity for <strong>recovery of low-grade heat</strong>. The Heat (Networks and Miscellaneous Provisions) Bill (not yet initiated) is expected to set out a framework for district heating and use of waste heat in communities. Such systems offer potential for low-cost and constant heat in residential and business sectors, that reduce overall greenhouse gas emissions.`,
      ],
    },
    {
      type: "text",
      heading: "Data centres: where climate goals clash with economic growth",
      paragraphs: [
        `Future developments of the data centre sector will need to align with Ireland's climate objectives, <strong>focusing on decarbonising the energy supply</strong>. Data centres are considered vital to Ireland’s digital economy: they are anchors for numerous multinational ICT companies and their associated corporation and employment taxes. Whilst there are no specific figures published for data centre operating companies, it is noteworthy that Ireland is currently enjoying record incomes, with <strong>corporation tax nearly doubling since 2020</strong> to €24 billion in 2023.`,
        "The policy options explored above are key and one risk of inaction is departure of new data centres business altogether. There are key decision crossroads now for the State to consider, including whether to:",
        `<ul>
          <li><strong>Ban</strong> new data centres – at least while the State addresses the energy and grid infrastructure deficit</li>
          <li><strong>Restrict</strong> electricity grid access but exacerbate the carbon footprint of data centres that turn to natural gas in their own power generators</li>
          <li><strong>Accelerate</strong> build-out of electricity capacity, achieve the 2030 renewables goals, and promote new strategically located data centres around the country.</li>
          <li><strong>Legislate</strong> for measures that enhance and do not harm Ireland’s legally binding low-carbon targets, such as utilising waste heat, energy parks, PPAs and private renewable energy installations.</li>
        </ul>`,
      ],
    },
    {
      type: "image",
      heading: "Data centres at a glance",
      layout: "portrait",
      image: {
        src: "/media/data-centres.jpg",
        alt: "Infographic summarising key facts and figures about data centres in Ireland, including electricity demand, emissions and renewable energy targets.",
        caption:
          "Figure 3: Key facts and figures on data centres, electricity demand and Ireland's renewable energy targets.",
      },
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
          label: "Spotlight | Data centres",
          href: "https://data.oireachtas.ie/ie/oireachtas/libraryResearch/2024/2024-07-23_spotlight-data-centres-and-energy_en.pdf",
          description:
            "A detailed research note on data centres and their use of energy",
        },
      ],
    },
  ],
};

export default researchBriefing;
