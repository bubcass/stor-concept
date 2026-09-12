<script lang="ts">
  import { base } from '$app/paths';
  import type { Story } from '$lib/content/types';

  let { story }: { story: Story } = $props();
  const authors = $derived((story.authors?.filter((author) => author.name?.trim()).slice(0, 3) ?? []).length
    ? story.authors!.filter((author) => author.name?.trim()).slice(0, 3)
    : (story.researcher?.name || story.byline ? [{ ...story.researcher, name: story.researcher?.name ?? story.byline }] : []));
  const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
  const imageSrc = (image = '') => image && !/^(?:https?:|data:)/i.test(image) ? `${base}${image.startsWith('/') ? image : `/${image}`}` : image;
</script>

{#if authors.length}
  <section class="story-authors" aria-label={authors.length === 1 ? 'Article author' : 'Article authors'}>
    {#each authors as author}
      {@const name = author.name?.trim() ?? ''}
      <div class="story-author">
        <div class="story-author__avatar" aria-hidden={author.image ? undefined : 'true'}>
          {#if author.image}
            <img src={imageSrc(author.image)} alt={author.imageAlt ?? `${name}, article author`} />
          {:else}
            <span>{initials(name)}</span>
          {/if}
        </div>
        <div><p class="story-author__name">{name}</p>{#if author.role || author.organisation}<p class="story-author__description">{#if author.role}<span>{author.role}</span>{/if}{#if author.organisation}<span class="story-author__organisation">{author.organisation}</span>{/if}</p>{/if}</div>
      </div>
    {/each}
  </section>
{/if}

<style>
  .story-authors { border-top: 1px solid color-mix(in srgb, var(--color-line) 72%, transparent); display: grid; gap: var(--space-4) var(--space-5); grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr)); margin: 0 auto; max-width: 42rem; padding-top: var(--space-4); }
  .story-author { align-items: center; display: flex; gap: var(--space-3); min-width: 0; }
  .story-author__avatar { align-items: center; background: var(--color-soft); border: 1px solid var(--color-line); border-radius: 50%; color: var(--color-accent-2); display: flex; flex: 0 0 3rem; font-family: var(--font-sans); font-size: .78rem; font-weight: 700; height: 3rem; justify-content: center; overflow: hidden; width: 3rem; }
  .story-author__avatar img { height: 100%; object-fit: cover; width: 100%; }
  .story-author__name, .story-author__description { font-family: var(--font-sans); margin: 0; }
  .story-author__name { color: var(--color-accent-2); font-size: .98rem; font-weight: 700; }
  .story-author__description { color: var(--color-muted); font-size: .82rem; margin-top: .18rem; }
  .story-author__organisation::before { color: var(--color-faint); content: '|'; margin: 0 .45rem; }
  @media (max-width: 860px) { .story-authors { gap: var(--space-3) .75rem; grid-template-columns: repeat(2, minmax(0, 1fr)); } .story-author { gap: .65rem; } .story-author__avatar { flex-basis: 2.65rem; height: 2.65rem; width: 2.65rem; } .story-author__name { font-size: .92rem; } .story-author__description { font-size: .76rem; white-space: nowrap; } .story-author__organisation { display: none; } }
</style>
