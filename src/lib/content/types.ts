export type StoryBlock =
  | TextBlock
  | MediaTextBlock
  | ImageBlock
  | VideoBlock
  | CommitteeMembersBlock
  | FlourishStoryBlock
  | ArcGISMapStoryBlock
  | ChartStoryBlock
  | VoteMapStoryBlock
  | LinkListBlock
  | QuoteBlock
  | ScrollyBlock
  | SceneScrollyBlock;

export type StorySection =
  | 'committees'
  | 'parliamentary-budget-office'
  | 'library-research-service';
export type StoryHeroLayout = 'contained' | 'split' | 'immersive';

export interface Story {
  slug: string;
  section: StorySection;
  featured?: boolean;
  heroLayout?: StoryHeroLayout;
  heroImagePosition?: string;
  showContents?: boolean;
  flourishWidth?: 'wide' | 'prose';
  title: string;
  /** Trusted inline HTML is supported for the story-page dek. */
  dek: string;
  eyebrow: string;
  byline: string;
  /** Optional trusted inline HTML for an abstract/summary shown before the article body. */
  abstract?: string;
  researcher?: ResearcherProfile;
  date: string;
  publishedDate?: string | null;
  readingTime: string;
  hero: ImageAsset;
  blocks: StoryBlock[];
}

export interface ResearcherProfileLink {
  href: string;
  label: string;
}

export interface ResearcherProfile {
  name?: string;
  role: string;
  organisation?: string;
  bio?: string;
  image?: string;
  imageAlt?: string;
  profileLink?: ResearcherProfileLink;
}

export interface ImageAsset {
  src: string;
  alt: string;
  caption?: string | null;
  credit?: string | null;
}

export interface VideoAsset {
  src: string;
  autoplay?: boolean;
  poster?: string;
  captions?: string | null;
  caption?: string | null;
  credit?: string | null;
}

export interface TextBlock {
  type: 'text';
  heading?: string;
  headingLevel?: 2 | 3;
  /** Trusted inline HTML is supported for links and emphasis. */
  paragraphs: string[];
}

export interface MediaTextBlock {
  type: 'media-text';
  eyebrow?: string;
  heading?: string;
  /** Trusted inline HTML is supported for links and emphasis. */
  paragraphs: string[];
  media: {
    type: 'image' | 'video';
    asset: ImageAsset | VideoAsset;
  };
  mediaSide?: 'left' | 'right';
}

export interface ImageBlock {
  type: 'image';
  heading?: string;
  image: ImageAsset;
  layout?: 'inline' | 'wide' | 'full' | 'portrait';
}

export interface VideoBlock {
  type: 'video';
  video: VideoAsset;
}

export interface CommitteeMemberCard {
  name: string;
  image?: string;
  href?: string;
  role?: string;
}

export interface CommitteeMembersBlock {
  type: 'committee-members';
  heading?: string;
  members: CommitteeMemberCard[];
}

export interface FlourishStoryBlock {
  type: 'flourish';
  embedType?: 'chart' | 'story' | 'visualisation';
  width?: 'wide' | 'prose';
  dataSrc: string;
  thumbnail?: string;
  alt?: string;
  caption?: string;
}

export interface ArcGISMapStoryBlock {
  type: 'arcgis-map';
  itemId: string;
  title?: string;
  caption?: string;
  height?: string;
  theme?: 'light' | 'dark';
  legendEnabled?: boolean;
  headingEnabled?: boolean;
  informationEnabled?: boolean;
  layout?: 'wide' | 'prose';
  wrapperClass?: string;
}

export interface ChartStoryBlock {
  type: 'chart';
  chart: string;
  data: string;
  title?: string;
  caption?: string;
}

export interface VoteMapStoryBlock {
  type: 'vote-map';
  title?: string;
  intro?: string;
  chamberSvg: string;
  voteData: string;
  seatData: string;
  membersData: string;
  caption?: string;
}

export interface LinkListItem {
  label: string;
  href: string;
  description?: string;
}

export interface LinkListBlock {
  type: 'link-list';
  eyebrow?: string;
  heading?: string;
  links: LinkListItem[];
}

export interface QuoteBlock {
  type: 'quote';
  text: string;
  attribution?: string;
}

export interface ScrollyStep {
  eyebrow?: string;
  title: string;
  body: string;
  image: ImageAsset;
}

export interface ScrollyBlock {
  type: 'scrolly';
  title: string;
  intro?: string;
  steps: ScrollyStep[];
}

export interface SceneScrollyAnnotation {
  label: string;
  x: number;
  y: number;
}

export interface SceneScrollyFocus {
  x: number;
  y: number;
  scale?: number;
}

export interface SceneScrollyStep {
  eyebrow?: string;
  title: string;
  body: string;
  image: ImageAsset;
  video?: VideoAsset;
  focus?: SceneScrollyFocus;
  overlayPosition?:
    | 'left-lower'
    | 'right-lower'
    | 'left-upper'
    | 'right-upper'
    | 'left-center'
    | 'right-center';
  placeLabel?: string;
  annotation?: SceneScrollyAnnotation;
}

export interface SceneScrollyBlock {
  type: 'scene-scrolly';
  title?: string;
  intro?: string;
  steps: SceneScrollyStep[];
}
