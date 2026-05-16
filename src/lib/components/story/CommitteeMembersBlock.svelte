<script lang="ts">
  import type { CommitteeMembersBlock } from '$lib/content/types';

  let { block }: { block: CommitteeMembersBlock } = $props();

  function initialsFor(name: string) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }
</script>

<section class="committee-members story-flow" aria-label={block.heading ?? 'Committee members'}>
  {#if block.heading}
    <h2>{block.heading}</h2>
  {/if}

  <div class="member-grid">
    {#each block.members as member}
      {#if member.href}
        <a class="member-card" href={member.href}>
          {#if member.image}
            <div class="member-avatar-shell" aria-hidden="true">
              <img class="member-avatar" src={member.image} alt={member.name} loading="lazy" />
            </div>
          {:else}
            <div class="member-avatar-shell member-avatar--fallback" aria-hidden="true">
              <span>{initialsFor(member.name)}</span>
            </div>
          {/if}
          <p class="member-name">{member.name}</p>
        </a>
      {:else}
        <div class="member-card">
          {#if member.image}
            <div class="member-avatar-shell" aria-hidden="true">
              <img class="member-avatar" src={member.image} alt={member.name} loading="lazy" />
            </div>
          {:else}
            <div class="member-avatar-shell member-avatar--fallback" aria-hidden="true">
              <span>{initialsFor(member.name)}</span>
            </div>
          {/if}
          <p class="member-name">{member.name}</p>
        </div>
      {/if}
    {/each}
  </div>
</section>

<style>
  .committee-members {
    margin: var(--block-space) auto;
    max-width: min(var(--wide), calc(100vw - (var(--gutter) * 2)));
  }

  h2 {
    color: var(--color-accent-2);
    font-family: var(--font-sans);
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-heading);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-5);
    text-wrap: pretty;
  }

  .member-grid {
    display: grid;
    gap: var(--space-2) var(--space-3);
    grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
  }

  .member-card {
    align-items: center;
    color: inherit;
    display: grid;
    gap: 0.65rem;
    justify-items: center;
    padding: 0.5rem 0.35rem;
    text-align: center;
    text-decoration: none;
  }

  .member-card:hover .member-name,
  .member-card:focus-visible .member-name {
    color: var(--link-hover);
  }

  .member-avatar-shell {
    align-items: center;
    background: var(--color-soft);
    border: 1px solid color-mix(in srgb, var(--color-line) 78%, transparent);
    border-radius: 999px;
    display: flex;
    height: 4.5rem;
    justify-content: center;
    overflow: hidden;
    width: 4.5rem;
  }

  .member-avatar {
    display: block;
    height: 100%;
    max-width: none;
    object-fit: cover;
    object-position: center 18%;
    width: 100%;
  }

  .member-avatar--fallback {
    color: var(--color-accent-2);
    font-family: var(--font-sans);
    font-size: 1rem;
    font-weight: 700;
  }

  .member-name {
    color: var(--color-accent-2);
    font-family: var(--font-sans);
    font-size: 0.92rem;
    font-weight: 700;
    line-height: 1.2;
    margin: 0;
    text-wrap: balance;
  }

  @media (max-width: 620px) {
    .committee-members {
      margin: 3.5rem auto;
    }

    .member-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--space-2);
    }

    .member-avatar-shell {
      height: 4rem;
      width: 4rem;
    }
  }
</style>
