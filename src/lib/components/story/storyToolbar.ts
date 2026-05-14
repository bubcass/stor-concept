import type {
  ArcGISMapStoryBlock,
  ImageBlock,
  LinkListBlock,
  MediaTextBlock,
  QuoteBlock,
  SceneScrollyBlock,
  ScrollyBlock,
  StoryBlock,
  TextBlock
} from '$lib/content/types';

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function textBlockCopy(block: TextBlock) {
  return [block.heading, ...block.paragraphs].filter(Boolean).map((part) => stripHtml(part!)).join(' ');
}

function mediaTextCopy(block: MediaTextBlock) {
  return [block.eyebrow, block.heading, ...block.paragraphs]
    .filter(Boolean)
    .map((part) => stripHtml(part!))
    .join(' ');
}

function scrollyCopy(block: ScrollyBlock) {
  return [block.title, block.intro, ...block.steps.flatMap((step) => [step.eyebrow, step.title, step.body])]
    .filter(Boolean)
    .map((part) => stripHtml(part!))
    .join(' ');
}

function sceneScrollyCopy(block: SceneScrollyBlock) {
  return [block.title, block.intro, ...block.steps.flatMap((step) => [step.eyebrow, step.title, step.body])]
    .filter(Boolean)
    .map((part) => stripHtml(part!))
    .join(' ');
}

function quoteCopy(block: QuoteBlock) {
  return [block.text, block.attribution].filter(Boolean).map((part) => stripHtml(part!)).join(' ');
}

function linkListCopy(block: LinkListBlock) {
  return [block.eyebrow, block.heading, ...block.links.flatMap((link) => [link.label, link.description])]
    .filter(Boolean)
    .map((part) => stripHtml(part!))
    .join(' ');
}

function arcgisMapCopy(block: ArcGISMapStoryBlock) {
  return [block.title, block.caption].filter(Boolean).map((part) => stripHtml(part!)).join(' ');
}

function imageBlockCopy(block: ImageBlock) {
  return [block.heading, block.image.caption].filter(Boolean).map((part) => stripHtml(part!)).join(' ');
}

export function storyBlockCopy(block: StoryBlock) {
  switch (block.type) {
    case 'text':
      return textBlockCopy(block);
    case 'media-text':
      return mediaTextCopy(block);
    case 'quote':
      return quoteCopy(block);
    case 'scrolly':
      return scrollyCopy(block);
    case 'scene-scrolly':
      return sceneScrollyCopy(block);
    case 'link-list':
      return linkListCopy(block);
    case 'arcgis-map':
      return arcgisMapCopy(block);
    case 'image':
      return imageBlockCopy(block);
    default:
      return '';
  }
}

export function plainText(value: string) {
  return stripHtml(value);
}
