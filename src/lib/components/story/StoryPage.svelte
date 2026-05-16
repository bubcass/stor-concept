<script lang="ts">
  import { base } from '$app/paths';
  import { onDestroy, onMount } from 'svelte';
  import type { Story, StoryBlock } from '$lib/content/types';
  import BlockRenderer from './BlockRenderer.svelte';
  import StoryToolbar from './StoryToolbar.svelte';

  let { story }: { story: Story } = $props();
  let heroLayout = $derived(story.heroLayout ?? 'contained');
  let hasHeroMedia = $derived(Boolean(story.hero?.src?.trim()));
  let effectiveHeroLayout = $derived(hasHeroMedia ? heroLayout : 'contained');
  let heroImagePosition = $derived(story.heroImagePosition ?? 'center');
  let heroIsVideo = $derived((story.hero?.src ?? '').toLowerCase().endsWith('.mp4'));
  let storyFlourishWidth = $derived(story.flourishWidth ?? 'wide');
  let researcherInitials = $derived.by(() => {
    const source = story.researcher?.name ?? story.byline;
    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  });
  let researcherProfileLink = $derived.by(() => {
    const explicitLink = story.researcher?.profileLink;
    if (explicitLink) return explicitLink;

    const researcherName = story.researcher?.name?.trim();
    if (!researcherName) return null;

    return {
      href: `${base}/search/?q=${encodeURIComponent(researcherName)}`,
      label: `Browse work by ${researcherName}`
    };
  });

  type ContentsEntry = {
    id: string;
    label: string;
    blockIndex: number;
  };

  function headingForBlock(block: StoryBlock) {
    if (block.type === 'text') {
      return (block.headingLevel ?? 2) === 2 ? block.heading : undefined;
    }

    if (block.type === 'media-text' || block.type === 'image') {
      return block.heading;
    }

    return undefined;
  }

  function slugifyHeading(value: string) {
    return value
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'section';
  }

  let contentsEntries = $derived.by<ContentsEntry[]>(() => {
    if (!story.showContents) return [];

    const counts = new Map<string, number>();

    return story.blocks.flatMap((block, blockIndex) => {
      const heading = headingForBlock(block);
      if (!heading) return [];

      const baseId = slugifyHeading(heading);
      const count = counts.get(baseId) ?? 0;
      counts.set(baseId, count + 1);

      return [
        {
          id: count === 0 ? baseId : `${baseId}-${count + 1}`,
          label: heading,
          blockIndex
        }
      ];
    });
  });

  let contentsIdMap = $derived.by(() => {
    return new Map(contentsEntries.map((entry) => [entry.blockIndex, entry.id]));
  });

  let showContentsRail = $derived(story.showContents && contentsEntries.length > 1);
  let activeContentsId = $state<string | null>(null);
  let showBackToTop = $state(false);
  let teardownContentsObserver: (() => void) | null = null;
  let teardownScrollListener: (() => void) | null = null;

  function setupContentsObserver() {
    teardownContentsObserver?.();
    teardownContentsObserver = null;

    if (!showContentsRail || typeof window === 'undefined' || typeof document === 'undefined') {
      activeContentsId = null;
      return;
    }

    const headingElements = contentsEntries
      .map((entry) => ({
        id: entry.id,
        element: document.getElementById(entry.id)
      }))
      .filter((entry): entry is { id: string; element: HTMLElement } => Boolean(entry.element));

    if (!headingElements.length) {
      activeContentsId = null;
      return;
    }

    activeContentsId = headingElements[0].id;

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id;

          if (entry.isIntersecting) {
            visible.set(id, entry.boundingClientRect.top);
          } else {
            visible.delete(id);
          }
        }

        if (visible.size > 0) {
          const nextId = [...visible.entries()].sort((a, b) => a[1] - b[1])[0]?.[0];
          activeContentsId = nextId ?? activeContentsId;
          return;
        }

        const threshold = window.innerHeight * 0.3;
        let fallbackId = headingElements[0].id;

        for (const heading of headingElements) {
          if (heading.element.getBoundingClientRect().top <= threshold) {
            fallbackId = heading.id;
          } else {
            break;
          }
        }

        activeContentsId = fallbackId;
      },
      {
        root: null,
        rootMargin: `-${Math.round(window.innerHeight * 0.2)}px 0px -55% 0px`,
        threshold: [0, 0.1, 0.25, 0.5, 1]
      }
    );

    for (const heading of headingElements) {
      observer.observe(heading.element);
    }

    teardownContentsObserver = () => {
      observer.disconnect();
      visible.clear();
    };
  }

  function scrollToTop() {
    if (typeof window === 'undefined') return;

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  function setupBackToTopObserver() {
    teardownScrollListener?.();
    teardownScrollListener = null;

    if (typeof window === 'undefined') {
      showBackToTop = false;
      return;
    }

    const toggleVisibility = () => {
      showBackToTop = window.scrollY > 640;
    };

    toggleVisibility();
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    teardownScrollListener = () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }

  onMount(() => {
    setupContentsObserver();
    setupBackToTopObserver();
  });

  $effect(() => {
    showContentsRail;
    contentsEntries;

    if (typeof window === 'undefined') return;

    queueMicrotask(() => {
      setupContentsObserver();
    });
  });

  onDestroy(() => {
    teardownContentsObserver?.();
    teardownScrollListener?.();
  });
</script>

<article class="story">
  <header class={`story-hero ${effectiveHeroLayout}`} class:no-hero={!hasHeroMedia}>
    {#if effectiveHeroLayout === 'immersive'}
      <figure class="hero-media">
        {#if heroIsVideo}
          <video autoplay muted loop playsinline aria-label={story.hero.alt}>
            <source src="{base}{story.hero.src}" type="video/mp4" />
          </video>
        {:else}
          <img
            src="{base}{story.hero.src}"
            alt={story.hero.alt}
            fetchpriority="high"
            style:object-position={heroImagePosition}
          />
        {/if}
        <div class="hero-overlay">
          {#if story.eyebrow}
            <p class="eyebrow">{story.eyebrow}</p>
          {/if}
          <h1>{story.title}</h1>
          <p class="lede overlay-dek">{@html story.dek}</p>
          <div class="meta overlay-meta" aria-label="Article details">
            <span>{story.date}</span>
            <span>{story.readingTime}</span>
          </div>
        </div>
      </figure>

      <div class="mobile-immersive-copy">
        <p class="lede">{@html story.dek}</p>
        <div class="meta" aria-label="Article details">
          <span>{story.date}</span>
          <span>{story.readingTime}</span>
        </div>
      </div>

      {#if story.hero.caption || story.hero.credit}
        <p class="caption immersive-caption">
          {story.hero.caption}
          {#if story.hero.credit}
            <span>{story.hero.credit}</span>
          {/if}
        </p>
      {/if}
    {:else}
      <div class="hero-copy">
        {#if story.eyebrow}
          <p class="eyebrow">{story.eyebrow}</p>
        {/if}
        <h1>{story.title}</h1>
        <p class="lede">{@html story.dek}</p>
        <div class="meta" aria-label="Article details">
          <span>{story.date}</span>
          <span>{story.readingTime}</span>
        </div>
      </div>

      {#if hasHeroMedia}
        <figure class="hero-media">
          {#if heroIsVideo}
            <video autoplay muted loop playsinline aria-label={story.hero.alt}>
              <source src="{base}{story.hero.src}" type="video/mp4" />
            </video>
          {:else}
            <img
              src="{base}{story.hero.src}"
              alt={story.hero.alt}
              fetchpriority="high"
              style:object-position={heroImagePosition}
            />
          {/if}
          {#if story.hero.caption || story.hero.credit}
            <figcaption class="caption">
              {story.hero.caption}
              {#if story.hero.credit}
                <span>{story.hero.credit}</span>
              {/if}
            </figcaption>
          {/if}
        </figure>
      {/if}
    {/if}
  </header>

  <StoryToolbar {story} />

  {#if story.researcher || story.abstract}
    <section class="story-intro" aria-label="Article introduction">
      {#if story.researcher}
        <div class="story-researcher" aria-label="Researcher information">
          <div class="researcher-shell">
            {#if story.researcher.image}
              <img
                class="researcher-avatar"
                src="{base}{story.researcher.image}"
                alt={story.researcher.imageAlt ?? `${story.researcher.name ?? story.byline} portrait`}
                loading="lazy"
              />
            {:else}
              <div class="researcher-avatar researcher-avatar--fallback" aria-hidden="true">
                <span>{researcherInitials}</span>
              </div>
            {/if}

            <div class="researcher-copy">
              {#if researcherProfileLink}
                <p class="researcher-name">
                  <a class="researcher-name-link" href={researcherProfileLink.href}>
                    {story.researcher.name ?? story.byline}
                  </a>
                </p>
              {:else}
                <p class="researcher-name">{story.researcher.name ?? story.byline}</p>
              {/if}
              {#if story.researcher.role || story.researcher.organisation}
                <p class="researcher-roleline">
                  {#if story.researcher.role}
                    {story.researcher.role}
                  {/if}
                  {#if story.researcher.organisation}
                    <span>{story.researcher.organisation}</span>
                  {/if}
                </p>
              {/if}
              {#if story.researcher.bio}
                <p class="researcher-bio">{story.researcher.bio}</p>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      {#if story.abstract}
        <div class="story-abstract" aria-label="Summary">
          <p>{@html story.abstract}</p>
        </div>
      {/if}
    </section>
  {/if}

  <div class="story-content" class:with-contents={showContentsRail}>
    {#if showContentsRail}
      <aside class="story-contents" aria-label="Table of contents">
        <p class="story-contents-label">Contents</p>
        <nav class="story-contents-nav">
          {#each contentsEntries as entry}
            <a
              class="story-contents-link"
              class:is-active={activeContentsId === entry.id}
              href={`#${entry.id}`}
              aria-current={activeContentsId === entry.id ? 'location' : undefined}
            >
              {entry.label}
            </a>
          {/each}
        </nav>
      </aside>
    {/if}

    <div class="story-body">
      {#each story.blocks as block, index}
        <BlockRenderer
          {block}
          headingId={contentsIdMap.get(index)}
          flourishWidth={storyFlourishWidth}
        />
      {/each}
    </div>
  </div>

  {#if showBackToTop}
    <button class="back-to-top" type="button" onclick={scrollToTop} aria-label="Back to top">
      <span class="back-to-top-chevron" aria-hidden="true">⌃</span>
    </button>
  {/if}
</article>

<style>
  .story {
    overflow: clip;
    --site-header-height: 3.25rem;
  }

  .story-hero.split {
    align-items: stretch;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    margin: 0 calc(50% - 50vw);
    max-width: none;
    min-height: max(42rem, calc(100svh - var(--site-header-height)));
    padding: 0;
  }

  .hero-copy {
    max-width: var(--measure-prose);
    width: 100%;
  }

  .story-hero.split .hero-copy {
    align-self: stretch;
    display: flex;
    flex-direction: column;
    justify-content: center;
    justify-self: end;
    padding: clamp(var(--space-7), 7vw, 5rem) clamp(var(--space-6), 5vw, var(--space-8)) clamp(var(--space-7), 7vw, 5rem) var(--gutter);
  }

  .story-hero.contained {
    margin: 0 auto;
    max-width: calc(var(--measure-hero) + (var(--gutter) * 2));
    padding: clamp(var(--space-7), 7vw, 5rem) var(--gutter) var(--space-5);
  }

  .story-hero.contained .hero-copy {
    max-width: var(--measure-hero);
    padding: 0;
  }

  .story-hero.no-hero {
    min-height: 0;
  }

  .story-hero.contained.no-hero {
    padding-bottom: clamp(var(--space-6), 5vw, var(--space-7));
  }

  .story-hero.no-hero .hero-copy {
    max-width: var(--measure-prose);
  }

  .story-hero.contained h1,
  .story-hero.contained .lede,
  .story-hero.contained .meta {
    max-width: 100%;
  }

  h1 {
    color: var(--color-accent-2);
    font-family: var(--font-sans);
    font-size: var(--font-size-h1);
    font-weight: var(--font-weight-heading);
    letter-spacing: 0;
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-stack);
    text-wrap: pretty;
  }

  .lede {
    font-family: var(--font-sans);
    font-size: var(--font-size-body);
    line-height: var(--line-height-body);
    margin: 0;
    max-width: var(--measure-card);
    white-space: pre-line;
  }

  .lede :global(a) {
    color: inherit;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 0.16em;
  }

  .lede :global(em) {
    font-style: italic;
  }

  .lede :global(strong) {
    color: var(--color-accent-2);
    font-weight: 600;
  }

  .meta {
    color: var(--color-muted);
    display: flex;
    flex-wrap: wrap;
    font-size: var(--font-size-small);
    font-weight: 500;
    gap: 0.35rem 0.65rem;
    letter-spacing: 0;
    line-height: var(--line-height-small);
    margin: var(--space-5) 0 0;
    max-width: var(--measure-card);
  }

  .meta span:not(:last-child)::after {
    color: var(--color-faint);
    content: "/";
    margin-left: 0.65rem;
  }

  .story-intro {
    margin: 0 auto;
    max-width: calc(var(--measure-prose) + (var(--gutter) * 2));
    padding-top: var(--space-5);
    padding-bottom: clamp(var(--space-6), 5vw, var(--space-8));
  }

  .story-researcher {
    margin: 0 auto;
    max-width: calc(var(--measure-prose) + (var(--gutter) * 2));
    padding: 0 var(--gutter);
  }

  .researcher-shell {
    border-top: 1px solid color-mix(in srgb, var(--color-line) 72%, transparent);
    display: grid;
    gap: var(--space-4);
    grid-template-columns: auto minmax(0, 1fr);
    max-width: 42rem;
    padding-top: var(--space-4);
  }

  .researcher-avatar {
    background: var(--color-soft);
    border: 1px solid color-mix(in srgb, var(--color-line) 78%, transparent);
    border-radius: 999px;
    height: 4.25rem;
    min-height: 4.25rem;
    min-width: 4.25rem;
    object-fit: cover;
    width: 4.25rem;
  }

  .researcher-avatar--fallback {
    align-items: center;
    color: var(--color-accent-2);
    display: flex;
    font-family: var(--font-sans);
    font-size: 1rem;
    font-weight: 700;
    justify-content: center;
  }

  .researcher-copy {
    min-width: 0;
  }

  .researcher-name,
  .researcher-roleline,
  .researcher-bio {
    margin: 0;
  }

  .researcher-name {
    color: var(--color-accent-2);
    font-family: var(--font-sans);
    font-size: clamp(1.15rem, 1.4vw, 1.35rem);
    font-weight: 700;
    line-height: 1.2;
  }

  .researcher-name-link {
    color: inherit;
    text-decoration: none;
  }

  .researcher-name-link:hover,
  .researcher-name-link:focus-visible {
    color: var(--link-hover);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 0.16em;
  }

  .researcher-roleline {
    color: var(--color-muted);
    font-family: var(--font-sans);
    font-size: 1rem;
    line-height: 1.45;
    margin-top: 0.3rem;
  }

  .researcher-roleline span::before {
    color: var(--color-faint);
    content: "|";
    margin: 0 0.45rem;
  }

  .researcher-bio {
    color: var(--color-muted);
    font-family: var(--font-sans);
    font-size: 0.98rem;
    line-height: 1.6;
    margin-top: 0.7rem;
    max-width: 36rem;
  }

  .story-abstract {
    margin: var(--space-5) auto 0;
    max-width: calc(var(--measure-prose) + (var(--gutter) * 2));
    padding: 0 var(--gutter);
  }

  .story-abstract p {
    background: color-mix(in srgb, var(--color-soft) 72%, transparent);
    border-left: 3px solid color-mix(in srgb, var(--color-accent) 45%, transparent);
    color: var(--color-accent-2);
    font-family: var(--font-sans);
    font-size: 1.02rem;
    line-height: 1.7;
    margin: 0;
    max-width: 40rem;
    padding: var(--space-4) var(--space-5);
  }

  .story-abstract p :global(strong) {
    font-weight: 700;
  }

  .hero-media {
    margin: 0;
    min-width: 0;
  }

  .story-hero.split .hero-media {
    align-self: stretch;
    display: flex;
    flex-direction: column;
    grid-column: 2;
  }

  img,
  video {
    background: var(--color-soft);
    flex: 1;
    height: 100%;
    min-height: 30rem;
    object-fit: cover;
    width: 100%;
  }

  .story-hero.contained .hero-media {
    margin-top: var(--space-6);
  }

  .story-hero.contained img,
  .story-hero.contained video {
    aspect-ratio: 16 / 10;
    display: block;
    flex: none;
    height: auto;
    min-height: 0;
  }

  figcaption {
    margin-left: 0;
    padding-right: var(--gutter);
  }

  figcaption span,
  .immersive-caption span {
    color: var(--color-faint);
    display: block;
    margin-top: 0.2rem;
  }

  .story-hero.immersive {
    margin: 0 calc(50% - 50vw);
    max-width: none;
    padding: 0;
  }

  .story-hero.immersive .hero-media {
    min-height: max(42rem, calc(100svh - var(--site-header-height)));
    position: relative;
  }

  .story-hero.immersive .hero-media::after {
    background: linear-gradient(
      180deg,
      rgb(0 0 0 / 0.08) 0%,
      rgb(0 0 0 / 0.04) 45%,
      rgb(0 0 0 / 0.52) 100%
    );
    content: '';
    inset: 0;
    pointer-events: none;
    position: absolute;
  }

  .story-hero.immersive img,
  .story-hero.immersive video {
    display: block;
    height: max(42rem, calc(100svh - var(--site-header-height)));
    min-height: 0;
  }

  .hero-overlay {
    bottom: clamp(var(--space-7), 8vh, 5rem);
    color: var(--color-paper);
    left: max(var(--gutter), calc((100vw - var(--wide)) / 2 + var(--gutter)));
    max-width: min(34rem, calc(100vw - (var(--gutter) * 2)));
    position: absolute;
    z-index: 1;
  }

  .story-hero.immersive .overlay-dek,
  .story-hero.immersive .overlay-meta {
    backdrop-filter: blur(10px);
    background: linear-gradient(
      180deg,
      rgba(24, 21, 18, 0.62),
      rgba(24, 21, 18, 0.46)
    );
    border: 1px solid rgba(255, 253, 248, 0.14);
    border-radius: 0.5rem;
    box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.14);
    padding: var(--space-3) var(--space-4);
  }

  .story-hero.immersive h1,
  .story-hero.immersive .lede,
  .story-hero.immersive .meta,
  .story-hero.immersive .eyebrow {
    color: var(--color-paper);
  }

  .story-hero.immersive h1 {
    max-width: 12ch;
  }

  .story-hero.immersive .lede {
    margin-top: var(--space-3);
    max-width: 32rem;
  }

  .story-hero.immersive .meta span:not(:last-child)::after {
    color: rgb(255 255 255 / 0.58);
  }

  .story-hero.immersive .overlay-meta {
    margin-top: var(--space-3);
  }

  .story-hero.immersive .immersive-caption {
    margin: var(--space-2) auto 0;
    max-width: var(--measure);
    padding: 0 var(--gutter);
  }

  .mobile-immersive-copy {
    display: none;
  }

  .story-body {
    min-width: 0;
    width: 100%;
  }

  .story-hero.split + .story-body,
  .story-hero.immersive + .story-body {
    padding-top: 0;
  }

  .story-body > :global(:first-child) {
    margin-top: 0;
  }

  .story-content {
    margin: 0 auto;
    max-width: calc(var(--wide) + (var(--gutter) * 2));
    padding: 0 var(--gutter) var(--space-8);
  }

  .back-to-top {
    align-items: center;
    background: var(--color-paper);
    border: 4px solid color-mix(in srgb, var(--color-accent) 72%, white 28%);
    border-radius: 999px;
    bottom: max(var(--space-4), env(safe-area-inset-bottom));
    box-shadow: 0 0.35rem 1rem rgb(17 15 13 / 0.12);
    color: var(--color-accent-2);
    cursor: pointer;
    display: grid;
    height: 2.7rem;
    padding: 0;
    position: fixed;
    right: max(var(--space-4), env(safe-area-inset-right));
    place-items: center;
    transition: box-shadow 160ms ease, transform 160ms ease;
    width: 2.7rem;
    z-index: 30;
  }

  .back-to-top:hover,
  .back-to-top:focus-visible {
    box-shadow: 0 0.6rem 1.2rem rgb(17 15 13 / 0.16);
    transform: translateY(-1px);
  }

  .back-to-top-chevron {
    font-family: var(--font-sans);
    font-size: 1.2rem;
    font-weight: 500;
    line-height: 1;
    transform: translateY(0.02em);
  }

  .story-content.with-contents {
    align-items: start;
    display: grid;
    gap: clamp(var(--space-6), 5vw, var(--space-8));
    grid-template-columns: minmax(14rem, 18rem) minmax(0, 1fr);
  }

  .story-contents {
    max-height: calc(100svh - var(--site-header-height) - (var(--space-5) * 2));
    overflow-y: auto;
    position: sticky;
    scrollbar-gutter: stable;
    top: calc(var(--site-header-height) + var(--space-5));
  }

  .story-contents-label {
    color: var(--color-accent-2);
    font-family: var(--font-sans);
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    line-height: var(--line-height-small);
    margin: 0 0 var(--space-3);
    text-transform: uppercase;
  }

  .story-contents-nav {
    border-top: 1px solid color-mix(in srgb, var(--color-line) 76%, transparent);
    display: grid;
  }

  .story-contents-link {
    border-bottom: 1px solid color-mix(in srgb, var(--color-line) 68%, transparent);
    color: var(--color-accent-2);
    font-family: var(--font-sans);
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.35;
    padding: 1rem 0;
    text-decoration: none;
  }

  .story-contents-link:hover,
  .story-contents-link:focus-visible {
    color: var(--link-hover);
    text-decoration: none;
  }

  .story-contents-link.is-active {
    color: var(--link-hover);
    padding-left: 0.7rem;
    position: relative;
  }

  .story-contents-link.is-active::before {
    background: var(--color-accent);
    border-radius: 999px;
    content: '';
    height: 1.1rem;
    left: 0;
    position: absolute;
    top: 1rem;
    width: 0.18rem;
  }

  @media (max-width: 860px) {
    .story-hero.split,
    .story-hero.contained {
      display: block;
      min-height: 0;
      padding-top: 3rem;
    }

    .story-hero.split {
      margin: 0;
    }

    .story-hero.contained {
      padding-bottom: var(--space-4);
    }

    h1 {
      font-size: clamp(2rem, 9vw, 2.85rem);
    }

    .story-hero.split .hero-copy {
      padding: 0 var(--gutter) var(--space-6);
    }

    .story-hero.split .hero-media {
      margin-top: 0;
    }

    .story-hero.contained .hero-media {
      margin-top: var(--space-5);
    }

    .story-hero.split img,
    .story-hero.split video,
    .story-hero.contained img,
    .story-hero.contained video {
      aspect-ratio: 4 / 3;
      height: auto;
      min-height: 0;
    }

    figcaption {
      padding: 0 var(--gutter);
    }

    .story-hero.immersive .hero-media {
      min-height: 0;
    }

    .story-hero.immersive .hero-media::after {
      background: linear-gradient(180deg, rgb(0 0 0 / 0.05) 0%, rgb(0 0 0 / 0.5) 100%);
    }

    .story-hero.immersive img,
    .story-hero.immersive video {
      aspect-ratio: 4 / 5;
      height: auto;
      min-height: 27rem;
    }

    .hero-overlay {
      bottom: var(--space-5);
      left: var(--gutter);
    }

    .story-hero.immersive .overlay-dek,
    .story-hero.immersive .overlay-meta {
      display: none;
    }

    .story-hero.immersive h1 {
      font-size: clamp(2rem, 9vw, 2.85rem);
      max-width: 11ch;
    }

    .mobile-immersive-copy {
      display: block;
      margin: 0 auto;
      max-width: calc(var(--measure) + (var(--gutter) * 2));
      padding: var(--space-5) var(--gutter) 0;
    }

    .story-hero.immersive .mobile-immersive-copy .lede {
      color: var(--color-muted);
    }

    .story-hero.immersive .mobile-immersive-copy .meta {
      color: var(--color-muted);
    }

    .story-hero.immersive .mobile-immersive-copy .meta span:not(:last-child)::after {
      color: var(--color-faint);
    }

    .story-intro {
      padding-bottom: var(--space-6);
    }

    .story-content {
      padding-bottom: var(--space-7);
    }

    .back-to-top {
      bottom: max(var(--space-3), env(safe-area-inset-bottom));
      height: 2.4rem;
      right: max(var(--space-3), env(safe-area-inset-right));
      width: 2.4rem;
    }

    .back-to-top-chevron {
      font-size: 1.08rem;
    }

    .story-content.with-contents {
      grid-template-columns: minmax(0, 1fr);
    }

    .story-contents {
      position: static;
    }

    .researcher-shell {
      grid-template-columns: minmax(0, 1fr);
    }

    .researcher-avatar {
      height: 3.75rem;
      min-height: 3.75rem;
      min-width: 3.75rem;
      width: 3.75rem;
    }

    .story-abstract p {
      padding: var(--space-4);
    }
  }
</style>
