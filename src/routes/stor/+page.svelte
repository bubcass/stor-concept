<script lang="ts">
  let { data } = $props();

  const formatDate = (value: string | null | undefined) => {
    if (!value) return null;

    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) return value;

    return new Intl.DateTimeFormat('en-IE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(timestamp));
  };
</script>

<svelte:head>
  <title>Stór Pipeline Preview | Oireachtas Research Repository</title>
  <meta
    name="description"
    content="Preview canonical Stór documents backed by metadata and raw ProseMirror content."
  />
</svelte:head>

<script module lang="ts">
  import { base } from '$app/paths';
</script>

<section class="stor-preview">
  <header class="intro">
    <p class="eyebrow">Stór Pipeline</p>
    <h1>Canonical document preview</h1>
    <p>
      These entries are sourced from metadata-wrapped ProseMirror documents and
      rendered through the current Stór frontend adapter.
    </p>
  </header>

  <ul class="document-list">
    {#each data.documents as document}
      <li>
        <a href="{base}/articles/{document.slug}/">{document.title}</a>
        <p>{document.committeeName ?? document.section}</p>
        {#if formatDate(document.publishedDate)}
          <small>{formatDate(document.publishedDate)}</small>
        {/if}
      </li>
    {/each}
  </ul>
</section>

<style>
  .stor-preview {
    width: min(72rem, calc(100vw - 3rem));
    margin: 0 auto;
    padding: 3rem 0 4rem;
  }

  .intro {
    max-width: 42rem;
    margin-bottom: 2rem;
  }

  .eyebrow {
    margin: 0 0 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-size: 0.8rem;
    color: #6d2140;
  }

  h1 {
    margin: 0 0 0.75rem;
    font-size: clamp(2rem, 4vw, 3.4rem);
    line-height: 1.04;
  }

  .intro p:last-child {
    margin: 0;
    color: #44505d;
    font-size: 1.05rem;
    line-height: 1.7;
  }

  .document-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 1rem;
  }

  .document-list li {
    padding: 1.1rem 1.2rem;
    border: 1px solid rgba(15, 32, 48, 0.12);
    border-radius: 1rem;
    background: #fff;
  }

  .document-list a {
    color: #0f2030;
    font-size: 1.15rem;
    font-weight: 650;
    text-decoration: none;
  }

  .document-list p,
  .document-list small {
    margin: 0.4rem 0 0;
    color: #536170;
  }
</style>
