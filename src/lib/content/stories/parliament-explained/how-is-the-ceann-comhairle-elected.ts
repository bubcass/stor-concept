import type { Story } from "../../types";

export const europeanMeasuresExplained: Story = {
  slug: "european-measures-explained",
  section: "parliament-explained",
  heroLayout: "immersive",
  eyebrow: "Learning Hub",
  title: "How is the Ceann Comhairle elected?",
  dek: "The election of the Ceann Comhairle is the first business conducted by a newly elected Dáil.\nSince 2016, the process has been a secret ballot of Members.",
  byline: "David Cass",
  date: "April 14, 2026",
  readingTime: "7 min read",
  hero: {
    src: "/media/ceann_comhairle_election.jpg",
    alt: "The Ceann Comhairle, Deputy Verona Murphy, on being elected in 2024.",
  },
  blocks: [
    {
      type: "text",
      //heading: "Selecting the Ceann Comhairle",
      paragraphs: [
        "The Ceann Comhairle is the chairperson of Dáil Éireann and presides impartially and with authority over the business and proceedings of the House.",
        "When a new Dáil meets and after the roll of elected Members has been announced by the Clerk of the Dáil, the process to select the new Ceann Comhairle begins.",
      ],
    },
    {
      type: "scene-scrolly",
      title: "How the election takes shape",
      intro: "This first sequence follows the movement from nomination to count inside Leinster House.",
      steps: [
        {
          eyebrow: "Step 1",
          title: "Candidates address the House",
          body: "Placeholder text for the opening scene. This panel can explain how candidates are proposed and how the chamber is set for the first decision of a new Dáil.",
          placeLabel: "Dáil chamber",
          overlayPosition: "left-center",
          focus: { x: 52, y: 38, scale: 1.02 },
          image: {
            src: "/media/john-mcguinness-speaking-in-the-dail.jpg",
            alt: "John McGuinness speaking in the Dáil during the election of the Ceann Comhairle.",
          },
        },
        {
          eyebrow: "Step 2",
          title: "Officials prepare the count",
          body: "Placeholder text for the counting room. This can describe the administrative work behind a secret ballot and the transition from speeches in the chamber to counting outside it.",
          placeLabel: "Counting room",
          overlayPosition: "right-center",
          focus: { x: 50, y: 46, scale: 1.01 },
          image: {
            src: "/media/counting-of-ceann-comhairle-ballots.jpg",
            alt: "Officials and staff overseeing the counting of ballots in a reception room in Leinster House.",
          },
        },
        {
          eyebrow: "Step 3",
          title: "Ballot boxes leave the chamber",
          body: "Placeholder text for the transfer between spaces. This panel can explain the procedural choreography that keeps the vote secret while moving the ballot to the count.",
          placeLabel: "Leinster House corridor",
          overlayPosition: "left-center",
          focus: { x: 49, y: 44, scale: 1.03 },
          image: {
            src: "/media/ushers-exiting-the-dail-chamber-with-ballot-boxes.jpg",
            alt: "Ushers carrying ballot boxes out of the Dáil chamber during the election process.",
          },
        },
        {
          eyebrow: "Step 4",
          title: "The result is reported back",
          body: "Placeholder text for the closing scene. This can set up the formal declaration of the successful candidate and the return from procedure to chamber business.",
          placeLabel: "Dáil chamber",
          overlayPosition: "right-center",
          focus: { x: 52, y: 42, scale: 1.02 },
          image: {
            src: "/media/Verona-murphy-speaking-in-the-Dail.jpg",
            alt: "Verona Murphy speaking in the Dáil after the Ceann Comhairle vote.",
          },
        },
      ],
    },
    {
      type: "chart",
      chart: "ceann-comhairle-waffle",
      data: "/data/CCSelectionCompleteData.csv",
      title: "Election of the Ceann Comhairle",
      //caption:
      //"Standings after each count. Candidates must reach the quota to be elected.",
    },
    {
      type: "media-text",
      eyebrow: "Motion insert",
      heading: "When a short clip is enough",
      paragraphs: [
        "A compact media row can hold a short motion plate beside the explanation. It gives the page visual rhythm without asking the reader to enter a full-screen chapter.",
      ],
      mediaSide: "left",
      media: {
        type: "video",
        asset: {
          src: "/media/transparency_seanad.mp4",
          poster: "/media/full_chamber.jpg",
          caption:
            "Video in this block follows the same muted, looping editorial default as the full-width video block.",
        },
      },
    },
    {
      type: "text",
      heading: "The Value of Delay",
      paragraphs: [
        "Scrutiny can look like delay from the outside. Inside the process, delay can be the mechanism that lets a committee notice ambiguity, request clarification and make a technical proposal legible to a wider public.",
      ],
    },
    {
      type: "quote",
      text: "The important thing is not just whether a measure passes, but whether anyone has understood what it asks the State to do.",
      attribution: "Former committee member",
    },
  ],
};

export default europeanMeasuresExplained;
