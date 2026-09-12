<script lang="ts">
  import type { StoryBlock } from '$lib/content/types';
  import ArcGISMapBlock from './blocks/ArcGISMapBlock.svelte';
  import ChartBlock from './blocks/ChartBlock.svelte';
  import CommitteeMembersBlock from './CommitteeMembersBlock.svelte';
  import FlourishBlock from './blocks/FlourishBlock.svelte';
  import ObservableBlock from './blocks/ObservableBlock.svelte';
  import VoteMapBlock from './blocks/VoteMapBlock.svelte';
  import ImageBlock from './ImageBlock.svelte';
  import LinkListBlock from './LinkListBlock.svelte';
  import MediaTextBlock from './MediaTextBlock.svelte';
  import QuoteBlock from './QuoteBlock.svelte';
  import ScrollyBlock from './ScrollyBlock.svelte';
  import SceneScrollyBlock from './SceneScrollyBlock.svelte';
  import TextBlock from './TextBlock.svelte';
  import TableBlock from './TableBlock.svelte';
  import VideoBlock from './VideoBlock.svelte';

  let {
    block,
    headingId,
    flourishWidth,
    hideMedia = false
  }: {
    block: StoryBlock;
    headingId?: string;
    flourishWidth?: 'wide' | 'prose';
    hideMedia?: boolean;
  } = $props();
</script>

{#if block.type === 'text'}
  <TextBlock {block} {headingId} />
{:else if block.type === 'table'}
  <TableBlock {block} />
{:else if block.type === 'chart'}
  {#if !hideMedia}
    <ChartBlock {block} />
  {/if}
{:else if block.type === 'flourish'}
  {#if !hideMedia}
    <FlourishBlock {block} {flourishWidth} />
  {/if}
{:else if block.type === 'observable'}
  {#if !hideMedia}
    <ObservableBlock {block} {flourishWidth} />
  {/if}
{:else if block.type === 'arcgis-map'}
  {#if !hideMedia}
    <ArcGISMapBlock {block} />
  {/if}
{:else if block.type === 'vote-map'}
  {#if !hideMedia}
    <VoteMapBlock {block} />
  {/if}
{:else if block.type === 'media-text'}
  <MediaTextBlock {block} {headingId} {hideMedia} />
{:else if block.type === 'image'}
  {#if !hideMedia}
    <ImageBlock {block} {headingId} />
  {/if}
{:else if block.type === 'video'}
  {#if !hideMedia}
    <VideoBlock {block} />
  {/if}
{:else if block.type === 'committee-members'}
  <CommitteeMembersBlock {block} />
{:else if block.type === 'link-list'}
  <LinkListBlock {block} />
{:else if block.type === 'quote'}
  <QuoteBlock {block} />
{:else if block.type === 'scrolly'}
  {#if !hideMedia}
    <ScrollyBlock {block} />
  {/if}
{:else if block.type === 'scene-scrolly'}
  {#if !hideMedia}
    <SceneScrollyBlock {block} />
  {/if}
{/if}
