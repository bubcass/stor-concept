<script lang="ts">
  import StoryPage from '$lib/components/story/StoryPage.svelte';
  import { proseMirrorFromHtml } from '$lib/publisher/prosemirrorFromHtml';
  import { storDocumentToStory } from '$lib/content/stor/toStory';
  import {
    COMMITTEE_OPTIONS,
    DESTINATION_OPTIONS,
    STATUS_OPTIONS,
    TYPE_OPTIONS,
  } from '$lib/publisher/metadata';
  import { suggestedStorDocumentPath } from '$lib/publisher/paths';
  import type {
    ProseMirrorDocument,
    StorContributor,
    StorDestination,
    StorDocument,
  } from '$lib/content/stor/types';

  type PublisherState = {
    destination: StorDestination;
    type: StorDocument['type'];
    featured: boolean;
    heroLayout: NonNullable<StorDocument['heroLayout']>;
    showContents: boolean;
    flourishWidth: NonNullable<StorDocument['flourishWidth']>;
    title: string;
    dek: string;
    eyebrow: string;
    byline: string;
    abstract: string;
    committeeName: string;
    publishedDate: string;
    status: NonNullable<StorDocument['status']>;
    topics: string;
    researcherName: string;
    researcherRole: string;
    researcherOrganisation: string;
    researcherBio: string;
    researcherImage: string;
    heroSrc: string;
    heroAlt: string;
    heroPosition: string;
    launchVideoSrc: string;
    launchVideoPoster: string;
    launchVideoCaption: string;
    launchVideoCredit: string;
    slug: string;
  };

  const defaultState: PublisherState = {
    destination: 'committee-reports',
    type: 'committee-report',
    featured: false,
    heroLayout: 'contained',
    showContents: true,
    flourishWidth: 'prose',
    title: '',
    dek: '',
    eyebrow: '',
    byline: '',
    abstract: '',
    committeeName: '',
    publishedDate: new Date().toISOString().slice(0, 10),
    status: 'draft',
    topics: '',
    researcherName: '',
    researcherRole: '',
    researcherOrganisation: '',
    researcherBio: '',
    researcherImage: '',
    heroSrc: '/media/committee-members-speak-at-a-report-launch.jpg',
    heroAlt: '',
    heroPosition: 'left center',
    launchVideoSrc: '',
    launchVideoPoster: '',
    launchVideoCaption: '',
    launchVideoCredit: '',
    slug: '',
  };

  function defaultContributorsForDestination(
    destination: StorDestination,
  ): StorContributor[] {
    if (destination === 'committee-reports') {
      return [
        {
          name: '',
          role: 'editor',
          affiliation: 'Committee secretariat',
          showAsAuthor: false,
        },
        {
          name: '',
          role: 'reviewer',
          affiliation: 'Communications',
          showAsAuthor: false,
        },
      ];
    }

    return [
      {
        name: '',
        role: 'author',
        affiliation: '',
        showAsAuthor: true,
      },
    ];
  }

  let metadata = $state<PublisherState>({ ...defaultState });
  let contributors = $state<StorContributor[]>(
    defaultContributorsForDestination(defaultState.destination),
  );
  let importedPm = $state<ProseMirrorDocument | null>(null);
  let importedFilename = $state('');
  let importMessage = $state<string | null>(null);
  let importError = $state<string | null>(null);

  function slugify(input: string) {
    const base = input.trim() || 'untitled-story';
    return (
      base
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^[-]+|[-]+$/g, '')
        .toLowerCase() || 'untitled-story'
    );
  }

  function findHeadingTexts(document: ProseMirrorDocument) {
    return document.content
      .filter((node) => node.type === 'heading')
      .map((node) =>
        (node.content ?? [])
          .map((child) => child.text ?? '')
          .join('')
          .trim(),
      )
      .filter(Boolean);
  }

  function inferTitle(document: ProseMirrorDocument) {
    const headings = findHeadingTexts(document);
    return headings[1] ?? headings[0] ?? '';
  }

  let canonicalDocument = $derived.by<StorDocument | null>(() => {
    if (!importedPm) return null;

    const title = metadata.title.trim();
    const publishedDate = metadata.publishedDate.trim() || null;
    const generatedSlug = slugify(
      `${title || importedFilename || 'untitled'}${publishedDate ? `-${publishedDate.slice(0, 10).replace(/-/g, '')}` : ''}`,
    );
    const slug = metadata.slug.trim() || generatedSlug;

    return {
      id: slug,
      slug,
      type: metadata.type,
      destination: metadata.destination,
      featured: metadata.featured,
      heroLayout: metadata.heroLayout,
      showContents: metadata.showContents,
      flourishWidth: metadata.flourishWidth,
      title: title || 'Untitled research document',
      dek: metadata.dek,
      ...(metadata.eyebrow.trim() ? { eyebrow: metadata.eyebrow.trim() } : {}),
      ...(metadata.byline.trim() ? { byline: metadata.byline.trim() } : {}),
      ...(metadata.abstract.trim() ? { abstract: metadata.abstract.trim() } : {}),
      ...(metadata.destination === 'committee-reports' && metadata.committeeName.trim()
        ? { committeeName: metadata.committeeName.trim() }
        : {}),
      ...(metadata.topics.trim()
        ? {
            topics: metadata.topics
              .split(',')
              .map((topic) => topic.trim())
              .filter(Boolean),
          }
        : {}),
      layout: 'standard',
      status: metadata.status,
      publishedDate,
      contributors: contributors
        .map((contributor) => ({
          name: contributor.name.trim(),
          role: contributor.role.trim(),
          affiliation: contributor.affiliation?.trim() || undefined,
          showAsAuthor: contributor.showAsAuthor ?? false,
        }))
        .filter((contributor) => contributor.name && contributor.role),
      ...((metadata.researcherName.trim() ||
        metadata.researcherRole.trim() ||
        metadata.researcherOrganisation.trim() ||
        metadata.researcherBio.trim() ||
        metadata.researcherImage.trim())
        ? {
            researcher: {
              ...(metadata.researcherName.trim()
                ? { name: metadata.researcherName.trim() }
                : {}),
              role: metadata.researcherRole.trim() || 'Researcher',
              ...(metadata.researcherOrganisation.trim()
                ? { organisation: metadata.researcherOrganisation.trim() }
                : {}),
              ...(metadata.researcherBio.trim()
                ? { bio: metadata.researcherBio.trim() }
                : {}),
              ...(metadata.researcherImage.trim()
                ? { image: metadata.researcherImage.trim() }
                : {}),
            },
          }
        : {}),
      hero: metadata.heroSrc.trim()
        ? {
            src: metadata.heroSrc.trim(),
            alt: metadata.heroAlt.trim() || title || 'Story hero image',
            position: metadata.heroPosition.trim() || 'center center',
          }
        : undefined,
      ...(metadata.destination === 'committee-reports' && metadata.launchVideoSrc.trim()
        ? {
            launchVideo: {
              src: metadata.launchVideoSrc.trim(),
              ...(metadata.launchVideoPoster.trim()
                ? { poster: metadata.launchVideoPoster.trim() }
                : {}),
              ...(metadata.launchVideoCaption.trim()
                ? { caption: metadata.launchVideoCaption.trim() }
                : {}),
              ...(metadata.launchVideoCredit.trim()
                ? { credit: metadata.launchVideoCredit.trim() }
                : {}),
            },
          }
        : {}),
      content: importedPm,
    };
  });

  let renderedPreview = $derived.by(() => {
    if (!canonicalDocument) return null;

    try {
      return storDocumentToStory(canonicalDocument);
    } catch {
      return null;
    }
  });

  let suggestedPath = $derived.by(() => {
    if (!canonicalDocument) return null;

    return suggestedStorDocumentPath({
      destination: canonicalDocument.destination,
      committeeName: canonicalDocument.committeeName,
      slug: canonicalDocument.slug,
    });
  });

  let validation = $derived.by(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!metadata.title.trim() || metadata.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters.');
    }

    if (!metadata.destination) {
      errors.push('Destination is required.');
    }

    if (metadata.destination === 'committee-reports') {
      if (!metadata.committeeName.trim()) {
        errors.push('Authoring committee is required.');
      }
    }

    if (metadata.status === 'published') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.publishedDate.trim())) {
        errors.push('Published items need a publication date in YYYY-MM-DD format.');
      }
    } else if (
      metadata.publishedDate.trim() &&
      !/^\d{4}-\d{2}-\d{2}$/.test(metadata.publishedDate.trim())
    ) {
      warnings.push('Publication date should use YYYY-MM-DD.');
    }

    const namedContributors = contributors.filter((contributor) =>
      contributor.name.trim(),
    );

    if (!namedContributors.length) {
      errors.push('At least one contributor is required.');
    }

    namedContributors.forEach((contributor, index) => {
      if (!contributor.role.trim()) {
        errors.push(`Contributor ${index + 1} needs a role.`);
      }
    });

    if (metadata.heroSrc.trim() && !metadata.heroAlt.trim()) {
      warnings.push('Hero image alt text is empty.');
    }

    if (!importedPm) {
      warnings.push('No DOCX has been imported yet.');
    }

    return { errors, warnings, ok: errors.length === 0 };
  });

  async function handleDocxSelected(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    importError = null;
    importMessage = null;

    try {
      const mammoth = await import('mammoth/mammoth.browser');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          styleMap: [
            "p[style-name='Title'] => h1",
            "p[style-name='Heading 1'] => h1",
            "p[style-name='Heading 2'] => h2",
            "p[style-name='Heading 3'] => h3",
            "p[style-name='Heading 4'] => h4",
          ],
          includeDefaultStyleMap: true,
        },
      );

      const pm = proseMirrorFromHtml(result.value);
      importedPm = pm;
      importedFilename = file.name.replace(/\.docx$/i, '');

      if (!metadata.title.trim()) {
        metadata.title = inferTitle(pm) || importedFilename;
      }
      metadata.heroAlt = metadata.heroAlt || metadata.title;
      if (!metadata.slug.trim()) {
        metadata.slug = slugify(
          `${metadata.title || importedFilename}-${metadata.publishedDate.replace(/-/g, '')}`,
        );
      }

      importMessage = `Imported ${file.name}. Review and adjust the metadata before exporting.`;
    } catch (error) {
      console.error(error);
      importError = error instanceof Error ? error.message : String(error);
    } finally {
      input.value = '';
    }
  }

  function downloadCanonicalJson() {
    if (!canonicalDocument || !validation.ok) return;

    const blob = new Blob([JSON.stringify(canonicalDocument, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${canonicalDocument.slug}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copyProseMirrorJson() {
    if (!importedPm) return;
    await navigator.clipboard.writeText(JSON.stringify(importedPm, null, 2));
    importMessage = 'Copied ProseMirror JSON to clipboard.';
  }

  function syncGeneratedSlug() {
    metadata.slug = slugify(
      `${metadata.title || importedFilename || 'untitled'}${metadata.publishedDate ? `-${metadata.publishedDate.replace(/-/g, '')}` : ''}`,
    );
  }

  function syncContributorTemplate(destination: StorDestination) {
    const hasNames = contributors.some((contributor) => contributor.name.trim());
    if (!hasNames) {
      contributors = defaultContributorsForDestination(destination);
    }
  }

  function updateContributor(index: number, patch: Partial<StorContributor>) {
    contributors = contributors.map((contributor, contributorIndex) =>
      contributorIndex === index ? { ...contributor, ...patch } : contributor,
    );
  }

  function addContributor() {
    contributors = [
      ...contributors,
      {
        name: '',
        role: metadata.destination === 'committee-reports' ? 'reviewer' : 'author',
        affiliation: '',
        showAsAuthor: metadata.destination !== 'committee-reports',
      },
    ];
  }

  function removeContributor(index: number) {
    contributors = contributors.filter((_, contributorIndex) => contributorIndex !== index);
    if (!contributors.length) {
      contributors = defaultContributorsForDestination(metadata.destination);
    }
  }
</script>

<svelte:head>
  <title>Stór Publisher | Oireachtas Research Repository</title>
  <meta
    name="description"
    content="Import Word documents, enrich them with Stór metadata, and export canonical metadata-wrapped ProseMirror JSON."
  />
</svelte:head>

<section class="publisher-shell">
  <aside class="publisher-panel">
    <p class="eyebrow">Stór Publisher</p>
    <h1>Import DOCX and build a canonical Stór document</h1>
    <p class="intro">
      This route converts a Word document into raw ProseMirror, applies Stór
      metadata, previews the result through the current frontend adapter, and
      exports canonical JSON for storage.
    </p>

    <label class="upload-card">
      <span>Choose a Word document (.docx)</span>
      <input type="file" accept=".docx" onchange={handleDocxSelected} />
    </label>

    {#if importMessage}
      <p class="status success">{importMessage}</p>
    {/if}

    {#if importError}
      <p class="status error">{importError}</p>
    {/if}

    {#if validation.errors.length}
      <div class="status error">
        <strong>Metadata needs attention</strong>
        <ul>
          {#each validation.errors as issue}
            <li>{issue}</li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if validation.warnings.length}
      <div class="status warning">
        <strong>Checks</strong>
        <ul>
          {#each validation.warnings as issue}
            <li>{issue}</li>
          {/each}
        </ul>
      </div>
    {/if}

    <div class="form-grid">
      <label>
        <span>Destination</span>
        <select
          bind:value={metadata.destination}
          onchange={() => {
            metadata.type =
              TYPE_OPTIONS[metadata.destination][0]?.value ?? 'article';
            syncContributorTemplate(metadata.destination);
          }}
        >
          {#each DESTINATION_OPTIONS as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </label>

      <label>
        <span>Type</span>
        <select bind:value={metadata.type}>
          {#each TYPE_OPTIONS[metadata.destination] as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </label>

      <label>
        <span>Status</span>
        <select bind:value={metadata.status}>
          {#each STATUS_OPTIONS as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </label>

      <label class="checkbox">
        <input type="checkbox" bind:checked={metadata.featured} />
        <span>Featured</span>
      </label>

      <label>
        <span>Hero layout</span>
        <select bind:value={metadata.heroLayout}>
          <option value="contained">Contained</option>
          <option value="split">Split</option>
          <option value="immersive">Immersive</option>
        </select>
      </label>

      <label>
        <span>Flourish width</span>
        <select bind:value={metadata.flourishWidth}>
          <option value="prose">Prose</option>
          <option value="wide">Wide</option>
        </select>
      </label>

      <label class="checkbox">
        <input type="checkbox" bind:checked={metadata.showContents} />
        <span>Show contents</span>
      </label>

      <label class="full">
        <span>Title</span>
        <input bind:value={metadata.title} onblur={syncGeneratedSlug} />
      </label>

      <label class="full">
        <span>Strapline</span>
        <textarea bind:value={metadata.dek} rows="3"></textarea>
      </label>

      <label class="full">
        <span>Eyebrow</span>
        <input bind:value={metadata.eyebrow} />
      </label>

      <label class="full">
        <span>Byline</span>
        <input bind:value={metadata.byline} />
      </label>

      <label class="full">
        <span>Abstract / Summary</span>
        <textarea bind:value={metadata.abstract} rows="4"></textarea>
      </label>

      {#if metadata.destination === 'committee-reports'}
        <label class="full">
          <span>Authoring committee</span>
          <select bind:value={metadata.committeeName}>
            <option value="">Choose committee…</option>
            {#each COMMITTEE_OPTIONS as option}
              <option value={option}>{option}</option>
            {/each}
          </select>
        </label>
      {/if}

      <label>
        <span>Published date</span>
        <input
          type="date"
          bind:value={metadata.publishedDate}
          onblur={syncGeneratedSlug}
        />
      </label>

      <label class="full">
        <span>Reference</span>
        <input bind:value={metadata.slug} placeholder="generated-from-title-and-date" />
      </label>

      <label class="full">
        <span>Topics</span>
        <input bind:value={metadata.topics} placeholder="comma, separated, topics" />
      </label>

      <div class="full contributor-panel">
        <div class="contributor-panel__header">
          <span>Researcher profile</span>
        </div>

        <div class="contributors">
          <div class="contributor-row">
            <label>
              <span>Name</span>
              <input bind:value={metadata.researcherName} />
            </label>

            <label>
              <span>Role</span>
              <input bind:value={metadata.researcherRole} />
            </label>

            <label>
              <span>Organisation</span>
              <input bind:value={metadata.researcherOrganisation} />
            </label>

            <label>
              <span>Image</span>
              <input bind:value={metadata.researcherImage} />
            </label>

            <label class="full">
              <span>Bio</span>
              <textarea bind:value={metadata.researcherBio} rows="3"></textarea>
            </label>
          </div>
        </div>
      </div>

      <div class="full contributor-panel">
        <div class="contributor-panel__header">
          <span>Contributors</span>
          <button type="button" class="secondary contributor-add" onclick={addContributor}>
            Add contributor
          </button>
        </div>

        <div class="contributors">
          {#each contributors as contributor, index}
            <div class="contributor-row">
              <label>
                <span>Name</span>
                <input
                  value={contributor.name}
                  oninput={(event) =>
                    updateContributor(index, {
                      name: (event.currentTarget as HTMLInputElement).value,
                    })}
                />
              </label>

              <label>
                <span>Role</span>
                <input
                  value={contributor.role}
                  oninput={(event) =>
                    updateContributor(index, {
                      role: (event.currentTarget as HTMLInputElement).value,
                    })}
                />
              </label>

              <label>
                <span>Affiliation</span>
                <input
                  value={contributor.affiliation ?? ''}
                  oninput={(event) =>
                    updateContributor(index, {
                      affiliation: (event.currentTarget as HTMLInputElement).value,
                    })}
                />
              </label>

              <label class="checkbox">
                <input
                  type="checkbox"
                  checked={contributor.showAsAuthor ?? false}
                  onchange={(event) =>
                    updateContributor(index, {
                      showAsAuthor: (event.currentTarget as HTMLInputElement).checked,
                    })}
                />
                <span>Show as author</span>
              </label>

              <button
                type="button"
                class="secondary contributor-remove"
                onclick={() => removeContributor(index)}
              >
                Remove
              </button>
            </div>
          {/each}
        </div>
      </div>

      <label class="full">
        <span>Hero image src</span>
        <input bind:value={metadata.heroSrc} />
      </label>

      <label class="full">
        <span>Hero alt</span>
        <input bind:value={metadata.heroAlt} />
      </label>

      <label class="full">
        <span>Hero position</span>
        <input bind:value={metadata.heroPosition} />
      </label>

      {#if metadata.destination === 'committee-reports'}
        <label class="full">
          <span>Launch video src</span>
          <input bind:value={metadata.launchVideoSrc} placeholder="/media/Committee_launch.mp4" />
        </label>

        <label class="full">
          <span>Launch video poster</span>
          <input bind:value={metadata.launchVideoPoster} placeholder="/media/report-launch-poster.jpg" />
        </label>

        <label class="full">
          <span>Launch video caption</span>
          <input bind:value={metadata.launchVideoCaption} />
        </label>

        <label class="full">
          <span>Launch video credit</span>
          <input bind:value={metadata.launchVideoCredit} />
        </label>
      {/if}
    </div>

    <div class="actions">
      <button onclick={downloadCanonicalJson} disabled={!canonicalDocument}>
        Download canonical JSON
      </button>
      <button
        class="secondary"
        onclick={copyProseMirrorJson}
        disabled={!importedPm}
      >
        Copy ProseMirror JSON
      </button>
    </div>

    {#if suggestedPath}
      <p class="path-hint">
        Suggested repo path:
        <code>{suggestedPath}</code>
      </p>
    {/if}

    {#if canonicalDocument}
      <details class="export-preview">
        <summary>Canonical JSON</summary>
        <pre>{JSON.stringify(canonicalDocument, null, 2)}</pre>
      </details>
    {/if}
  </aside>

  <section class="preview-panel">
    {#if renderedPreview}
      <StoryPage story={renderedPreview.story} />
    {:else}
      <div class="preview-placeholder">
        <h2>Preview</h2>
        <p>Import a Word document to render a live Stór preview here.</p>
      </div>
    {/if}
  </section>
</section>

<style>
  .publisher-shell {
    display: grid;
    grid-template-columns: minmax(20rem, 28rem) minmax(0, 1fr);
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(151, 64, 96, 0.08), transparent 32%),
      linear-gradient(180deg, #f6f3ef 0%, #fbfaf8 100%);
  }

  .publisher-panel {
    padding: 2rem 1.4rem 3rem;
    border-right: 1px solid rgba(15, 32, 48, 0.1);
    background: rgba(255, 255, 255, 0.86);
    backdrop-filter: blur(14px);
    overflow: auto;
  }

  .preview-panel {
    min-width: 0;
    background: #fbfaf8;
  }

  .eyebrow {
    margin: 0 0 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-size: 0.76rem;
    color: #7d294b;
  }

  h1 {
    margin: 0 0 0.85rem;
    font-size: clamp(1.9rem, 2.6vw, 2.6rem);
    line-height: 1.04;
  }

  .intro {
    margin: 0 0 1.5rem;
    color: #485766;
    line-height: 1.65;
  }

  .upload-card {
    display: grid;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding: 1rem;
    border: 1px dashed rgba(125, 41, 75, 0.35);
    border-radius: 1rem;
    background: rgba(255, 249, 251, 0.9);
    cursor: pointer;
  }

  .upload-card input {
    width: 100%;
  }

  .status {
    margin: 0 0 1rem;
    padding: 0.8rem 0.9rem;
    border-radius: 0.85rem;
    font-size: 0.95rem;
  }

  .status.success {
    background: #eef8f1;
    color: #194b2f;
  }

  .status.error {
    background: #fff0f0;
    color: #7a1f28;
  }

  .status.warning {
    background: #fff9ec;
    color: #6a4d14;
  }

  .status ul {
    margin: 0.55rem 0 0;
    padding-left: 1.1rem;
  }

  .form-grid {
    display: grid;
    gap: 0.85rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .form-grid label {
    display: grid;
    gap: 0.35rem;
  }

  .form-grid label.full {
    grid-column: 1 / -1;
  }

  .form-grid span {
    font-size: 0.85rem;
    font-weight: 600;
    color: #30404f;
  }

  .form-grid input,
  .form-grid select,
  .form-grid textarea {
    width: 100%;
    padding: 0.72rem 0.82rem;
    border: 1px solid rgba(15, 32, 48, 0.14);
    border-radius: 0.8rem;
    background: #fff;
    font: inherit;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
    margin-top: 1.2rem;
  }

  .contributor-panel {
    display: grid;
    gap: 0.8rem;
    padding: 0.9rem;
    border: 1px solid rgba(15, 32, 48, 0.12);
    border-radius: 0.95rem;
    background: #fff;
  }

  .contributor-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .contributors {
    display: grid;
    gap: 0.85rem;
  }

  .contributor-row {
    display: grid;
    gap: 0.7rem;
    padding: 0.85rem;
    border-radius: 0.8rem;
    background: #fbfaf8;
  }

  .contributor-row label {
    display: grid;
    gap: 0.35rem;
  }

  .checkbox {
    display: flex !important;
    align-items: center;
    gap: 0.55rem;
  }

  .checkbox span {
    margin: 0;
  }

  .checkbox input {
    width: auto;
  }

  .contributor-add,
  .contributor-remove {
    justify-self: start;
  }

  button {
    border: 0;
    border-radius: 999px;
    padding: 0.8rem 1.05rem;
    background: #7d294b;
    color: #fff;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  button.secondary {
    background: #e6dfd7;
    color: #21313f;
  }

  button:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .export-preview {
    margin-top: 1.2rem;
    border: 1px solid rgba(15, 32, 48, 0.12);
    border-radius: 0.9rem;
    background: #fff;
    overflow: hidden;
  }

  .path-hint {
    margin: 0.9rem 0 0;
    color: #495767;
    font-size: 0.92rem;
    line-height: 1.5;
  }

  .path-hint code {
    display: inline-block;
    margin-top: 0.25rem;
    padding: 0.12rem 0.35rem;
    border-radius: 0.35rem;
    background: rgba(15, 32, 48, 0.06);
    font-size: 0.86rem;
  }

  .export-preview summary {
    padding: 0.9rem 1rem;
    cursor: pointer;
    font-weight: 600;
  }

  .export-preview pre {
    margin: 0;
    padding: 1rem;
    overflow: auto;
    background: #fbfaf8;
    font-size: 0.82rem;
  }

  .preview-placeholder {
    max-width: 36rem;
    margin: 4rem auto;
    padding: 2rem;
    text-align: center;
    color: #4c5967;
  }

  @media (max-width: 980px) {
    .publisher-shell {
      grid-template-columns: 1fr;
    }

    .publisher-panel {
      border-right: 0;
      border-bottom: 1px solid rgba(15, 32, 48, 0.1);
    }
  }
</style>
