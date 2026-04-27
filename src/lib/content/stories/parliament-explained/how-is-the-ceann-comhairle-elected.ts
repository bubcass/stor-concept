import type { Story } from "../../types";

export const europeanMeasuresExplained: Story = {
  slug: "how-is-the-ceann-comhairle-elected",
  section: "parliament-explained",
  heroLayout: "immersive",
  eyebrow: "Learning Hub",
  title: "How is the Ceann Comhairle elected?",
  dek: "The election of the Ceann Comhairle is the first business conducted by a newly elected Dáil.\nSince 2016, the process has been a secret ballot of Members.",
  byline: "Angharad Williams",
  date: "April 14, 2026",
  readingTime: "5 min read",
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
        "Our visual essay explains the process of how a Member of the newly elected Dáil becomes the Ceann Comhairle.",
      ],
    },
    {
      type: "scene-scrolly",
      //title: "Making their case",
      //intro: "This first sequence follows the movement from nomination to count inside Leinster House.",
      steps: [
        {
          //eyebrow: "Step 1",
          title: "Candidates address the House",
          body: "To begin the process the Clerk of the Dáil announces the names of Members who have a valid nomination for selection.",
          placeLabel: "Dáil Chamber",
          overlayPosition: "left-center",
          focus: { x: 52, y: 38, scale: 1.02 },
          image: {
            src: "/media/clerk-addressing-dail.jpg",
            alt: "John McGuinness speaking in the Dáil during the election of the Ceann Comhairle.",
          },
        },
        {
          // eyebrow: "Step 4",
          title: "Candidates address the House",
          body: "Before proceeding to the ballot, each nominated Member may speak on their own behalf or have someone speak on their behalf.",
          placeLabel: "Dáil Chamber",
          overlayPosition: "right-center",
          focus: { x: 52, y: 42, scale: 1.02 },
          image: {
            src: "/media/Verona-murphy-speaking-in-the-Dail.jpg",
            alt: "Verona Murphy speaking in the Dáil before the selection of the Ceann Comhairle.",
          },
        },
        {
          //eyebrow: "Step 3",
          title: "Ballot boxes leave the chamber",
          body: "The ballots are cast. Once the voting has finished, the ballot boxes are carried by parliamentary ushers to a room where the votes are counted by Oireachtas officials.",
          placeLabel: "Leinster House corridor",
          overlayPosition: "left-center",
          focus: { x: 49, y: 44, scale: 1.03 },
          image: {
            src: "/media/ushers-exiting-the-dail-chamber-with-ballot-boxes.jpg",
            alt: "Ushers carrying ballot boxes out of the Dáil chamber during the election process.",
          },
        },
        {
          //eyebrow: "Step 2",
          title: "Officials prepare the count",
          body: "The ballots are sorted by officials and counted.",
          placeLabel: "Seanad Antechamber",
          overlayPosition: "right-center",
          focus: { x: 50, y: 46, scale: 1.01 },
          image: {
            src: "/media/counting-of-ceann-comhairle-ballots.jpg",
            alt: "Officials and staff overseeing the counting of ballots in a reception room in Leinster House.",
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
