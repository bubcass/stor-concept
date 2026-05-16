<script lang="ts">
  import { onMount } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Placeholder from '@tiptap/extension-placeholder';
  import Underline from '@tiptap/extension-underline';
  import Link from '@tiptap/extension-link';
  import Superscript from '@tiptap/extension-superscript';
  import Subscript from '@tiptap/extension-subscript';
  import StoryPage from '$lib/components/story/StoryPage.svelte';
  import { extractDocxMetadata } from '$lib/publisher/extractDocxMetadata';
  import {
    FlourishBlock,
    getSelectedStructuredBlock,
    ImageBlock,
    TableBlock,
    type StructuredBlockSelection,
  } from '$lib/publisher/editor/extensions';
  import { transformImportedHtml } from '$lib/publisher/editor/importHtml';
  import { storDocumentToStory } from '$lib/content/stor/toStory';
  import { storDocumentToXml } from '$lib/content/stor/toXml';
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
    abstract: string;
    committeeName: string;
    publishedDate: string;
    status: NonNullable<StorDocument['status']>;
    language: string;
    keywords: string;
    version: string;
    license: string;
    doi: string;
    publisher: string;
    heroSrc: string;
    heroAlt: string;
    heroPosition: string;
    launchVideoSrc: string;
    launchVideoPoster: string;
    launchVideoCaption: string;
    launchVideoCredit: string;
    slug: string;
  };

  type PublisherDraft = {
    metadata: PublisherState;
    contributors: StorContributor[];
    editorDocument: ProseMirrorDocument;
    importedFilename: string;
    openStage: 'start' | 'details' | 'edit' | 'preview';
    savedAt: string;
  };

  const PUBLISHER_DRAFT_KEY = 'stor/publisher-draft';

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
    abstract: '',
    committeeName: '',
    publishedDate: new Date().toISOString().slice(0, 10),
    status: 'draft',
    language: 'en',
    keywords: '',
    version: '0.1',
    license: 'Oireachtas PSI Licence',
    doi: '',
    publisher: 'Houses of the Oireachtas',
    heroSrc: '',
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
          role: 'author',
          affiliation: 'Houses of the Oireachtas',
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

  function supportsAuthorProfile(destination: StorDestination) {
    return destination !== 'committee-reports';
  }

  function normalizeContributorDisplay(
    list: StorContributor[],
    destination: StorDestination,
  ) {
    if (!supportsAuthorProfile(destination)) {
      return list.map((contributor) => ({
        ...contributor,
        showAsAuthor: false,
      }));
    }

    let hasVisibleAuthor = false;

    return list.map((contributor) => {
      const isEligible = contributor.role.trim().toLowerCase() === 'author';
      if (isEligible && !hasVisibleAuthor) {
        hasVisibleAuthor = true;
        return { ...contributor, showAsAuthor: true };
      }

      return { ...contributor, showAsAuthor: false };
    });
  }

  let metadata = $state<PublisherState>({ ...defaultState });
  let contributors = $state<StorContributor[]>(
    defaultContributorsForDestination(defaultState.destination),
  );
  let editor = $state<Editor | null>(null);
  let editorHost = $state<HTMLDivElement | null>(null);
  let editorDocument = $state<ProseMirrorDocument | null>(null);
  let selectedStructuredBlock = $state<StructuredBlockSelection | null>(null);
  let openStage = $state<'start' | 'details' | 'edit' | 'preview'>('start');
  let importedFilename = $state('');
  let importMessage = $state<string | null>(null);
  let importError = $state<string | null>(null);
  let editorMounted = $state(false);
  let hasLocalDraft = $state(false);
  let draftStatus = $state<string | null>(null);
  let draftPersistenceReady = false;
  let editorDraftSaveTimeout: number | null = null;

  const stageItems = [
    { id: 'start', label: '1. Start', summary: 'Import or begin a draft' },
    { id: 'details', label: '2. Publication details', summary: 'Set metadata and routing' },
    { id: 'edit', label: '3. Edit content', summary: 'Refine PM content and blocks' },
    { id: 'preview', label: '4. Preview and export', summary: 'Check and download outputs' },
  ] as const;

  const CONTRIBUTOR_ROLE_OPTIONS = ['author', 'editor', 'reviewer', 'contributor'] as const;
  const AFFILIATION_OPTIONS = [
    'Communications',
    'Committee secretariat',
    'Parliamentary Budget Office',
    'Library & Research Service',
  ] as const;
  const LICENSE_OPTIONS = [
    'Oireachtas PSI Licence',
    'CC BY 4.0',
    'CC BY-SA 4.0',
    'CC BY-NC 4.0',
    'All rights reserved',
  ] as const;

  const EMPTY_DOCUMENT: ProseMirrorDocument = {
    type: 'doc',
    content: [{ type: 'paragraph', attrs: { textAlign: null }, content: [] }],
  };

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

  function hasBodyContent(document: ProseMirrorDocument | null) {
    if (!document?.content?.length) return false;

    return document.content.some((node) => {
      if (node.type === 'imageBlock' || node.type === 'flourishBlock') return true;
      if (node.type === 'text') return Boolean(node.text?.trim());
      if (!node.content?.length) return false;
      return JSON.stringify(node.content).replace(/[^A-Za-z0-9]+/g, '').length > 0;
    });
  }

  function normalizeDocxDate(value: unknown) {
    if (typeof value !== 'string' || !value.trim()) return '';
    return value.slice(0, 10);
  }

  function parseDestination(value: unknown): StorDestination | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;
    if (
      normalized.includes('committee') ||
      normalized === 'committee-reports' ||
      normalized === 'committee reports'
    ) {
      return 'committee-reports';
    }

    if (
      normalized.includes('budget') ||
      normalized.includes('pbo') ||
      normalized === 'parliamentary-budget-office'
    ) {
      return 'parliamentary-budget-office';
    }

    if (
      normalized.includes('inside parliament') ||
      normalized.includes('houses of the oireachtas') ||
      normalized.includes('oireachtas') ||
      normalized.includes('stor') ||
      normalized.includes('library') ||
      normalized.includes('research service') ||
      normalized === 'houses-of-the-oireachtas' ||
      normalized === 'inside-parliament' ||
      normalized === 'library-research-service'
    ) {
      if (
        normalized.includes('library') ||
        normalized.includes('research service') ||
        normalized === 'library-research-service'
      ) {
        return 'library-research-service';
      }

      return 'houses-of-the-oireachtas';
    }

    return null;
  }

  function parseType(
    value: unknown,
    destination: StorDestination,
  ): StorDocument['type'] | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;
    if (destination === 'committee-reports') return 'committee-report';
    if (normalized.includes('brief')) return 'briefing';
    if (normalized.includes('report')) return 'briefing';
    if (normalized.includes('article')) return 'article';
    return null;
  }

  function splitKeywords(value: unknown) {
    if (Array.isArray(value)) {
      return value.map((entry) => String(entry || '').trim()).filter(Boolean);
    }

    return String(value || '')
      .split(/[,;]\s*|\s*\n+\s*/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  function parseContributorName(name: string) {
    const normalized = name.trim();
    if (!normalized) return '';

    if (normalized.includes(',')) {
      const [family, given] = normalized.split(',').map((part) => part.trim());
      return [given, family].filter(Boolean).join(' ');
    }

    return normalized;
  }

  function splitContributorName(name: string) {
    const normalized = parseContributorName(name);
    if (!normalized) return { firstName: '', surname: '' };

    const parts = normalized.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return { firstName: parts[0], surname: '' };
    }

    return {
      firstName: parts.slice(0, -1).join(' '),
      surname: parts.at(-1) ?? '',
    };
  }

  function isPresetAffiliation(value: string | undefined) {
    return AFFILIATION_OPTIONS.includes((value ?? '') as (typeof AFFILIATION_OPTIONS)[number]);
  }

  function parseContributors(value: unknown): StorContributor[] {
    if (typeof value !== 'string' || !value.trim()) return [];

    const contributors: StorContributor[] = [];

    for (const token of value.split(';').map((entry) => entry.trim()).filter(Boolean)) {
      const [name, role = 'author', affiliation = ''] = token
        .split('|')
        .map((part) => part.trim());
      const normalizedName = parseContributorName(name);
      if (!normalizedName) continue;

      contributors.push({
        name: normalizedName,
        role: role.toLowerCase() || 'author',
        ...(affiliation ? { affiliation } : {}),
        showAsAuthor: role.toLowerCase() === 'author',
      });
    }

    return contributors;
  }

  function parseAuthors(core: Record<string, unknown>, custom: Record<string, unknown>) {
    const raw = [custom.Authors, custom.Author, core.creator, core.author]
      .find((value) => typeof value === 'string' && value.trim()) ?? '';

    return String(raw)
      .split(/;|\n/)
      .map((token) => token.trim())
      .filter(Boolean)
      .map((name) => ({
        name: parseContributorName(name),
        role: 'author',
        showAsAuthor: true,
      }))
      .filter((contributor) => contributor.name);
  }

  function dedupeContributors(list: StorContributor[]) {
    const seen = new Set<string>();
    const unique: StorContributor[] = [];

    for (const contributor of list) {
      const key = `${contributor.name.trim().toLowerCase()}|${contributor.role
        .trim()
        .toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(contributor);
    }

    return unique;
  }

  function summarizeTableHtml(value: unknown) {
    const html = String(value ?? '');
    return {
      rows: (html.match(/<tr\b/gi) || []).length,
      columns:
        [...html.matchAll(/<(td|th)\b/gi)].length && (html.match(/<tr\b/gi) || []).length
          ? Math.max(
              ...html
                .split(/<tr\b/gi)
                .slice(1)
                .map((row) => [...row.matchAll(/<(td|th)\b/gi)].length),
            )
          : 0,
      headers: (html.match(/<th\b/gi) || []).length,
    };
  }

  function readPublisherDraft() {
    if (typeof window === 'undefined') return null;

    try {
      const raw = window.localStorage.getItem(PUBLISHER_DRAFT_KEY);
      if (!raw) return null;

      return JSON.parse(raw) as PublisherDraft;
    } catch {
      return null;
    }
  }

  function writePublisherDraft(payload: PublisherDraft) {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PUBLISHER_DRAFT_KEY, JSON.stringify(payload));
      return true;
    } catch (error) {
      console.error('Failed to save publisher draft locally.', error);
      return false;
    }
  }

  function clearPublisherDraft() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(PUBLISHER_DRAFT_KEY);
  }

  function formatDraftTimestamp(value: string) {
    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) return 'saved locally';

    return new Intl.DateTimeFormat('en-IE', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  }

  function buildPublisherDraftPayload(): PublisherDraft | null {
    if (!editorDocument) return null;

    return {
      metadata: JSON.parse(JSON.stringify(metadata)) as PublisherState,
      contributors: JSON.parse(JSON.stringify(contributors)) as StorContributor[],
      editorDocument: JSON.parse(JSON.stringify(editorDocument)) as ProseMirrorDocument,
      importedFilename,
      openStage,
      savedAt: new Date().toISOString(),
    };
  }

  function persistPublisherDraft() {
    if (!draftPersistenceReady || !editorDocument) return;

    const payload = buildPublisherDraftPayload();
    if (!payload) return;

    const saved = writePublisherDraft(payload);
    if (!saved) {
      hasLocalDraft = false;
      draftStatus = 'This draft could not be saved locally in the browser.';
      return;
    }

    hasLocalDraft = true;
    draftStatus = `Draft saved locally on ${formatDraftTimestamp(payload.savedAt)}.`;
  }

  function resetPublisherState() {
    metadata = { ...defaultState };
    contributors = defaultContributorsForDestination(defaultState.destination);
    importedFilename = '';
    openStage = 'start';
    importMessage = null;
    importError = null;

    if (editor) {
      editor.commands.setContent(EMPTY_DOCUMENT);
      editorDocument = editor.getJSON() as ProseMirrorDocument;
    } else {
      editorDocument = EMPTY_DOCUMENT;
    }
  }

  function discardLocalDraft() {
    if (!window.confirm('Discard the locally saved publisher draft?')) {
      return;
    }

    clearPublisherDraft();
    hasLocalDraft = false;
    draftStatus = null;
    resetPublisherState();
  }

  let canonicalDocument = $derived.by<StorDocument | null>(() => {
    if (!editorDocument) return null;

    const title = metadata.title.trim();
    const publishedDate = metadata.publishedDate.trim() || null;
    const generatedSlug = slugify(
      `${title || importedFilename || 'untitled'}${publishedDate ? `-${publishedDate.slice(0, 10).replace(/-/g, '')}` : ''}`,
    );
    const slug = metadata.slug.trim() || generatedSlug;
    const keywordList = splitKeywords(metadata.keywords);
    const derivedEyebrow =
      metadata.type === 'committee-report'
        ? metadata.committeeName.trim()
        : metadata.eyebrow.trim();
    const authorContributor =
      contributors.find((contributor) => contributor.role.trim().toLowerCase() === 'author') ??
      contributors[0] ??
      null;
    const authorName = authorContributor?.name?.trim() ?? '';
    const authorOrganisation = authorContributor?.affiliation?.trim() ?? '';
    const authorProfileRole = authorContributor?.profileRole?.trim() ?? '';
    const authorProfileImage = authorContributor?.profileImage?.trim() ?? '';
    const authorBio = authorContributor?.bio?.trim() ?? '';

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
      ...(derivedEyebrow ? { eyebrow: derivedEyebrow } : {}),
      ...(metadata.abstract.trim() ? { abstract: metadata.abstract.trim() } : {}),
      ...(metadata.destination === 'committee-reports' && metadata.committeeName.trim()
        ? { committeeName: metadata.committeeName.trim() }
        : {}),
      ...(keywordList.length ? { topics: keywordList } : {}),
      layout: 'standard',
      status: metadata.status,
      language: metadata.language.trim() || 'en',
      version: metadata.version.trim() || undefined,
      keywords: keywordList,
      ...(metadata.license.trim() ? { license: metadata.license.trim() } : {}),
      ...(metadata.doi.trim() ? { doi: metadata.doi.trim() } : {}),
      ...(metadata.publisher.trim() ? { publisher: metadata.publisher.trim() } : {}),
      publishedDate,
      contributors: contributors
        .map((contributor) => ({
          name: contributor.name.trim(),
          role: contributor.role.trim(),
          affiliation: contributor.affiliation?.trim() || undefined,
          showAsAuthor: contributor.showAsAuthor ?? false,
          profileRole: contributor.profileRole?.trim() || undefined,
          profileImage: contributor.profileImage?.trim() || undefined,
          bio: contributor.bio?.trim() || undefined,
        }))
        .filter((contributor) => contributor.name && contributor.role),
      ...((authorName ||
        authorProfileRole ||
        authorOrganisation ||
        authorBio ||
        authorProfileImage)
        ? {
            researcher: {
              ...(authorName ? { name: authorName } : {}),
              ...(authorProfileRole ? { role: authorProfileRole } : {}),
              ...(authorOrganisation ? { organisation: authorOrganisation } : {}),
              ...(authorBio ? { bio: authorBio } : {}),
              ...(authorProfileImage ? { image: authorProfileImage } : {}),
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
      content: editorDocument,
    };
  });

  let renderedPreview = $derived.by(() => {
    if (!canonicalDocument) return null;

    try {
      const previewDocument: StorDocument =
        canonicalDocument.destination === 'committee-reports' &&
        !canonicalDocument.committeeName?.trim()
          ? {
              ...canonicalDocument,
              committeeName: 'Committee report',
            }
          : canonicalDocument;

      return storDocumentToStory(previewDocument);
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

  let canonicalXml = $derived.by(() => {
    if (!canonicalDocument) return null;

    try {
      return storDocumentToXml(canonicalDocument);
    } catch {
      return null;
    }
  });

  let activeStage = $derived(
    stageItems.find((stage) => stage.id === openStage) ?? stageItems[0],
  );

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
      if (metadata.type === 'committee-report' && !metadata.committeeName.trim()) {
        errors.push('Authoring committee is required.');
      }
    }

    if ((metadata.language.trim() || '').length < 2) {
      errors.push('Language must be a valid code such as en or en-IE.');
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

    const namedContributors = contributors.filter((contributor) => contributor.name.trim());

    if (!namedContributors.length) {
      errors.push('At least one contributor is required.');
    }

    namedContributors.forEach((contributor, index) => {
      if (!contributor.role.trim()) {
        errors.push(`Contributor ${index + 1} needs a role.`);
      }
    });

    if (metadata.status === 'published' && !metadata.license.trim()) {
      warnings.push('Published items should include a license.');
    }

    if (metadata.heroSrc.trim() && !metadata.heroAlt.trim()) {
      warnings.push('Hero image alt text is empty.');
    }

    if (!hasBodyContent(editorDocument)) {
      warnings.push('No document content has been added yet.');
    }

    return { errors, warnings, ok: errors.length === 0 };
  });

  let metadataWarnings = $derived(
    validation.warnings.filter(
      (warning) =>
        warning !== 'No document content has been added yet.' &&
        warning !== 'Hero image alt text is empty.',
    ),
  );

  let webWarnings = $derived(
    validation.warnings.filter(
      (warning) =>
        warning === 'No document content has been added yet.' ||
        warning === 'Hero image alt text is empty.',
    ),
  );

  async function handleDocxSelected(event: Event) {
    if (!editor) {
      importError = 'The editor is not ready yet. Try again in a moment.';
      return;
    }

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

      editor.commands.setContent(transformImportedHtml(result.value));
      const pm = editor.getJSON() as ProseMirrorDocument;
      editorDocument = pm;
      importedFilename = file.name.replace(/\.docx$/i, '');

      const { core, custom } = await extractDocxMetadata(arrayBuffer);
      const docxDestination =
        parseDestination(custom.Destination) ??
        parseDestination(custom.UnitCode) ??
        parseDestination(custom.ImprintCode);
      const nextDestination = docxDestination ?? metadata.destination;
      const docxType =
        parseType(custom.Type, nextDestination) ??
        parseType(custom.ResourceType, nextDestination);
      const parsedKeywords = splitKeywords(custom.Keywords ?? core.keywords ?? '');
      const parsedContributors = dedupeContributors([
        ...parseContributors(custom.Contributors),
        ...parseAuthors(core, custom),
      ]);

      if (!metadata.title.trim()) {
        metadata.title =
          String(custom.Title || core.title || '').trim() ||
          inferTitle(pm) ||
          importedFilename;
      }
      metadata.destination = nextDestination;
      metadata.type = docxType ?? TYPE_OPTIONS[nextDestination][0]?.value ?? metadata.type;
      metadata.dek =
        String(custom.Dek || custom.Subtitle || core.subject || '').trim() || metadata.dek;
      metadata.abstract =
        String(custom.Abstract || core.description || '').trim() || metadata.abstract;
      metadata.status = (
        String(custom.Status || core.contentStatus || metadata.status || 'draft').trim().toLowerCase()
      ) as PublisherState['status'];
      metadata.language = String(custom.Language || core.language || metadata.language || 'en').trim();
      metadata.keywords = parsedKeywords.join(', ') || metadata.keywords;
      metadata.version = String(custom.Version || metadata.version || '0.1').trim();
      metadata.license = String(custom.License || metadata.license || '').trim();
      metadata.doi = String(custom.DOI || metadata.doi || '').trim();
      metadata.publisher = String(custom.Publisher || metadata.publisher || 'Houses of the Oireachtas').trim();
      metadata.committeeName =
        String(custom.CommitteeName || metadata.committeeName || '').trim();
      metadata.publishedDate =
        normalizeDocxDate(custom.DatePublished) ||
        normalizeDocxDate(core.dateCreated) ||
        metadata.publishedDate;
      if (parsedContributors.length) {
        contributors = normalizeContributorDisplay(parsedContributors, nextDestination);
      }
      metadata.heroAlt = metadata.heroAlt || metadata.title;
      if (!metadata.slug.trim()) {
        metadata.slug = slugify(
          `${metadata.title || importedFilename}-${metadata.publishedDate.replace(/-/g, '')}`,
        );
      }

      importMessage = `Imported ${file.name}. Review and adjust the metadata before exporting.`;
      openStage = 'details';
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

  function downloadCanonicalXml() {
    if (!canonicalDocument || !canonicalXml || !validation.ok) return;

    const blob = new Blob([canonicalXml], {
      type: 'application/xml',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${canonicalDocument.slug}.xml`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copyProseMirrorJson() {
    if (!editorDocument) return;
    await navigator.clipboard.writeText(JSON.stringify(editorDocument, null, 2));
    importMessage = 'Copied ProseMirror JSON to clipboard.';
  }

  function startNewDraft() {
    if (!editor) return;

    editor.commands.setContent(EMPTY_DOCUMENT);
    editorDocument = editor.getJSON() as ProseMirrorDocument;
    importedFilename = '';
    importMessage = 'Started a new draft in the editor.';
    importError = null;
    openStage = 'details';
  }

  function insertImageBlock() {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'imageBlock',
        attrs: {
          src: '/media/report_launch.jpg',
          alt: 'Describe the image',
          caption: '',
          credit: '',
          layout: 'wide',
        },
      })
      .run();
  }

  function insertFlourishBlock() {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'flourishBlock',
        attrs: {
          dataSrc: 'https://flo.uri.sh/visualisation/00000000/embed',
          alt: 'Flourish visualisation',
          caption: '',
          embedType: 'chart',
          width: metadata.flourishWidth,
        },
      })
      .run();
  }

  function updateSelectedStructuredBlock(patch: Record<string, unknown>) {
    if (!editor || !selectedStructuredBlock) return;
    const target = selectedStructuredBlock;

    editor
      .chain()
      .focus()
      .command(({ tr, dispatch }) => {
        const node = tr.doc.nodeAt(target.from);
        if (!node) return false;

        tr.setNodeMarkup(target.from, undefined, {
          ...node.attrs,
          ...patch,
        });
        dispatch?.(tr);
        return true;
      })
      .run();
  }

  function setLink() {
    if (!editor) return;
    const previous = String(editor.getAttributes('link')?.href ?? '');
    const url = window.prompt('Enter URL', previous);
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  function mountEditorHost(node: HTMLDivElement) {
    editorHost = node;

    if (editor && !editorMounted) {
      editor.mount(node);
      editorMounted = true;
    }

    return {
      destroy() {
        if (editor && editorMounted) {
          editor.unmount();
          editorMounted = false;
        }

        if (editorHost === node) {
          editorHost = null;
        }
      },
    };
  }

  onMount(() => {
    const instance = new Editor({
      element: null,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3, 4] },
        }),
        Placeholder.configure({
          placeholder: 'Write something or import a .docx file',
        }),
        Underline,
        Link.configure({
          autolink: true,
          openOnClick: false,
          linkOnPaste: true,
          protocols: ['http', 'https', 'mailto'],
        }),
        Superscript,
        Subscript,
        ImageBlock,
        FlourishBlock,
        TableBlock,
      ],
      content: EMPTY_DOCUMENT,
      editorProps: {
        attributes: {
          class: 'publisher-editor__content',
        },
      },
      onCreate: ({ editor }) => {
        editorDocument = editor.getJSON() as ProseMirrorDocument;
        selectedStructuredBlock = getSelectedStructuredBlock(editor);
      },
      onUpdate: ({ editor }) => {
        editorDocument = editor.getJSON() as ProseMirrorDocument;
      },
      onSelectionUpdate: ({ editor }) => {
        selectedStructuredBlock = getSelectedStructuredBlock(editor);
      },
    });

    editor = instance;
    editorDocument = instance.getJSON() as ProseMirrorDocument;

    const savedDraft = readPublisherDraft();
    if (savedDraft) {
      hasLocalDraft = true;

      metadata = { ...defaultState, ...(savedDraft.metadata ?? {}) };
      const restoredDestination = savedDraft.metadata?.destination ?? defaultState.destination;
      contributors = normalizeContributorDisplay(
        savedDraft.contributors?.length
          ? savedDraft.contributors
          : defaultContributorsForDestination(restoredDestination),
        restoredDestination,
      );
      importedFilename = savedDraft.importedFilename || '';
      openStage = savedDraft.openStage ?? 'details';
      instance.commands.setContent(savedDraft.editorDocument ?? EMPTY_DOCUMENT);
      editorDocument = instance.getJSON() as ProseMirrorDocument;
      importMessage = `Restored local draft from ${formatDraftTimestamp(savedDraft.savedAt)}.`;
      draftStatus = `Draft saved locally on ${formatDraftTimestamp(savedDraft.savedAt)}.`;
    }

    draftPersistenceReady = true;

    const handleEditorDraftUpdate = () => {
      if (editorDraftSaveTimeout) {
        window.clearTimeout(editorDraftSaveTimeout);
      }

      editorDraftSaveTimeout = window.setTimeout(() => {
        persistPublisherDraft();
        editorDraftSaveTimeout = null;
      }, 200);
    };

    const handlePageHide = () => {
      if (!draftPersistenceReady) return;
      persistPublisherDraft();
    };

    instance.on('update', handleEditorDraftUpdate);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      if (editorDraftSaveTimeout) {
        window.clearTimeout(editorDraftSaveTimeout);
        editorDraftSaveTimeout = null;
      }
      instance.off('update', handleEditorDraftUpdate);
      window.removeEventListener('pagehide', handlePageHide);
      if (editorMounted) {
        instance.unmount();
      }
      instance.destroy();
      editor = null;
      editorDocument = null;
      selectedStructuredBlock = null;
      editorMounted = false;
      draftPersistenceReady = false;
    };
  });

  $effect(() => {
    if (!draftPersistenceReady) return;

    JSON.stringify(metadata);
    JSON.stringify(contributors);
    importedFilename;
    openStage;

    persistPublisherDraft();
  });

  function syncGeneratedSlug() {
    metadata.slug = slugify(
      `${metadata.title || importedFilename || 'untitled'}${metadata.publishedDate ? `-${metadata.publishedDate.replace(/-/g, '')}` : ''}`,
    );
  }

  function syncContributorTemplate(destination: StorDestination) {
    const hasNames = contributors.some((contributor) => contributor.name.trim());
    if (!hasNames) {
      contributors = defaultContributorsForDestination(destination);
      return;
    }

    contributors = normalizeContributorDisplay(contributors, destination);
  }

  function updateContributor(index: number, patch: Partial<StorContributor>) {
    const nextContributors = contributors.map((contributor, contributorIndex) =>
      contributorIndex === index ? { ...contributor, ...patch } : contributor,
    );

    contributors = normalizeContributorDisplay(nextContributors, metadata.destination);
  }

  function updateContributorName(
    index: number,
    patch: { firstName?: string; surname?: string },
  ) {
    const contributor = contributors[index];
    if (!contributor) return;

    const current = splitContributorName(contributor.name);
    const firstName = patch.firstName ?? current.firstName;
    const surname = patch.surname ?? current.surname;
    const nextName = [firstName.trim(), surname.trim()].filter(Boolean).join(' ');

    updateContributor(index, { name: nextName });
  }

  function addContributor() {
    contributors = normalizeContributorDisplay([
      ...contributors,
      {
        name: '',
        role: 'author',
        affiliation: '',
        showAsAuthor: false,
      },
    ], metadata.destination);
  }

  function removeContributor(index: number) {
    const contributor = contributors[index];
    const label = contributor?.name?.trim() || `person ${index + 1}`;
    if (!window.confirm(`Remove ${label} from this document?`)) {
      return;
    }

    contributors = contributors.filter((_, contributorIndex) => contributorIndex !== index);
    if (!contributors.length) {
      contributors = defaultContributorsForDestination(metadata.destination);
      return;
    }

    contributors = normalizeContributorDisplay(contributors, metadata.destination);
  }

  function setShowAuthorOnPage(index: number, checked: boolean) {
    if (!supportsAuthorProfile(metadata.destination)) return;

    contributors = contributors.map((contributor, contributorIndex) => ({
      ...contributor,
      showAsAuthor: checked ? contributorIndex === index : false,
    }));
  }
