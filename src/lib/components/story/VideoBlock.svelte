<script lang="ts">
  import { base } from '$app/paths';
  import type { VideoBlock } from '$lib/content/types';
  import { autoplayWhileVisible } from './videoAutoplayViewport';
  import { shareVideoAsset } from './videoShare';

  let { block }: { block: VideoBlock } = $props();
  let shareFeedback = $state('');
  let videoSrc = $derived.by(() => {
    const src = block.video.src ?? '';
    if (/^(https?:|data:|blob:)/i.test(src)) {
      return src;
    }

    return `${base}${src}`;
  });
  let posterSrc = $derived.by(() => {
    const poster = block.video.poster;
    if (!poster) return undefined;
    if (/^(https?:|data:|blob:)/i.test(poster)) {
      return poster;
    }

    return `${base}${poster}`;
  });
  let captionsSrc = $derived.by(() => {
    const captions = block.video.captions;
    if (!captions) return undefined;
    if (/^(https?:|data:|blob:)/i.test(captions)) {
      return captions;
    }

    return `${base}${captions}`;
  });

  function clearFeedbackSoon() {
    window.setTimeout(() => {
      shareFeedback = '';
    }, 1800);
  }

  async function shareVideo() {
    const result = await shareVideoAsset({
      src: block.video.src,
      title: 'Stór video',
      text: block.video.caption ?? undefined
    });

    if (result === 'copied') {
      shareFeedback = 'Link copied';
      clearFeedbackSoon();
    }
  }
</script>

<section class="video-block story-flow" aria-label="Launch video">
  <h2>Watch the launch</h2>

  <figure class="video-figure">
    <video
      use:autoplayWhileVisible={{ enabled: block.video.autoplay ?? true }}
      autoplay={block.video.autoplay ?? true}
      controls
      controlslist="nodownload noremoteplayback"
      disablepictureinpicture
      disableremoteplayback
      loop
      muted
      playsinline
      preload="metadata"
      poster={posterSrc}
    >
      <source src={videoSrc} type="video/mp4" />
      {#if captionsSrc}
        <track
          kind="captions"
          label="English captions"
          srclang="en"
          src={captionsSrc}
          default
        />
      {/if}
    </video>
    <div class="video-actions">
      <button type="button" class="video-action" onclick={shareVideo}>
        Share video
      </button>
      {#if shareFeedback}
        <span class="video-feedback" role="status">{shareFeedback}</span>
      {/if}
    </div>
    {#if block.video.caption || block.video.credit}
      <figcaption class="caption">
        {block.video.caption}
        {#if block.video.credit}
          <span>{block.video.credit}</span>
        {/if}
      </figcaption>
    {/if}
  </figure>
</section>

<style>
  .video-block {
    margin: var(--block-space) auto;
    max-width: min(var(--wide), calc(100vw - (var(--gutter) * 2)));
  }

  h2 {
    color: var(--color-accent-2);
    font-family: var(--font-sans);
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-heading);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-4);
    scroll-margin-top: calc(var(--site-header-height, 3.25rem) + var(--space-5));
    text-wrap: pretty;
  }

  .video-figure {
    margin: 0;
  }

  video {
    aspect-ratio: 16 / 9;
    background: #111;
    border: 1px solid var(--color-line);
    width: 100%;
  }

  .video-actions {
    align-items: center;
    display: flex;
    gap: 0.75rem;
    margin-top: var(--space-3);
  }

  .video-action {
    background: transparent;
    border: 1px solid color-mix(in srgb, var(--color-line) 82%, transparent);
    border-radius: var(--radius);
    color: var(--color-accent-2);
    cursor: pointer;
    font: inherit;
    font-size: var(--font-size-small);
    font-weight: 600;
    line-height: 1;
    padding: 0.55rem 0.8rem;
  }

  .video-action:hover,
  .video-action:focus-visible {
    color: var(--link-hover);
  }

  .video-feedback {
    color: var(--color-muted);
    font-size: var(--font-size-small);
    font-weight: 500;
    line-height: var(--line-height-small);
    margin-top: 0;
  }

  .caption {
    margin-left: auto;
    margin-right: auto;
    max-width: var(--measure);
  }

  span {
    color: var(--color-faint);
    display: block;
    margin-top: 0.2rem;
  }

  @media (max-width: 620px) {
    .video-block {
      margin: 3.5rem auto;
    }
  }
</style>
