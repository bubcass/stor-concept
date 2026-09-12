<script lang="ts">
  import { base } from '$app/paths';
  import { onDestroy, onMount } from 'svelte';
  import type { Story, StoryBlock } from '$lib/content/types';
  import { BOOKMARK_KEY, readBookmarks } from './bookmarks';
  import { plainText, storyBlockCopy } from './storyToolbar';

  type AudioManifestEntry = {
    src: string;
    generatedAt: string;
    provider: string;
  };

  type PrintTheme = {
    sectionLabel: string;
    documentLabel: string;
    accent: string;
    accentStrong: string;
    accentSoft: string;
    accentSoftRgb: string;
    inkSubtle: string;
    paperTint: string;
    titleFont: string;
    bodyFont: string;
    heroTreatment: 'band' | 'card';
  };

  let { story }: { story: Story } = $props();

  let isClient = $state(false);
  let isPlaying = $state(false);
  let isBookmarked = $state(false);
  let isLoadingAudio = $state(false);
  let citationCopied = $state(false);
  let toolbarFeedback = $state('');
  let generatedAudioSrc = $state<string | null>(null);
  let isDarkTheme = $state(false);
  let utterance: SpeechSynthesisUtterance | null = null;
  let audio: HTMLAudioElement | null = null;

  let storyAudioText = $derived(
    [story.title, story.dek, ...story.blocks.map(storyBlockCopy)]
      .filter(Boolean)
      .map((part) => plainText(part))
      .join(' ')
  );

  let playbackLabel = $derived.by(() => {
    if (generatedAudioSrc) {
      if (isLoadingAudio) return 'Loading audio';
      return isPlaying ? 'Pause listening' : 'Listen';
    }

    return isPlaying ? 'Stop listening' : 'Listen to the article';
  });

  function toggleTheme() {
    window.dispatchEvent(new Event('stor:toggle-theme'));
  }

  function storyUrl() {
    if (!isClient) return `${base}/articles/${story.slug}/`;
    return window.location.href;
  }

  function assetUrl(path: string, version?: string) {
    if (!isClient) {
      return version ? `${base}${path}?v=${version}` : `${base}${path}`;
    }

    const url = new URL(`${base}${path}`, window.location.origin);
    if (version) {
      url.searchParams.set('v', version);
    }

    return url.toString();
  }

  function clearFeedbackSoon() {
    window.setTimeout(() => {
      toolbarFeedback = '';
    }, 1800);
  }

  function clearCitationSoon() {
    window.setTimeout(() => {
      citationCopied = false;
    }, 1800);
  }

  function citationUrl() {
    if (!isClient) return `https://bubcass.github.io${base}/articles/${story.slug}/`;
    return window.location.href;
  }

  function mlaCitation() {
    const author = story.researcher?.name ?? story.byline;
    const title = story.title;
    const siteName = 'Stór';
    const publisher = 'Houses of the Oireachtas';
    const date = story.date;
    const url = citationUrl();

    return `${author}. "${title}." ${siteName}, ${publisher}, ${date}, ${url}.`;
  }

  function escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function titleCaseLabel(value: string | undefined) {
    if (!value) return 'Article';
    return value
      .split('-')
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(' ');
  }

  function printThemeForStory(story: Story): PrintTheme {
    if (story.section === 'library-research-service') {
      return {
        sectionLabel: 'Library & Research Service',
        documentLabel: story.documentType === 'bill-digest' ? 'Bill Digest' : titleCaseLabel(story.documentType),
        accent: '#5ea03b',
        accentStrong: '#38498e',
        accentSoft: '#e8f1df',
        accentSoftRgb: '232, 241, 223',
        inkSubtle: '#6d7267',
        paperTint: '#f8fbf4',
        titleFont: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
        bodyFont: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
        heroTreatment: 'card'
      };
    }

    if (story.section === 'parliamentary-budget-office') {
      return {
        sectionLabel: 'Parliamentary Budget Office',
        documentLabel: titleCaseLabel(story.documentType ?? 'briefing'),
        accent: '#7b1b5e',
        accentStrong: '#5f1448',
        accentSoft: '#f3e7ef',
        accentSoftRgb: '243, 231, 239',
        inkSubtle: '#6c5d67',
        paperTint: '#fbf7fa',
        titleFont: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
        bodyFont: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
        heroTreatment: 'band'
      };
    }

    if (story.section === 'committees') {
      return {
        sectionLabel: story.committeeName ?? 'Committee report',
        documentLabel: 'Committee Report',
        accent: '#6a8794',
        accentStrong: '#426474',
        accentSoft: '#e7eef2',
        accentSoftRgb: '231, 238, 242',
        inkSubtle: '#5f727c',
        paperTint: '#fafcfd',
        titleFont: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
        bodyFont: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
        heroTreatment: 'card'
      };
    }

    return {
      sectionLabel: 'Stór',
      documentLabel: titleCaseLabel(story.documentType),
      accent: '#6b5922',
      accentStrong: '#40330f',
      accentSoft: '#f2ecdd',
      accentSoftRgb: '242, 236, 221',
      inkSubtle: '#5f5a50',
      paperTint: '#fffdf8',
      titleFont: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
      bodyFont: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
      heroTreatment: 'card'
    };
  }

  function renderPrintableBlock(block: StoryBlock) {
    switch (block.type) {
      case 'text':
        return [
          block.heading ? `<h2>${escapeHtml(block.heading)}</h2>` : '',
          ...block.paragraphs.map((paragraph) => `<p>${escapeHtml(plainText(paragraph))}</p>`)
        ].join('');
      case 'media-text':
        return [
          block.heading ? `<h2>${escapeHtml(block.heading)}</h2>` : '',
          ...block.paragraphs.map((paragraph) => `<p>${escapeHtml(plainText(paragraph))}</p>`)
        ].join('');
      case 'quote':
        return [
          '<blockquote>',
          `<p>${escapeHtml(block.text)}</p>`,
          block.attribution ? `<footer>${escapeHtml(block.attribution)}</footer>` : '',
          '</blockquote>'
        ].join('');
      case 'scrolly':
        return [
          `<h2>${escapeHtml(block.title)}</h2>`,
          block.intro ? `<p>${escapeHtml(block.intro)}</p>` : '',
          ...block.steps.flatMap((step) => [
            `<h3>${escapeHtml(step.title)}</h3>`,
            `<p>${escapeHtml(step.body)}</p>`
          ])
        ].join('');
      case 'scene-scrolly':
        return [
          block.title ? `<h2>${escapeHtml(block.title)}</h2>` : '',
          block.intro ? `<p>${escapeHtml(block.intro)}</p>` : '',
          ...block.steps.flatMap((step) => [
            `<h3>${escapeHtml(step.title)}</h3>`,
            `<p>${escapeHtml(step.body)}</p>`
          ])
        ].join('');
      case 'link-list':
        return [
          block.heading ? `<h2>${escapeHtml(block.heading)}</h2>` : '',
          '<ul>',
          ...block.links.map(
            (link) =>
              `<li><strong>${escapeHtml(link.label)}</strong>${
                link.description ? `: ${escapeHtml(link.description)}` : ''
              }</li>`
          ),
          '</ul>'
        ].join('');
      case 'arcgis-map':
        return [
          block.title ? `<h2>${escapeHtml(block.title)}</h2>` : '',
          block.caption ? `<p>${escapeHtml(block.caption)}</p>` : ''
        ].join('');
      case 'image':
        return [
          block.heading ? `<h2>${escapeHtml(block.heading)}</h2>` : '',
          block.image.caption ? `<p>${escapeHtml(block.image.caption)}</p>` : ''
        ].join('');
      case 'table':
        return `<div class="print-table">${block.html}</div>`;
      case 'committee-members':
        return [
          block.heading ? `<h2>${escapeHtml(block.heading)}</h2>` : '<h2>Committee membership</h2>',
          '<div class="print-membership">',
          ...block.members.map(
            (member) => `
              <article class="print-member-card">
                <p class="print-member-name">${escapeHtml(member.name)}</p>
                ${member.role ? `<p class="print-member-role">${escapeHtml(member.role)}</p>` : ''}
              </article>
            `
          ),
          '</div>'
        ].join('');
      default:
        return '';
    }
  }

  function printableHeadingEntries(blocks: StoryBlock[]) {
    return blocks.flatMap((block) => {
      switch (block.type) {
        case 'text':
        case 'media-text':
        case 'image':
          return block.heading ? [block.heading] : [];
        case 'scrolly':
          return [block.title, ...block.steps.map((step) => step.title)].filter(Boolean);
        case 'scene-scrolly':
          return [block.title, ...block.steps.map((step) => step.title)].filter(Boolean);
        case 'link-list':
          return block.heading ? [block.heading] : [];
        case 'arcgis-map':
          return block.title ? [block.title] : [];
        case 'committee-members':
          return [block.heading ?? 'Committee membership'];
        default:
          return [];
      }
    });
  }

  function buildContentsSection(theme: PrintTheme, headings: string[], citation?: string) {
    if (!headings.length) return '';

    return `
      <section class="boilerplate boilerplate--contents page-break">
        <p class="boilerplate__kicker">${escapeHtml(theme.sectionLabel)} | ${escapeHtml(theme.documentLabel)}</p>
        <h2>Contents</h2>
        <ol class="contents-list">
          ${headings.map((heading) => `<li>${escapeHtml(heading)}</li>`).join('')}
        </ol>
        ${citation
          ? `<div class="citation-box"><p class="citation-box__label">Recommended citation</p><p>${escapeHtml(citation)}</p></div>`
          : ''}
      </section>
    `;
  }

  function buildPrintBoilerplate(theme: PrintTheme, author: string, researcherLine: string) {
    const headings = printableHeadingEntries(story.blocks);
    const authorLine = researcherLine ? `${author} · ${researcherLine}` : author;
    const lockupUrl = assetUrl('/brand/inside-parliament-lockup.svg', `print-${story.slug}`);
    const pboCoverUrl = assetUrl('/brand/pbo-cover-reference.png', `print-${story.slug}`);
    const committeeCoverUrl = assetUrl('/brand/committee-cover-reference.png', `print-${story.slug}`);
    const headingEntries = headings.filter((heading): heading is string => Boolean(heading));

    if (story.section === 'library-research-service') {
      const citation = `Oireachtas Library & Research Service, ${story.date}. ${theme.documentLabel}: ${story.title}.`;
      return {
        preface: `
          <section class="cover cover--lrs">
            <div class="cover__rings" aria-hidden="true"></div>
            <div class="cover__brand-ribbon">
              <span>Seirbhís Leabharlainne &amp; Taighde</span>
              <span>Library &amp; Research Service</span>
            </div>
            <div class="cover__badge">Bill Digest</div>
            <div class="cover__body">
              <h1 class="cover__title">${escapeHtml(story.title)}</h1>
              <p class="cover__publication">${escapeHtml(theme.documentLabel)}</p>
              <p class="cover__meta">${escapeHtml(authorLine)}</p>
              <p class="cover__meta">${escapeHtml(story.date)}</p>
              <div class="cover__abstract">
                <h2>Abstract</h2>
                <p>${escapeHtml(plainText(story.dek))}</p>
              </div>
            </div>
            <div class="cover__footer-mark">
              <img src="${lockupUrl}" alt="Houses of the Oireachtas" />
            </div>
          </section>
          ${buildContentsSection(theme, headingEntries, citation)}
        `,
        outro: `
          <section class="boilerplate boilerplate--contact page-break">
            <h2>Contact</h2>
            <p>Houses of the Oireachtas<br />Leinster House<br />Kildare Street<br />Dublin 2<br />D02 XR20</p>
            <p><strong>Library &amp; Research Service</strong><br />Tel: +353 (0)1 6184701<br />Email: library.and.research@oireachtas.ie</p>
            <p>www.oireachtas.ie</p>
          </section>
        `
      };
    }

    if (story.section === 'parliamentary-budget-office') {
      return {
        preface: `
          <section class="cover cover--pbo-reference" style="--pbo-cover-image: url('${pboCoverUrl}')">
            <div class="cover__pbo-title-mask" aria-hidden="true"></div>
            <div class="cover__pbo-publication-mask" aria-hidden="true"></div>
            <div class="cover__pbo-title-wrap">
              <h1 class="cover__pbo-title">${escapeHtml(story.title)}</h1>
            </div>
          </section>
          ${buildContentsSection(theme, headingEntries)}
          <section class="boilerplate boilerplate--legal page-break">
            <h2>Séanadh</h2>
            <p>Is í an Oifig Buiséid Pharlaiminteach (OBP) a d’ullmhaigh an doiciméad seo mar áis do Chomhaltaí Thithe an Oireachtais ina gcuid dualgas parlaiminteach. Ní beartáitéar é a bheith uileghabhálach ná críochnúil. Féadfaidh an OBP aon fhaisnéis atá ann a bhaint as nó a leasú aon tráth gan fógra roimh ré. Níl an OBP freagrach as aon tagairtí d’aon fhaisnéis atá á cothabháil ag tríú páirtithe nó naisc chuig aon fhaisnéis den sórt sin ná as ábhar aon fhaisnéise den sórt sin. Tá baill foirne an OBP ar fáil chun ábhar na bpáipéar seo a phlé le Comhaltaí agus lena gcuid foirne ach ní féidir leo dul i mbun plé leis an mórphobal nó le heagraíochtaí seachtracha.</p>
            <h2>Disclaimer</h2>
            <p>This document has been prepared by the Parliamentary Budget Office (PBO) for use by the Members of the Houses of the Oireachtas to aid them in their parliamentary duties. It is not intended to be either comprehensive or definitive. The PBO may remove, vary or amend any information contained therein at any time without prior notice. The PBO accepts no responsibility for any references or links to or the content of any information maintained by third parties. Staff of the PBO are available to discuss the contents of these papers with Members and their staff but cannot enter into discussions with members of the general public or external organisations.</p>
            <p>The Information is general in nature. Forward-looking statements involve uncertainties and matters may develop significantly from the Information. The Information does not provide a definitive statement in relation to any specific issue or personal circumstance. It does not constitute advice. You must satisfy yourself as to the suitability and any reliability of the Information that we provide. We accept no liability for, and give no guarantees, undertakings or warranties concerning, the accuracy or suitability or otherwise, of the Information.</p>
          </section>
        `,
        outro: `
          <section class="boilerplate boilerplate--contact page-break">
            <h2>Contact</h2>
            <p>Parliamentary Budget Office<br />Email: pbo@oireachtas.ie<br />Web: www.oireachtas.ie/PBO</p>
            <p>Publication date: ${escapeHtml(story.date)}</p>
          </section>
        `
      };
    }

    if (story.section === 'committees') {
      return {
        preface: `
          <section class="cover cover--committee-reference" style="--committee-cover-image: url('${committeeCoverUrl}')">
            <div class="cover__committee-panel">
              <h1 class="cover__committee-name">${escapeHtml(story.committeeName ?? 'Committee report')}</h1>
              <h2 class="cover__committee-title">${escapeHtml(story.title)}</h2>
              <p class="cover__committee-date">${escapeHtml(story.date)}</p>
            </div>
          </section>
          ${buildContentsSection(theme, headingEntries)}
        `,
        outro: ''
      };
    }

    return { preface: '', outro: '' };
  }

  function stopSpeechPlayback() {
    if (!isClient || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    utterance = null;
    isPlaying = false;
  }

  function setMediaSessionPlaybackState(state: MediaSessionPlaybackState) {
    if (!isClient || !('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = state;
  }

  function clearMediaSession() {
    if (!isClient || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'none';

    for (const action of ['play', 'pause', 'stop', 'seekbackward', 'seekforward'] as const) {
      navigator.mediaSession.setActionHandler(action, null);
    }
  }

  function configureMediaSession() {
    if (!isClient || !audio || !generatedAudioSrc || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = null;
    const artworkVersion = `story-${story.slug}-${Date.now()}`;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: story.title,
      artist: 'Stór',
      album: 'Stór',
      artwork: [
        {
          src: assetUrl('/brand/Stór.png', artworkVersion),
          sizes: '1080x1350',
          type: 'image/png'
        }
      ]
    });

    navigator.mediaSession.setActionHandler('play', () => {
      void audio?.play();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      audio?.pause();
    });

    navigator.mediaSession.setActionHandler('stop', () => {
      stopAudioPlayback();
    });

    navigator.mediaSession.setActionHandler('seekbackward', () => {
      if (!audio) return;
      audio.currentTime = Math.max(audio.currentTime - 10, 0);
    });

    navigator.mediaSession.setActionHandler('seekforward', () => {
      if (!audio || !Number.isFinite(audio.duration)) return;
      audio.currentTime = Math.min(audio.currentTime + 10, audio.duration);
    });
  }

  function stopAudioPlayback() {
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    setMediaSessionPlaybackState('paused');
  }

  function stopAllPlayback() {
    stopSpeechPlayback();
    stopAudioPlayback();
  }

  function playGeneratedAudio() {
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      setMediaSessionPlaybackState('paused');
      return;
    }

    stopSpeechPlayback();
    isLoadingAudio = true;

    void audio.play()
      .then(() => {
        isLoadingAudio = false;
        isPlaying = true;
      })
      .catch((error) => {
        console.error(error);
        isLoadingAudio = false;
        isPlaying = false;
      });
  }

  function playSpeechFallback() {
    if (!isClient || !window.speechSynthesis || !storyAudioText) return;

    if (isPlaying) {
      stopSpeechPlayback();
      return;
    }

    stopAllPlayback();
    clearMediaSession();

    utterance = new SpeechSynthesisUtterance(storyAudioText);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => {
      isPlaying = false;
      utterance = null;
    };
    utterance.onerror = () => {
      isPlaying = false;
      utterance = null;
    };

    isPlaying = true;
    window.speechSynthesis.speak(utterance);
  }

  function togglePlayback() {
    if (generatedAudioSrc) {
      playGeneratedAudio();
      return;
    }

    playSpeechFallback();
  }

  async function shareStory() {
    if (!isClient) return;

    const shareData = {
      title: story.title,
      text: plainText(story.dek),
      url: storyUrl()
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if ((error as DOMException)?.name === 'AbortError') return;
      }
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareData.url);
      toolbarFeedback = 'Link copied';
      clearFeedbackSoon();
    }
  }

  function openPrintView() {
    if (!isClient) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const author = story.researcher?.name ?? story.byline;
    const researcherLine = story.researcher
      ? [story.researcher.role, story.researcher.organisation].filter(Boolean).join(' | ')
      : '';
    const articleBody = story.blocks.map(renderPrintableBlock).filter(Boolean).join('');
    const theme = printThemeForStory(story);
    const boilerplate = buildPrintBoilerplate(theme, author, researcherLine);

    const printableHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(story.title)} | Stór</title>
    <style>
      :root {
        color-scheme: light;
        --print-accent: ${theme.accent};
        --print-accent-strong: ${theme.accentStrong};
        --print-accent-soft: ${theme.accentSoft};
        --print-accent-soft-rgb: ${theme.accentSoftRgb};
        --print-ink-subtle: ${theme.inkSubtle};
        --print-paper-tint: ${theme.paperTint};
        --print-title-font: ${theme.titleFont};
        --print-body-font: ${theme.bodyFont};
      }
      * {
        box-sizing: border-box;
      }
      @page {
        margin: 18mm 16mm 18mm;
      }
      body {
        color: #24211a;
        font-family: var(--print-body-font);
        line-height: 1.6;
        margin: 0;
        padding: 2rem 0 3rem;
        background:
          linear-gradient(180deg, var(--print-paper-tint) 0, var(--print-paper-tint) 11rem, #fff 11rem, #fff 100%);
      }
      main {
        margin: 0 auto;
        max-width: 45rem;
        padding: 0 1.5rem;
      }
      .print-shell {
        background: #fff;
      }
      .page-break {
        break-before: page;
        page-break-before: always;
      }
      .print-chrome {
        align-items: baseline;
        color: var(--print-ink-subtle);
        display: flex;
        font-size: 0.82rem;
        gap: 1rem;
        justify-content: space-between;
        letter-spacing: 0.03em;
        margin: 0 auto 2rem;
        max-width: 45rem;
        padding: 0 1.5rem;
      }
      .print-chrome__section {
        color: var(--print-accent-strong);
        font-weight: 700;
      }
      .cover {
        min-height: calc(100vh - 6rem);
        page-break-after: always;
        position: relative;
      }
      .cover--lrs {
        background:
          linear-gradient(180deg, rgba(var(--print-accent-soft-rgb), 0.45) 0%, rgba(255,255,255,0) 22%),
          linear-gradient(180deg, #fff 0%, #fff 100%);
        overflow: hidden;
        padding: 1rem 0 2rem;
      }
      .cover--pbo {
        background: linear-gradient(160deg, var(--print-accent-strong), #7d215f 60%, #5a123f 100%);
        color: white;
        overflow: hidden;
        padding: 1.5rem 0 2rem;
      }
      .cover--pbo-reference {
        aspect-ratio: 1060 / 1506;
        background-color: #731554;
        background-image: var(--pbo-cover-image);
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
        min-height: auto;
        overflow: hidden;
        padding: 0;
      }
      .cover--committee-reference {
        aspect-ratio: 1414 / 2000;
        background-color: white;
        background-image: var(--committee-cover-image);
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
        min-height: auto;
        overflow: hidden;
        padding: 0;
      }
      .cover__rings {
        background:
          radial-gradient(circle at -14% 45%, rgba(var(--print-accent-soft-rgb), 0.65) 0 28%, transparent 28% 100%),
          radial-gradient(circle at -12% 45%, rgba(var(--print-accent-soft-rgb), 0.42) 0 34%, transparent 34% 100%),
          radial-gradient(circle at -10% 45%, rgba(var(--print-accent-soft-rgb), 0.24) 0 40%, transparent 40% 100%);
        inset: 0;
        position: absolute;
      }
      .cover__mesh {
        background:
          linear-gradient(145deg, transparent 0 38%, rgba(255,255,255,0.9) 38% 38.6%, transparent 38.6% 100%),
          linear-gradient(35deg, transparent 0 59%, rgba(255,255,255,0.9) 59% 59.6%, transparent 59.6% 100%),
          linear-gradient(125deg, transparent 0 66%, rgba(255,255,255,0.9) 66% 66.5%, transparent 66.5% 100%);
        inset: 0;
        opacity: 0.35;
        position: absolute;
      }
      .cover__pbo-title-mask,
      .cover__pbo-publication-mask {
        background: #731554;
        position: absolute;
        z-index: 1;
      }
      .cover__pbo-title-mask {
        bottom: 13.5%;
        left: 42%;
        height: 10%;
        width: 56%;
      }
      .cover__pbo-publication-mask {
        bottom: 9%;
        height: 4.8%;
        right: 0;
        width: 34%;
      }
      .cover__pbo-title-wrap {
        align-items: center;
        bottom: 13.8%;
        display: flex;
        justify-content: center;
        left: 45%;
        min-height: 9%;
        padding: 0 2rem;
        position: absolute;
        text-align: center;
        width: 50%;
        z-index: 2;
      }
      .cover__committee-panel {
        color: #426474;
        left: 13.3%;
        position: absolute;
        top: 25.5%;
        width: 61%;
      }
      .cover__committee-name {
        color: #426474;
        font-family: var(--print-title-font);
        font-size: clamp(2.6rem, 4vw, 3.9rem);
        font-weight: 700;
        line-height: 1.17;
        margin: 0 0 1.7rem;
      }
      .cover__committee-title {
        color: #426474;
        font-family: var(--print-title-font);
        font-size: clamp(1.9rem, 3vw, 3rem);
        font-weight: 400;
        line-height: 1.24;
        margin: 0 0 1.5rem;
      }
      .cover__committee-date {
        color: #426474;
        font-size: clamp(1.35rem, 2.1vw, 2rem);
        margin: 0;
      }
      .cover__pbo-title {
        color: white;
        font-family: var(--print-title-font);
        font-size: clamp(1.9rem, 3.4vw, 3rem);
        font-weight: 700;
        line-height: 1.12;
        margin: 0;
        max-width: 100%;
      }
      .cover__pbo-image {
        background-color: rgba(255,255,255,0.08);
        background-position: center;
        background-size: cover;
        border: 0.28rem solid rgba(255,255,255,0.92);
        clip-path: polygon(18% 0, 100% 0, 100% 78%, 0 100%, 0 20%);
        height: 19rem;
        position: absolute;
        right: -1.8rem;
        top: 0;
        width: min(54vw, 28rem);
      }
      .cover__brand-ribbon {
        background: #38498e;
        color: white;
        display: grid;
        font-size: 1.15rem;
        gap: 0.2rem;
        justify-items: center;
        margin: 0 0 2rem auto;
        max-width: 26rem;
        padding: 1rem 1.2rem;
      }
      .cover__badge {
        background: #1cab31;
        color: white;
        display: inline-block;
        font-size: 1.6rem;
        margin: 0 0 1.5rem auto;
        padding: 0.8rem 1.2rem;
      }
      .cover__body,
      .cover__panel {
        margin: 0 auto;
        max-width: 45rem;
        padding: 0 1.5rem;
        position: relative;
        z-index: 1;
      }
      .cover__panel {
        padding-top: 20rem;
      }
      .cover__title {
        font-family: var(--print-title-font);
        font-size: clamp(2.5rem, 6vw, 4.4rem);
        line-height: 1.04;
        margin: 0 0 1.25rem;
        max-width: 16ch;
      }
      .cover__publication {
        color: var(--print-accent);
        font-size: 1.15rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        margin: 0 0 0.9rem;
        text-transform: uppercase;
      }
      .cover--pbo .cover__publication,
      .cover--pbo .cover__meta,
      .cover--pbo .cover__title {
        color: white;
      }
      .cover__meta {
        font-size: 1.05rem;
        margin: 0 0 0.75rem;
      }
      .cover__abstract {
        margin-top: 2.6rem;
        max-width: 40rem;
      }
      .cover__abstract h2 {
        margin-top: 0;
      }
      .cover__footer-mark {
        background: #38498e;
        bottom: 0;
        color: white;
        left: 0;
        padding: 1rem 1.5rem 0.85rem;
        position: absolute;
      }
      .cover__footer-mark img,
      .cover__lockup {
        display: block;
        height: auto;
        width: 12rem;
      }
      .cover__lockup-row {
        display: flex;
        justify-content: flex-end;
        margin: 0 0 2rem;
      }
      .cover--lrs-lite .cover__body {
        padding-top: 5rem;
      }
      .hero {
        ${theme.heroTreatment === 'band'
          ? 'background: linear-gradient(135deg, var(--print-accent-strong), var(--print-accent)); border-radius: 1.25rem; color: white; padding: 1.5rem 1.5rem 1.35rem;'
          : 'background: white; border: 1px solid var(--print-accent-soft); border-radius: 1.25rem; box-shadow: 0 18px 40px rgba(36, 33, 26, 0.06); padding: 1.5rem 1.5rem 1.35rem;'}
        margin: 0 0 1.75rem;
        position: relative;
        overflow: hidden;
      }
      .hero::after {
        border: 1px solid ${theme.heroTreatment === 'band' ? 'rgba(255,255,255,0.18)' : 'var(--print-accent-soft)'};
        border-radius: 999px;
        content: "";
        height: 14rem;
        position: absolute;
        right: -4.5rem;
        top: -7rem;
        width: 14rem;
      }
      .hero__kicker-row {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin: 0 0 1rem;
      }
      .eyebrow {
        color: ${theme.heroTreatment === 'band' ? 'rgba(255,255,255,0.86)' : 'var(--print-accent)'};
        font-size: 0.82rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        margin: 0;
        text-transform: uppercase;
      }
      .doc-chip {
        background: ${theme.heroTreatment === 'band' ? 'rgba(255,255,255,0.14)' : 'var(--print-accent-soft)'};
        border-radius: 999px;
        color: ${theme.heroTreatment === 'band' ? 'white' : 'var(--print-accent-strong)'};
        display: inline-flex;
        font-size: 0.82rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        padding: 0.32rem 0.72rem;
      }
      h1 {
        font-family: var(--print-title-font);
        font-size: 2.4rem;
        line-height: 1.05;
        margin: 0 0 1.1rem;
        max-width: 18ch;
      }
      .dek,
      .meta,
      .researcher {
        color: ${theme.heroTreatment === 'band' ? 'rgba(255,255,255,0.9)' : 'var(--print-ink-subtle)'};
      }
      .dek {
        font-size: 1.15rem;
        line-height: 1.6;
        margin: 0 0 1rem;
      }
      .meta,
      .researcher {
        font-size: 0.95rem;
        margin: 0.35rem 0;
      }
      hr {
        border: 0;
        border-top: 1px solid var(--print-accent-soft);
        margin: 2rem 0;
      }
      h2 {
        color: var(--print-accent-strong);
        font-family: var(--print-title-font);
        font-size: 1.4rem;
        line-height: 1.15;
        margin: 2.4rem 0 0.8rem;
        page-break-after: avoid;
      }
      h3 {
        color: var(--print-accent);
        font-family: var(--print-title-font);
        font-size: 1.05rem;
        line-height: 1.2;
        margin: 1.3rem 0 0.55rem;
        page-break-after: avoid;
      }
      p,
      li,
      blockquote footer {
        font-size: 1rem;
      }
      p,
      ul,
      blockquote {
        margin: 0 0 1rem;
      }
      ul {
        padding-left: 1.3rem;
      }
      blockquote {
        background: var(--print-paper-tint);
        border-left: 4px solid var(--print-accent);
        border-radius: 0 0.75rem 0.75rem 0;
        margin-left: 0;
        padding: 0.95rem 1rem;
      }
      blockquote p:last-child,
      blockquote footer:last-child {
        margin-bottom: 0;
      }
      blockquote footer {
        color: var(--print-ink-subtle);
        margin-top: 0.6rem;
      }
      .print-table {
        margin: 1.5rem 0;
        overflow: hidden;
      }
      .print-table table {
        border-collapse: collapse;
        width: 100%;
      }
      .print-table th,
      .print-table td {
        border: 1px solid var(--print-accent-soft);
        padding: 0.55rem 0.65rem;
        text-align: left;
        vertical-align: top;
      }
      .print-table th {
        background: var(--print-accent-strong);
        color: white;
        font-weight: 700;
      }
      .print-table tbody tr:nth-child(even) td {
        background: color-mix(in srgb, var(--print-accent-soft) 45%, white);
      }
      .print-membership {
        display: grid;
        gap: 0.85rem;
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
        margin: 1.35rem 0 1.6rem;
      }
      .print-member-card {
        background: color-mix(in srgb, var(--print-accent-soft) 55%, white);
        border: 1px solid var(--print-accent-soft);
        border-radius: 0.85rem;
        padding: 0.9rem 1rem;
      }
      .print-member-name,
      .print-member-role {
        margin: 0;
      }
      .print-member-name {
        color: var(--print-accent-strong);
        font-weight: 700;
      }
      .print-member-role {
        color: var(--print-ink-subtle);
        font-size: 0.92rem;
        margin-top: 0.28rem;
      }
      .boilerplate {
        margin: 0 auto;
        max-width: 45rem;
        padding: 0 1.5rem 2rem;
      }
      .boilerplate--legal p,
      .boilerplate--contact p {
        max-width: 42rem;
      }
      .boilerplate__kicker {
        color: var(--print-accent);
        font-size: 0.95rem;
        font-weight: 700;
        margin-bottom: 2rem;
      }
      .contents-list {
        margin: 0 0 2rem;
        padding-left: 1.4rem;
      }
      .contents-list li {
        margin-bottom: 0.55rem;
      }
      .citation-box {
        border: 2px solid var(--print-accent);
        margin-top: 2rem;
        padding: 1rem 1.1rem;
      }
      .citation-box__label {
        color: var(--print-accent);
        font-weight: 700;
      }
      @media print {
        body {
          padding: 0;
        }
        main {
          max-width: none;
          padding: 0;
        }
        .print-chrome {
          max-width: none;
          padding: 0 0 1rem;
        }
        .boilerplate {
          max-width: none;
          padding: 0 0 2rem;
        }
        .hero {
          break-inside: avoid;
        }
        .cover {
          min-height: auto;
        }
        .cover--pbo-reference {
          break-inside: avoid;
        }
        .cover--committee-reference {
          break-inside: avoid;
        }
      }
      @media screen {
        body {
          padding-inline: 1rem;
        }
        .print-shell {
          margin: 0 auto;
          max-width: 52rem;
        }
      }
    </style>
  </head>
  <body>
    <div class="print-shell">
      <div class="print-chrome">
        <span class="print-chrome__section">${escapeHtml(theme.sectionLabel)}</span>
        <span>${escapeHtml(story.date)}</span>
      </div>
      ${boilerplate.preface}
      <main>
        <section class="hero">
          <div class="hero__kicker-row">
            <p class="eyebrow">${escapeHtml(story.eyebrow)}</p>
            <span class="doc-chip">${escapeHtml(theme.documentLabel)}</span>
          </div>
          <h1>${escapeHtml(story.title)}</h1>
          <p class="dek">${escapeHtml(plainText(story.dek))}</p>
          <p class="meta">${escapeHtml(author)} · ${escapeHtml(story.date)} · ${escapeHtml(story.readingTime)}</p>
          ${researcherLine ? `<p class="researcher">${escapeHtml(researcherLine)}</p>` : ''}
        </section>
        <hr />
        ${articleBody}
      </main>
      ${boilerplate.outro}
    </div>
  </body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(printableHtml);
    printWindow.document.close();
    printWindow.opener = null;
    printWindow.focus();
  }

  function printArticle() {
    openPrintView();
  }

  async function copyCitation() {
    if (!isClient || !navigator.clipboard?.writeText) return;

    await navigator.clipboard.writeText(mlaCitation());
    citationCopied = true;
    toolbarFeedback = 'Citation copied';
    clearFeedbackSoon();
    clearCitationSoon();
  }

  function writeBookmarks(next: string[]) {
    if (!isClient) return;
    window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
  }

  function toggleBookmark() {
    if (!isClient) return;

    const bookmarks = readBookmarks();
    const next = isBookmarked
      ? bookmarks.filter((slug) => slug !== story.slug)
      : [...new Set([...bookmarks, story.slug])];

    writeBookmarks(next);
    isBookmarked = next.includes(story.slug);
  }

  async function loadGeneratedAudio() {
    try {
      const response = await fetch(`${base}/audio/stories/manifest.json`);
      if (!response.ok) return;

      const manifest = (await response.json()) as Record<string, AudioManifestEntry>;
      const entry = manifest[story.slug];
      if (!entry?.src) return;

      generatedAudioSrc = `${base}${entry.src}`;
      audio = new Audio(generatedAudioSrc);
      audio.preload = 'metadata';
      configureMediaSession();
      audio.addEventListener('play', () => {
        isLoadingAudio = false;
        isPlaying = true;
        setMediaSessionPlaybackState('playing');
      });
      audio.addEventListener('pause', () => {
        isPlaying = false;
        setMediaSessionPlaybackState('paused');
      });
      audio.addEventListener('ended', () => {
        isPlaying = false;
        setMediaSessionPlaybackState('paused');
      });
      audio.addEventListener('waiting', () => {
        isLoadingAudio = true;
      });
      audio.addEventListener('canplay', () => {
        isLoadingAudio = false;
      });
      audio.addEventListener('error', () => {
        generatedAudioSrc = null;
        isLoadingAudio = false;
        clearMediaSession();
        audio = null;
      });
    } catch {
      generatedAudioSrc = null;
    }
  }

  onMount(() => {
    isClient = true;
    isBookmarked = readBookmarks().includes(story.slug);
    isDarkTheme = document.documentElement.dataset.theme === 'dark';
    const syncTheme = (event: Event) => {
      isDarkTheme = (event as CustomEvent<'light' | 'dark'>).detail === 'dark';
    };
    window.addEventListener('stor:theme-changed', syncTheme);
    void loadGeneratedAudio();

    return () => window.removeEventListener('stor:theme-changed', syncTheme);
  });

  onDestroy(() => {
    stopAllPlayback();
    clearMediaSession();
    audio = null;
  });
</script>

<section class="story-toolbar" aria-label="Article actions">
  <div class="story-toolbar__inner">
    <div class="story-toolbar__actions">
      <button
        type="button"
        class="listen-button"
        onclick={togglePlayback}
        aria-pressed={isPlaying}
        aria-label={generatedAudioSrc ? playbackLabel : (isPlaying ? 'Stop listening to the article' : 'Listen to the article')}
        disabled={!generatedAudioSrc && !storyAudioText}
      >
        <span class="listen-button__icon" aria-hidden="true">
          {#if isPlaying && generatedAudioSrc}
            <svg viewBox="0 0 20 20" fill="none">
              <rect x="5" y="4.5" width="3.5" height="11" rx="0.8" fill="currentColor"></rect>
              <rect x="11.5" y="4.5" width="3.5" height="11" rx="0.8" fill="currentColor"></rect>
            </svg>
          {:else if isLoadingAudio}
            <svg viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.6" stroke-dasharray="16 8"></circle>
            </svg>
          {:else if isPlaying}
            <svg viewBox="0 0 20 20" fill="none">
              <rect x="5" y="4.5" width="3.5" height="11" rx="0.8" fill="currentColor"></rect>
              <rect x="11.5" y="4.5" width="3.5" height="11" rx="0.8" fill="currentColor"></rect>
            </svg>
          {:else}
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M6.5 4.8L15 10L6.5 15.2V4.8Z" fill="currentColor"></path>
            </svg>
          {/if}
        </span>
        <span class="listen-button__label">
          {generatedAudioSrc ? playbackLabel : (isPlaying ? 'Stop listening' : 'Listen to the article')}
        </span>
      </button>

      <button type="button" class="icon-button icon-button--labelled" onclick={shareStory}>
        <span aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none">
            <path
              d="M11.5 4.5L15.5 8.5M15.5 8.5L11.5 12.5M15.5 8.5H7.75C5.68 8.5 4 10.18 4 12.25V15.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
        </span>
        <span>Share</span>
      </button>

      <button
        type="button"
        class="icon-button icon-button--labelled"
        onclick={printArticle}
        aria-label="Print this article"
      >
        <span aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none">
            <path
              d="M6 6.25V4.75C6 4.34 6.34 4 6.75 4H13.25C13.66 4 14 4.34 14 4.75V6.25M6.25 11.75H13.75M7 14.25H13M5.5 8H14.5C15.33 8 16 8.67 16 9.5V13.5C16 14.33 15.33 15 14.5 15H5.5C4.67 15 4 14.33 4 13.5V9.5C4 8.67 4.67 8 5.5 8Z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
        </span>
        <span>Print</span>
      </button>

      <button
        type="button"
        class="icon-button icon-button--labelled"
        onclick={copyCitation}
        aria-label="Copy MLA citation"
        class:is-success={citationCopied}
      >
        <span aria-hidden="true">
          {#if citationCopied}
            <svg viewBox="0 0 20 20" fill="none">
              <path
                d="M4.75 10.5L8.25 14L15.25 7"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
            </svg>
          {:else}
            <svg viewBox="0 0 20 20" fill="none">
              <path
                d="M7 5.25H13.5C14.33 5.25 15 5.92 15 6.75V15.25C15 16.08 14.33 16.75 13.5 16.75H7C6.17 16.75 5.5 16.08 5.5 15.25V6.75C5.5 5.92 6.17 5.25 7 5.25Z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linejoin="round"
              ></path>
              <path
                d="M8 3.25H11.75C12.58 3.25 13.25 3.92 13.25 4.75V5.25H7.5V4.75C7.5 3.92 8.17 3.25 9 3.25"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
            </svg>
          {/if}
        </span>
        <span>{citationCopied ? 'Citation copied' : 'Cite this article'}</span>
      </button>

      <button
        type="button"
        class="icon-button icon-button--labelled"
        onclick={toggleBookmark}
        aria-pressed={isBookmarked}
        aria-label={isBookmarked ? 'Remove bookmark' : 'Save this article'}
      >
        <span aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none">
            <path
              d="M6 3.75H14C14.41 3.75 14.75 4.09 14.75 4.5V16L10 13.1L5.25 16V4.5C5.25 4.09 5.59 3.75 6 3.75Z"
              stroke="currentColor"
              stroke-width="1.5"
              fill={isBookmarked ? 'currentColor' : 'none'}
              stroke-linejoin="round"
            ></path>
          </svg>
        </span>
        <span>Save</span>
      </button>

      <button
        type="button"
        class="icon-button icon-button--utility"
        onclick={toggleTheme}
        aria-label={`Use ${isDarkTheme ? 'light' : 'dark'} mode`}
        title={isDarkTheme ? 'Light mode' : 'Dark mode'}
      >
        <span aria-hidden="true">
          {#if isDarkTheme}
            <svg viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3.1" stroke="currentColor" stroke-width="1.5"></circle>
              <path d="M10 2.5V4M10 16V17.5M17.5 10H16M4 10H2.5M15.3 4.7L14.25 5.75M5.75 14.25L4.7 15.3M15.3 15.3L14.25 14.25M5.75 5.75L4.7 4.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
            </svg>
          {:else}
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M16.6 12.75A7.1 7.1 0 0 1 7.25 3.4a7.1 7.1 0 1 0 9.35 9.35Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          {/if}
        </span>
      </button>
    </div>
  </div>

  {#if toolbarFeedback}
    <p class="story-toolbar__feedback" aria-live="polite">{toolbarFeedback}</p>
  {/if}
</section>

<style>
  .story-toolbar {
    border-top: 1px solid color-mix(in srgb, var(--color-line) 68%, transparent);
    margin: 0 auto;
    max-width: calc(var(--measure-prose) + (var(--gutter) * 2));
    padding:
      clamp(var(--space-4), 3vw, var(--space-5))
      var(--gutter)
      var(--space-6);
  }

  .story-toolbar__inner {
    display: block;
    margin: 0 auto;
    max-width: var(--measure-prose);
  }

  .story-toolbar__actions {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    justify-content: flex-start;
    width: 100%;
  }

  .listen-button,
  .icon-button {
    align-items: center;
    appearance: none;
    background: transparent;
    border: 1px solid var(--color-line);
    border-radius: 2px;
    color: var(--color-accent-2);
    cursor: pointer;
    display: inline-flex;
    flex: 0 0 auto;
    font-family: var(--font-sans);
    gap: 0.45rem;
    height: 2.5rem;
    justify-content: center;
    min-height: 2.5rem;
    padding: 0.5rem 0.8rem;
    transition:
      border-color 120ms ease,
      color 120ms ease,
      background-color 120ms ease;
  }

  .listen-button:hover,
  .listen-button:focus-visible,
  .icon-button:hover,
  .icon-button:focus-visible {
    border-color: var(--color-line-strong);
    color: var(--link-hover);
  }

  .icon-button.is-success {
    background: color-mix(in srgb, var(--color-soft) 78%, transparent);
    border-color: color-mix(in srgb, var(--color-accent) 28%, var(--color-line));
    color: var(--color-accent);
  }

  .listen-button:disabled {
    color: var(--color-faint);
    cursor: default;
  }

  .listen-button {
    margin-right: auto;
  }

  .listen-button__icon,
  .icon-button > span[aria-hidden='true'] {
    align-items: center;
    display: inline-flex;
    height: 1.25rem;
    justify-content: center;
    width: 1.25rem;
  }

  .listen-button__icon {
    border: 1px solid color-mix(in srgb, var(--color-line-strong) 72%, white);
    border-radius: 999px;
    flex: 0 0 auto;
    height: 1.7rem;
    width: 1.7rem;
  }

  .listen-button__icon svg,
  .icon-button svg {
    display: block;
    height: 100%;
    width: 100%;
  }

  .listen-button__label,
  .icon-button {
    font-size: var(--font-size-small);
    font-weight: 600;
    letter-spacing: 0;
    line-height: 1;
  }

  .icon-button {
    min-width: 2.5rem;
    padding-left: 0.8rem;
    padding-right: 0.8rem;
  }

  .icon-button--labelled {
    gap: 0.4rem;
    padding-left: 0.8rem;
    padding-right: 0.85rem;
  }

  .story-toolbar__feedback {
    color: var(--color-muted);
    font-family: var(--font-sans);
    font-size: var(--font-size-small);
    margin: 0.35rem 0 0;
  }

  @media (max-width: 700px) {
    .story-toolbar__actions {
      gap: 0.5rem;
    }
  }
</style>
