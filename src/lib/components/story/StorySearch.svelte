<script lang="ts">
  import { base } from "$app/paths";

  let {
    query = "",
    label = "Search articles",
    placeholder = "Search by title or author",
    action = `${base}/search/`,
    section,
  }: {
    query?: string;
    label?: string;
    placeholder?: string;
    action?: string;
    section?: string;
  } = $props();
</script>

<form class="story-search" method="GET" action={action}>
  <label class="story-search__label" for="story-search-input">{label}</label>
  <div class="story-search__field">
    <input
      id="story-search-input"
      value={query}
      name="q"
      class="story-search__input"
      type="search"
      autocomplete="off"
      spellcheck="false"
      placeholder={placeholder}
    />
  </div>
  {#if section}
    <input type="hidden" name="section" value={section} />
  {/if}
</form>

<style>
  .story-search {
    max-width: 100%;
  }

  .story-search__label {
    color: var(--color-accent);
    display: block;
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-meta);
    letter-spacing: 0.11em;
    line-height: var(--line-height-small);
    margin-bottom: var(--space-2);
    text-transform: uppercase;
  }

  .story-search__field {
    position: relative;
  }

  .story-search__input {
    appearance: none;
    background: color-mix(in srgb, var(--color-panel) 84%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-line) 78%, transparent);
    border-radius: 1rem;
    color: var(--color-accent-2);
    font: inherit;
    font-size: 1rem;
    line-height: 1.2;
    padding: 0.95rem 1.2rem;
    width: 100%;
  }

  .story-search__input::placeholder {
    color: var(--color-faint);
  }

  .story-search__input:focus-visible {
    border-color: var(--color-focus);
    outline: 2px solid color-mix(in srgb, var(--color-focus) 26%, transparent);
    outline-offset: 2px;
  }
</style>