</script>

<svelte:head>
  <title>Stór Publisher | Oireachtas Research Repository</title>
  <meta
    name="description"
    content="Import Word documents, enrich them with Stór metadata, and export canonical metadata-wrapped ProseMirror JSON."
  />
</svelte:head>

<div class="publisher-scope">
  <div class="container">
    <nav class="stage-nav" aria-label="Publisher workflow stages">
      {#each stageItems as stage}
        <button
          type="button"
          class:active={openStage === stage.id}
          class="stage-pill"
          onclick={() => (openStage = stage.id)}
        >
          {stage.label}
        </button>
      {/each}
    </nav>

    {#if openStage !== 'start'}
      <div class="status-strip">
        <div class="status-card">
          <strong>Validation</strong>
          <span>
            {#if validation.errors.length}
              {validation.errors.length} issue{validation.errors.length === 1 ? '' : 's'} need attention
            {:else}
              Required metadata complete
            {/if}
          </span>
        </div>
        <div class="status-card">
          <strong>Content</strong>
          <span>{hasBodyContent(editorDocument) ? 'Editor content available' : 'No body content yet'}</span>
        </div>
        <div class="status-card">
          <strong>Current output</strong>
          <span>{canonicalDocument ? canonicalDocument.slug : 'No canonical document yet'}</span>
        </div>
      </div>
    {/if}

    {#if importMessage}
      <div class="publish-message success">
        <strong>{importMessage}</strong>
      </div>
    {/if}

    {#if importError}
      <div class="publish-message error">
        <strong>{importError}</strong>
      </div>
    {/if}

    <div class="draft-status-bar">
      <span>{draftStatus ?? 'Draft not yet saved locally in this browser.'}</span>
      {#if hasLocalDraft}
        <div class="draft-status-actions">
          <button type="button" onclick={discardLocalDraft}>Discard local draft</button>
        </div>
      {/if}
    </div>

    <section class="stage-section wizard-panel">
      <header class="stage-heading">
        <span>{activeStage.label}</span>
        <strong>{activeStage.summary}</strong>
      </header>

      {#if openStage === 'start'}
        <div class="stage-body stage-body--start">
          <div class="workflow-grid">
            <div class="workflow-card">
              <strong>Upload document</strong>
              <span>Bring in a Word document and move straight into metadata completion.</span>
              <label class="file-label">
                <input type="file" accept=".docx" onchange={handleDocxSelected} />
                Select a Word document (.docx)
              </label>
              {#if importedFilename}
                <p class="workflow-note">Current import: <code>{importedFilename}</code></p>
              {/if}
            </div>

            <div class="workflow-card">
              <strong>Start a blank draft</strong>
              <span>Create a new document and continue straight to publication details.</span>
              <button type="button" onclick={startNewDraft}>Start a new draft</button>
            </div>
          </div>
        </div>
      {/if}

      {#if openStage === 'details'}
        <div class="stage-body">
          <p class="stage-copy">
            Capture the publication metadata, routing, and contributor information before moving
            on to web editing.
          </p>

          {#if validation.errors.length}
            <div class="status-panel error">
              <strong>Metadata needs attention</strong>
              <ul>
                {#each validation.errors as issue}
                  <li>{issue}</li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if metadataWarnings.length}
            <div class="status-panel warning">
              <strong>Checks</strong>
              <ul>
                {#each metadataWarnings as issue}
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
                    metadata.destination === 'committee-reports'
                      ? 'committee-report'
                      : (TYPE_OPTIONS[metadata.destination][0]?.value ?? 'article');
                  syncContributorTemplate(metadata.destination);
                }}
              >
                {#each DESTINATION_OPTIONS as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </label>

            {#if metadata.destination !== 'committee-reports'}
              <label>
                <span>Type</span>
                <select bind:value={metadata.type}>
                  {#each TYPE_OPTIONS[metadata.destination] as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
              </label>
            {/if}

            <label>
              <span>Status</span>
              <select bind:value={metadata.status}>
                {#each STATUS_OPTIONS as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
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

            <label class="full">
              <span>Title</span>
              <input bind:value={metadata.title} onblur={syncGeneratedSlug} />
            </label>

            <label class="full">
              <span>Strapline</span>
              <textarea
                bind:value={metadata.dek}
                rows="3"
                placeholder="Please insert a one or two line summary for your document."
              ></textarea>
            </label>

            {#if metadata.type === 'committee-report'}
              <label class="full">
                <span>Eyebrow</span>
                <input
                  value={metadata.committeeName || 'Will use the selected committee'}
                  readonly
                />
              </label>
            {:else}
              <label class="full">
                <span>Eyebrow</span>
                <input bind:value={metadata.eyebrow} />
              </label>
            {/if}

            <label class="full">
              <span>Abstract / Summary</span>
              <textarea bind:value={metadata.abstract} rows="4"></textarea>
            </label>

            <label>
              <span>Published date</span>
              <input
                type="date"
                bind:value={metadata.publishedDate}
                onblur={syncGeneratedSlug}
              />
            </label>

            <label>
              <span>Language</span>
              <input bind:value={metadata.language} placeholder="en or en-IE" />
            </label>

            <label class="full">
              <span>Reference</span>
              <input bind:value={metadata.slug} placeholder="generated-from-title-and-date" />
            </label>

            <label class="full">
              <span>Keywords</span>
              <input
                bind:value={metadata.keywords}
                placeholder="comma, separated, keywords"
              />
            </label>

            <label>
              <span>Version</span>
              <input bind:value={metadata.version} />
            </label>

            <label>
              <span>DOI</span>
              <input bind:value={metadata.doi} />
            </label>

            <label class="full">
              <span>License</span>
              <select bind:value={metadata.license}>
                {#each LICENSE_OPTIONS as option}
                  <option value={option}>{option}</option>
                {/each}
              </select>
            </label>

            <label class="full">
              <span>Publisher</span>
              <input bind:value={metadata.publisher} />
            </label>

            <div class="full contributor-panel">
              <div class="contributor-panel__header">
                <span>Authors and contributors</span>
                <div class="contributor-panel__actions">
                  <button type="button" onclick={addContributor}>Add person</button>
                  {#if contributors.length === 1}
                    <button
                      type="button"
                      class="destructive-button"
                      onclick={() => removeContributor(0)}
                    >
                      Remove
                    </button>
                  {/if}
                </div>
              </div>

              <div class="contributors">
                {#each contributors as contributor, index}
                  {@const contributorName = splitContributorName(contributor.name)}
                  <div class="contributor-row">
                    <div class="contributor-row__header">
                      <strong>
                        {contributor.name.trim() || `Person ${index + 1}`}
                      </strong>
                      {#if contributors.length > 1}
                        <div class="contributor-panel__actions">
                          <button
                            type="button"
                            class="destructive-button"
                            onclick={() => removeContributor(index)}
                          >
                            Remove
                          </button>
                        </div>
                      {/if}
                    </div>

                    <div class="contributor-row__core">
                      <label>
                        <span>First name</span>
                        <input
                          value={contributorName.firstName}
                          oninput={(event) =>
                            updateContributorName(index, {
                              firstName: (event.currentTarget as HTMLInputElement).value,
                            })}
                        />
                      </label>

                      <label>
                        <span>Surname</span>
                        <input
                          value={contributorName.surname}
                          oninput={(event) =>
                            updateContributorName(index, {
                              surname: (event.currentTarget as HTMLInputElement).value,
                            })}
                        />
                      </label>

                      <label>
                        <span>Role</span>
                        <select
                          value={contributor.role}
                          onchange={(event) =>
                            updateContributor(index, {
                              role: (event.currentTarget as HTMLSelectElement).value,
                              showAsAuthor:
                                (event.currentTarget as HTMLSelectElement).value === 'author',
                            })}
                        >
                          {#each CONTRIBUTOR_ROLE_OPTIONS as role}
                            <option value={role}>{role[0].toUpperCase() + role.slice(1)}</option>
                          {/each}
                        </select>
                      </label>

                      <label>
                        <span>Affiliation</span>
                        <select
                          value={isPresetAffiliation(contributor.affiliation) ? contributor.affiliation : 'Other'}
                          onchange={(event) => {
                            const value = (event.currentTarget as HTMLSelectElement).value;
                            updateContributor(index, {
                              affiliation: value === 'Other' ? '' : value,
                            });
                          }}
                        >
                          {#each AFFILIATION_OPTIONS as option}
                            <option value={option}>{option}</option>
                          {/each}
                          <option value="Other">Other</option>
                        </select>
                      </label>

                      {#if supportsAuthorProfile(metadata.destination)}
                        <label class="checkbox contributor-show-author">
                          <input
                            type="checkbox"
                            checked={contributor.showAsAuthor ?? false}
                            onchange={(event) =>
                              setShowAuthorOnPage(
                                index,
                                (event.currentTarget as HTMLInputElement).checked,
                              )}
                          />
                          <span>Show on page</span>
                        </label>
                      {/if}
                    </div>

                    <div class="contributor-row__optional">
                      {#if !isPresetAffiliation(contributor.affiliation)}
                        <label>
                          <span>Other affiliation (optional)</span>
                          <input
                            value={contributor.affiliation ?? ''}
                            oninput={(event) =>
                              updateContributor(index, {
                                affiliation: (event.currentTarget as HTMLInputElement).value,
                              })}
                            placeholder="Enter unit name"
                          />
                        </label>
                      {/if}

                      <label>
                        <span>Job title (optional)</span>
                        <input
                          value={contributor.profileRole ?? ''}
                          oninput={(event) =>
                            updateContributor(index, {
                              profileRole: (event.currentTarget as HTMLInputElement).value,
                            })}
                          placeholder="For example: Senior Economist"
                        />
                      </label>

                      <label>
                        <span>Profile image (optional)</span>
                        <input
                          value={contributor.profileImage ?? ''}
                          oninput={(event) =>
                            updateContributor(index, {
                              profileImage: (event.currentTarget as HTMLInputElement).value,
                            })}
                          placeholder="/media/researchers/name.jpg"
                        />
                      </label>

                      <label class="full">
                        <span>Bio (optional)</span>
                        <textarea
                          rows="3"
                          value={contributor.bio ?? ''}
                          oninput={(event) =>
                            updateContributor(index, {
                              bio: (event.currentTarget as HTMLTextAreaElement).value,
                            })}
                          placeholder="A short biography for this author."
                        ></textarea>
                      </label>
                    </div>
                  </div>
                {/each}
              </div>
            </div>

          </div>

          <div class="wizard-nav">
            <button type="button" onclick={() => (openStage = 'start')}>Back</button>
            <button type="button" class="primary-button" onclick={() => (openStage = 'edit')}>
              Continue to edit content
            </button>
          </div>
        </div>
      {/if}

      {#if openStage === 'edit'}
        <div class="stage-body">
          <p class="stage-copy">
            Refine the body for the web, insert non-DOCX elements, and set presentation options
            for how the piece should render online.
          </p>

          {#if webWarnings.length}
            <div class="status-panel warning">
              <strong>Web checks</strong>
              <ul>
                {#each webWarnings as issue}
                  <li>{issue}</li>
                {/each}
              </ul>
            </div>
          {/if}

          <details class="presentation-panel">
            <summary class="presentation-panel__summary">Web presentation</summary>

            <div class="presentation-panel__body">
              <div class="presentation-panel__header">
                <span>Configure the front-end presentation options used in the web output.</span>
              </div>

              <div class="presentation-flags">
                <label class="checkbox">
                  <input type="checkbox" bind:checked={metadata.showContents} />
                  <span>Show contents</span>
                </label>
                <label class="checkbox">
                  <input type="checkbox" bind:checked={metadata.featured} />
                  <span>Featured article</span>
                </label>
              </div>

              <div class="presentation-section">
                <strong>Hero</strong>
                <div class="presentation-grid presentation-grid--two">
                  <label>
                    <span>Hero layout</span>
                    <select bind:value={metadata.heroLayout}>
                      <option value="contained">Contained</option>
                      <option value="split">Split</option>
                      <option value="immersive">Immersive</option>
                    </select>
                  </label>
                  <label>
                    <span>Hero position</span>
                    <input bind:value={metadata.heroPosition} />
                  </label>
                  <label>
                    <span>Hero image src</span>
                    <input bind:value={metadata.heroSrc} />
                  </label>
                  <label>
                    <span>Hero alt</span>
                    <input bind:value={metadata.heroAlt} />
                  </label>
                </div>
              </div>

              <div class="presentation-section">
                <strong>Flourish</strong>
                <div class="presentation-grid presentation-grid--single">
                  <label>
                    <span>Flourish width</span>
                    <select bind:value={metadata.flourishWidth}>
                      <option value="prose">Prose</option>
                      <option value="wide">Wide</option>
                    </select>
                  </label>
                </div>
              </div>

              {#if metadata.destination === 'committee-reports'}
                <div class="presentation-section">
                  <strong>Committee video</strong>
                  <div class="presentation-grid presentation-grid--two">
                    <label>
                      <span>Video src</span>
                      <input bind:value={metadata.launchVideoSrc} placeholder="/media/Committee_launch.mp4" />
                    </label>
                    <label>
                      <span>Poster</span>
                      <input bind:value={metadata.launchVideoPoster} placeholder="/media/report-launch-poster.jpg" />
                    </label>
                    <label>
                      <span>Caption</span>
                      <input bind:value={metadata.launchVideoCaption} />
                    </label>
                    <label>
                      <span>Credit</span>
                      <input bind:value={metadata.launchVideoCredit} />
                    </label>
                  </div>
                </div>
              {/if}
            </div>
          </details>

          <div class="editor-layout">
            <div class="editor-shell">
              <div class="editor-menu">
                <span class="editor-menu__label">Formatting</span>
                <select
                  onchange={(event) => {
                    const value = (event.currentTarget as HTMLSelectElement).value;
                    if (!editor) return;
                    if (value === 'p') {
                      editor.chain().focus().setParagraph().run();
                      return;
                    }

                    editor
                      .chain()
                      .focus()
                      .toggleHeading({ level: Number(value) as 1 | 2 | 3 | 4 })
                      .run();
                  }}
                >
                  <option value="p">Paragraph</option>
                  <option value="1">Heading 1</option>
                  <option value="2">Heading 2</option>
                  <option value="3">Heading 3</option>
                  <option value="4">Heading 4</option>
                </select>
                <button type="button" onclick={() => editor?.chain().focus().undo().run()}>Undo</button>
                <button type="button" onclick={() => editor?.chain().focus().redo().run()}>Redo</button>
                <button type="button" onclick={() => editor?.chain().focus().toggleBold().run()}>Bold</button>
                <button type="button" onclick={() => editor?.chain().focus().toggleItalic().run()}>Italic</button>
                <button type="button" onclick={() => editor?.chain().focus().toggleUnderline().run()}>Underline</button>
                <button type="button" onclick={setLink}>Link</button>
                <button type="button" onclick={() => editor?.chain().focus().toggleBulletList().run()}>Bullets</button>
                <button type="button" onclick={() => editor?.chain().focus().toggleOrderedList().run()}>Numbers</button>
                <button type="button" onclick={() => editor?.chain().focus().toggleBlockquote().run()}>Quote</button>
                <span class="editor-menu__label">Blocks</span>
                <button type="button" onclick={insertImageBlock}>Add image</button>
                <button type="button" onclick={insertFlourishBlock}>Add Flourish</button>
              </div>

              <div class="editor-stage">
                <div use:mountEditorHost class="editor-host"></div>
              </div>
            </div>

            <div class="editor-sidebars">
              <aside class="inspector-panel">
                {#if selectedStructuredBlock?.type === 'imageBlock'}
                  <h3>Image block</h3>
                  <label>
                    <span>Image path</span>
                    <input
                      value={String(selectedStructuredBlock.attrs.src ?? '')}
                      oninput={(event) =>
                        updateSelectedStructuredBlock({
                          src: (event.currentTarget as HTMLInputElement).value,
                        })}
                    />
                  </label>
                  <label>
                    <span>Alt text</span>
                    <input
                      value={String(selectedStructuredBlock.attrs.alt ?? '')}
                      oninput={(event) =>
                        updateSelectedStructuredBlock({
                          alt: (event.currentTarget as HTMLInputElement).value,
                        })}
                    />
                  </label>
                  <label>
                    <span>Caption</span>
                    <input
                      value={String(selectedStructuredBlock.attrs.caption ?? '')}
                      oninput={(event) =>
                        updateSelectedStructuredBlock({
                          caption: (event.currentTarget as HTMLInputElement).value,
                        })}
                    />
                  </label>
                  <label>
                    <span>Credit</span>
                    <input
                      value={String(selectedStructuredBlock.attrs.credit ?? '')}
                      oninput={(event) =>
                        updateSelectedStructuredBlock({
                          credit: (event.currentTarget as HTMLInputElement).value,
                        })}
                    />
                  </label>
                  <label>
                    <span>Layout</span>
                    <select
                      value={String(selectedStructuredBlock.attrs.layout ?? 'inline')}
                      onchange={(event) =>
                        updateSelectedStructuredBlock({
                          layout: (event.currentTarget as HTMLSelectElement).value,
                        })}
                    >
                      <option value="inline">Inline</option>
                      <option value="wide">Wide</option>
                      <option value="full">Full</option>
                      <option value="portrait">Portrait</option>
                    </select>
                  </label>
                {:else if selectedStructuredBlock?.type === 'flourishBlock'}
                  <h3>Flourish block</h3>
                  <label>
                    <span>Embed URL</span>
                    <input
                      value={String(selectedStructuredBlock.attrs.dataSrc ?? '')}
                      oninput={(event) =>
                        updateSelectedStructuredBlock({
                          dataSrc: (event.currentTarget as HTMLInputElement).value,
                        })}
                    />
                  </label>
                  <label>
                    <span>Alt text</span>
                    <input
                      value={String(selectedStructuredBlock.attrs.alt ?? '')}
                      oninput={(event) =>
                        updateSelectedStructuredBlock({
                          alt: (event.currentTarget as HTMLInputElement).value,
                        })}
                    />
                  </label>
                  <label>
                    <span>Caption</span>
                    <input
                      value={String(selectedStructuredBlock.attrs.caption ?? '')}
                      oninput={(event) =>
                        updateSelectedStructuredBlock({
                          caption: (event.currentTarget as HTMLInputElement).value,
                        })}
                    />
                  </label>
                  <label>
                    <span>Embed type</span>
                    <select
                      value={String(selectedStructuredBlock.attrs.embedType ?? 'chart')}
                      onchange={(event) =>
                        updateSelectedStructuredBlock({
                          embedType: (event.currentTarget as HTMLSelectElement).value,
                        })}
                    >
                      <option value="chart">Chart</option>
                      <option value="story">Story</option>
                      <option value="visualisation">Visualisation</option>
                    </select>
                  </label>
                  <label>
                    <span>Width</span>
                    <select
                      value={String(selectedStructuredBlock.attrs.width ?? metadata.flourishWidth)}
                      onchange={(event) =>
                        updateSelectedStructuredBlock({
                          width: (event.currentTarget as HTMLSelectElement).value,
                        })}
                    >
                      <option value="wide">Wide</option>
                      <option value="prose">Prose</option>
                    </select>
                  </label>
                {:else if selectedStructuredBlock?.type === 'tableBlock'}
                  {@const tableSummary = summarizeTableHtml(selectedStructuredBlock.attrs.html)}
                  <h3>Table block</h3>
                  <p>Imported tables are preserved as atomic PM blocks.</p>
                  <p>
                    {tableSummary.rows} rows, {tableSummary.columns} columns, {tableSummary.headers}
                    header cells.
                  </p>
                {:else}
                  <h3>Block inspector</h3>
                  <p>Select an image, Flourish block, or imported table to inspect it.</p>
                {/if}
              </aside>
            </div>
          </div>

          <div class="wizard-nav">
            <button type="button" onclick={() => (openStage = 'details')}>Back</button>
            <button type="button" class="primary-button" onclick={() => (openStage = 'preview')}>
              Continue to preview / export
            </button>
          </div>
        </div>
      {/if}

      {#if openStage === 'preview'}
        <div class="stage-body">
          <details class="export-preview" open>
            <summary>Live preview</summary>
            <div class="preview-frame">
              {#if renderedPreview}
                <StoryPage story={renderedPreview.story} />
              {:else}
                <div class="preview-placeholder">
                  <h2>Preview</h2>
                  <p>Start a draft or import a document to generate a live preview.</p>
                </div>
              {/if}
            </div>
          </details>

          <div class="publish-panel">
            <div class="publish-panel__copy">
              <strong>Preview and export</strong>
              <span>
                Review the rendered output and download the canonical JSON/XML artefacts derived
                from the current PM document.
              </span>
            </div>
            <div class="publish-panel__actions">
              <button type="button" onclick={() => (openStage = 'edit')}>Back</button>
              <div class="publish-panel__actions-right">
                <button type="button" class="primary-button" onclick={downloadCanonicalJson} disabled={!canonicalDocument}>
                  Download JSON
                </button>
                <button type="button" onclick={downloadCanonicalXml} disabled={!canonicalXml || !canonicalDocument}>
                  Download XML
                </button>
                <button type="button" onclick={copyProseMirrorJson} disabled={!editorDocument}>
                  Copy ProseMirror JSON
                </button>
              </div>
            </div>
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

          {#if canonicalXml}
            <details class="export-preview">
              <summary>Canonical XML</summary>
              <pre>{canonicalXml}</pre>
            </details>
          {/if}
        </div>
      {/if}
    </section>
  </div>
</div>

<style>
  .publisher-scope {
    color: #262626;
    background: #f4f4f2;
    font-family:
      "IBM Plex Sans",
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
    font-size: 16px;
    line-height: 1.5;
    min-height: 100vh;
    padding: 1.15rem 1.1rem 2rem;
  }

  .publisher-scope,
  .publisher-scope * {
    box-sizing: border-box;
  }

  .publisher-scope button,
  .publisher-scope input,
  .publisher-scope select,
  .publisher-scope textarea {
    font: inherit;
  }

  .publisher-scope button {
    background: #fafaf8;
    border: 1px solid #d7d7d2;
    border-radius: 4px;
    color: #262626;
    cursor: pointer;
    padding: 0.58rem 0.82rem;
    transition:
      border-color 120ms ease,
      background-color 120ms ease,
      color 120ms ease,
      box-shadow 120ms ease;
  }

  .publisher-scope button:hover {
    background: #f0f0ed;
    border-color: #b8b8b2;
  }

  .publisher-scope button:disabled {
    color: #888882;
    cursor: not-allowed;
  }

  .publisher-scope input,
  .publisher-scope select,
  .publisher-scope textarea {
    width: 100%;
    background: #fafaf8;
    border: 1px solid #d7d7d2;
    border-radius: 4px;
    color: #262626;
    padding: 0.65rem 0.8rem;
  }

  .publisher-scope textarea {
    resize: vertical;
  }

  .publisher-scope input[type='checkbox'] {
    width: auto;
  }

  .publisher-scope button:focus-visible,
  .publisher-scope input:focus-visible,
  .publisher-scope select:focus-visible,
  .publisher-scope textarea:focus-visible,
  .publisher-scope summary:focus-visible {
    outline: 2px solid #111111;
    outline-offset: 2px;
  }

  .container {
    display: grid;
    gap: 0.7rem;
    margin: 0 auto;
    max-width: 1320px;
  }

  .stage-nav {
    display: grid;
    gap: 0.55rem;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .stage-pill {
    align-items: flex-start;
    display: flex;
    min-height: 3.35rem;
    padding: 0.75rem 0.9rem;
    text-align: left;
    white-space: normal;
    color: #4f4f4f;
    font-size: 0.95rem;
    font-weight: 550;
  }

  .stage-pill.active {
    background: #efefec;
    border-color: #b8b8b2;
    color: #262626;
    box-shadow: inset 0 3px 0 #262626;
    font-weight: 600;
  }

  .status-strip {
    display: grid;
    gap: 0.55rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .status-card {
    display: grid;
    gap: 0.15rem;
    padding: 0.5rem 0.1rem 0.55rem;
    background: transparent;
    border: 0;
    border-bottom: 1px solid #dddcd5;
    border-radius: 0;
    box-shadow: none;
  }

  .status-card strong {
    font-size: 0.74rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #555550;
  }

  .status-card span {
    color: #72726c;
    font-size: 0.86rem;
  }

  .publish-message,
  .status-panel {
    background: #fafaf8;
    border: 1px solid #d7d7d2;
    border-radius: 4px;
    padding: 0.8rem 0.95rem;
  }

  .publish-message.error,
  .status-panel.error {
    border-color: #b9a8a8;
    background: #f6f2f1;
  }

  .publish-message.success {
    border-color: #c6ccc1;
    background: #f1f3ef;
  }

  .draft-status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.7rem 0.95rem;
    background: #f1f3ef;
    border: 1px solid #c6ccc1;
    border-radius: 4px;
    color: #394239;
    flex-wrap: wrap;
  }

  .draft-status-bar span {
    font-size: 0.9rem;
  }

  .draft-status-actions {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
  }

  .status-panel.warning {
    border-color: #cfc8b3;
    background: #f6f4ec;
  }

  .status-panel ul {
    margin: 0.55rem 0 0;
    padding-left: 1.1rem;
  }

  .stage-section {
    background: #fafaf8;
    border: 1px solid #d7d7d2;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 8px 20px rgba(38, 38, 38, 0.03);
  }

  .stage-heading {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    padding: 0.8rem 0.95rem;
    background: #efefec;
  }

  .stage-heading span {
    color: #262626;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .stage-heading strong {
    color: #555555;
    font-size: 0.92rem;
    font-weight: 600;
  }

  .stage-body {
    display: grid;
    gap: 0.8rem;
    padding: 0.9rem;
  }

  .stage-copy {
    margin: 0;
    color: #555555;
    line-height: 1.45;
    max-width: 42rem;
    font-size: 0.95rem;
  }

  .stage-body--start {
    gap: 0.7rem;
  }

  .workflow-grid {
    display: grid;
    gap: 0.7rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .workflow-card {
    display: grid;
    gap: 0.55rem;
    align-content: start;
    min-height: 12rem;
    padding: 0.9rem;
    border: 1px solid #d7d7d2;
    border-radius: 4px;
    background: #f7f7f4;
  }

  .workflow-card strong {
    font-size: 1rem;
  }

  .workflow-card span {
    color: #555555;
    font-size: 0.92rem;
  }

  .workflow-note {
    margin: 0;
    color: #555555;
    font-size: 0.88rem;
  }

  .file-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    padding: 0.58rem 0.82rem;
    border: 1px solid #d7d7d2;
    border-radius: 4px;
    background: #fafaf8;
    cursor: pointer;
  }

  .file-label input {
    display: none;
  }

  .wizard-nav,
  .publish-panel__actions {
    display: flex;
    gap: 0.6rem;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
  }

  .primary-button {
    background: #262626 !important;
    border-color: #262626 !important;
    color: #fafaf8 !important;
  }

  .destructive-button {
    background: #f7ecea !important;
    border-color: #c78f87 !important;
    color: #7e2f24 !important;
  }

  .destructive-button:hover {
    background: #f2e0dc !important;
    border-color: #b56d62 !important;
  }

  .form-grid {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .form-grid label,
  .inspector-panel label {
    display: grid;
    gap: 0.35rem;
  }

  .form-grid > .full,
  .form-grid label.full {
    grid-column: 1 / -1;
  }

  .form-grid span,
  .inspector-panel span {
    color: #303030;
    font-size: 0.84rem;
    font-weight: 600;
  }

  .checkbox {
    display: flex !important;
    align-items: center;
    gap: 0.55rem;
  }

  .checkbox span {
    margin: 0;
  }

  .contributor-panel {
    display: grid;
    gap: 0.7rem;
    padding: 0.85rem;
    border: 1px solid #d7d7d2;
    border-radius: 4px;
    background: #f7f7f4;
  }

  .contributor-panel__header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
  }

  .contributor-panel__actions {
    display: flex;
    align-items: center;
    gap: 0.9rem;
  }

  .contributors {
    display: grid;
    gap: 0.55rem;
  }

  .contributor-row {
    display: grid;
    gap: 0.8rem;
    padding: 0.8rem;
    border: 1px solid #dfdfda;
    border-radius: 4px;
    background: #fafaf8;
  }

  .contributor-row__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .contributor-row__header strong {
    font-size: 0.95rem;
  }

  .contributor-row__core {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: minmax(9rem, 1fr) minmax(9rem, 1fr) minmax(8rem, 0.8fr) minmax(14rem, 1.3fr) minmax(11rem, 1fr) auto;
  }

  .contributor-row__optional {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    padding-top: 0.8rem;
    border-top: 1px solid #e4e4de;
  }

  .contributor-row__optional .full {
    grid-column: 1 / -1;
  }

  .contributor-show-author {
    align-self: end;
    padding-bottom: 0.2rem;
  }

  .presentation-panel {
    display: grid;
    border: 1px solid #d7d7d2;
    border-radius: 4px;
    background: #f7f7f4;
    overflow: hidden;
  }

  .presentation-panel__summary {
    align-items: center;
    background: #f4f4f1;
    border-left: 4px solid #b8b8b2;
    color: #303030;
    cursor: pointer;
    display: flex;
    font-size: 0.95rem;
    font-weight: 700;
    justify-content: space-between;
    list-style: none;
    padding: 0.9rem 1rem;
  }

  .presentation-panel__summary::-webkit-details-marker {
    display: none;
  }

  .presentation-panel__summary::after {
    color: #666660;
    content: '+';
    font-size: 1rem;
    font-weight: 500;
  }

  .presentation-panel[open] .presentation-panel__summary::after {
    content: '−';
  }

  .presentation-panel__body {
    display: grid;
    gap: 0.9rem;
    padding: 0.95rem;
  }

  .presentation-panel__header {
    display: grid;
    gap: 0.2rem;
  }

  .presentation-panel__header span {
    color: #555555;
    font-size: 0.92rem;
    line-height: 1.4;
  }

  .presentation-flags {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .presentation-section {
    display: grid;
    gap: 0.65rem;
  }

  .presentation-section > strong {
    font-size: 0.95rem;
  }

  .presentation-grid {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .presentation-grid--two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .presentation-grid--single {
    grid-template-columns: minmax(0, 20rem);
  }

  .presentation-grid label {
    display: grid;
    gap: 0.35rem;
  }

  .presentation-grid span {
    color: #303030;
    font-size: 0.84rem;
    font-weight: 600;
  }

  .editor-layout {
    display: grid;
    gap: 0.85rem;
    grid-template-columns: minmax(0, 1fr) 20rem;
    align-items: start;
  }

  .editor-shell {
    display: grid;
    gap: 0.7rem;
  }

  .editor-menu {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    align-items: center;
    padding: 0.7rem 0.8rem;
    border: 1px solid #d7d7d2;
    border-radius: 4px;
    background: #f2f2ef;
  }

  .editor-menu__label {
    color: #555555;
    font-size: 0.77rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .editor-menu select {
    width: auto;
    min-width: 8rem;
    background: #fafaf8;
  }

  .editor-stage {
    min-height: 0;
    border: 1px solid #d7d7d2;
    border-radius: 4px;
    background: #fffdfa;
    overflow: auto;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  }

  .editor-host {
    min-height: 70vh;
  }

  .inspector-panel {
    display: grid;
    align-content: start;
    gap: 0.65rem;
    padding: 0.85rem;
    border: 1px solid #d7d7d2;
    border-radius: 4px;
    background: #f7f7f4;
  }

  .editor-sidebars {
    display: grid;
    gap: 0.85rem;
    align-content: start;
  }

  .inspector-panel h3,
  .preview-placeholder h2 {
    margin: 0;
  }

  .inspector-panel p {
    margin: 0;
    color: #555555;
    line-height: 1.45;
  }

  .publish-panel {
    display: grid;
    gap: 0.65rem;
    padding: 0.9rem;
    border: 1px solid #d7d7d2;
    border-radius: 4px;
    background: #f7f7f4;
  }

  .publish-panel__copy {
    display: grid;
    gap: 0.25rem;
  }

  .publish-panel__copy span {
    color: #555555;
    font-size: 0.92rem;
  }

  .publish-panel__actions-right {
    display: flex;
    gap: 0.65rem;
    flex-wrap: wrap;
  }

  .path-hint {
    margin: 0;
    color: #555555;
    font-size: 0.92rem;
    line-height: 1.45;
  }

  .path-hint code {
    display: inline-block;
    margin-top: 0.18rem;
    padding: 0.1rem 0.3rem;
    background: #efefec;
    border: 1px solid #d7d7d2;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  .export-preview {
    border: 1px solid #d7d7d2;
    border-radius: 4px;
    background: #fafaf8;
    overflow: hidden;
  }

  .export-preview summary {
    align-items: center;
    background: #f5f5f2;
    border-left: 4px solid #d0d0ca;
    color: #303030;
    padding: 0.8rem 0.95rem;
    cursor: pointer;
    display: flex;
    font-weight: 600;
    justify-content: space-between;
    list-style: none;
  }

  .export-preview summary::-webkit-details-marker {
    display: none;
  }

  .export-preview summary::after {
    color: #666660;
    content: '+';
    font-size: 1rem;
    font-weight: 500;
  }

  .export-preview[open] summary::after {
    content: '−';
  }

  .export-preview pre {
    margin: 0;
    padding: 0.95rem;
    overflow: auto;
    font-size: 0.82rem;
    background: #fafaf8;
  }

  .preview-frame {
    background: #ffffff;
  }

  .preview-placeholder {
    max-width: 36rem;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
    color: #4c5967;
  }

  :global(.publisher-editor__content) {
    min-height: 70vh;
    max-width: 48rem;
    margin: 0 auto;
    padding: 1.6rem 1.35rem 2rem;
    outline: none;
    color: #1f1f1f;
    line-height: 1.72;
    font-size: 1rem;
    font-family:
      "IBM Plex Serif",
      "Georgia",
      serif;
  }

  :global(.publisher-editor__content > *:first-child) {
    margin-top: 0;
  }

  :global(.publisher-editor__content p) {
    margin: 0 0 1.05rem;
  }

  :global(.publisher-editor__content h1),
  :global(.publisher-editor__content h2),
  :global(.publisher-editor__content h3),
  :global(.publisher-editor__content h4) {
    margin: 1.6rem 0 0.75rem;
    color: #202020;
    line-height: 1.12;
    font-family:
      "IBM Plex Sans",
      system-ui,
      sans-serif;
  }

  :global(.publisher-editor__content ul),
  :global(.publisher-editor__content ol) {
    margin: 0 0 1rem 1.25rem;
  }

  :global(.publisher-editor__content blockquote) {
    margin: 1.2rem 0;
    padding: 0.2rem 0 0.2rem 1rem;
    border-left: 3px solid #8d8d87;
    color: #555555;
  }

  :global(.publisher-editor__content a) {
    color: #1f1f1f;
    text-decoration-thickness: 1px;
  }

  :global(.publisher-editor__content .is-editor-empty:first-child::before) {
    color: #8a8a84;
    font-style: normal;
  }

  :global(.stor-embedded-block) {
    display: grid;
    gap: 0.35rem;
    margin: 1rem 0;
    padding: 0.9rem;
    border: 1px solid #d7d7d2;
    border-radius: 4px;
    background: #f3f3f0;
  }

  :global(.stor-embedded-block__eyebrow) {
    color: #555555;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  :global(.stor-embedded-block__text),
  :global(.stor-embedded-block__meta) {
    margin: 0;
  }

  @media (max-width: 980px) {
    .stage-nav,
    .status-strip,
    .workflow-grid,
    .editor-layout {
      grid-template-columns: 1fr;
    }

    .presentation-grid,
    .contributor-row__core,
    .contributor-row__optional {
      grid-template-columns: 1fr 1fr;
    }

    .presentation-grid--single {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .publisher-scope {
      padding-left: 0.8rem;
      padding-right: 0.8rem;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .presentation-grid,
    .contributor-row__core,
    .contributor-row__optional {
      grid-template-columns: 1fr;
    }

    .stage-heading,
    .publish-panel__actions,
    .wizard-nav {
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
