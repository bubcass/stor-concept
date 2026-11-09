import type { ImageAsset, ResearcherProfile, Story, StoryBlock, VideoAsset } from '$lib/content/types';

/** Exports the article content that follows a CMS-managed hero. */
export function buildCmsHtmlExport(story: Story, origin: string) {
  const esc = (value = '') => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const absoluteUrl = (value = '') => {
    const trimmed = value.trim();
    if (!trimmed || /^(?:https?:|data:|#)/i.test(trimmed)) return trimmed;
    return new URL(trimmed.startsWith('/') ? trimmed : `/${trimmed}`, origin).href;
  };
  const headingSlug = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'section';
  // Rich-text blocks may already contain a list, table or other block element.
  // Wrapping those in a paragraph produces invalid HTML, which CMS browsers repair
  // differently and can result in unexpected type and whitespace.
  const paragraphs = (values: string[]) => values.map((value) => /^\s*<(?:ul|ol|table|figure|blockquote|div|h[1-6]|section)\b/i.test(value) ? value : `<p>${value}</p>`).join('');
  // Imported ProseMirror footnotes arrive as numbered superscripts plus a final
  // ordered list whose source return links have been flattened to an ↑. Rebuild
  // that relationship only in the portable CMS output; it must not alter Stór's
  // article data or its on-site rendering.
  const linkFootnotes = (html: string) => {
    const withReferences = html.replace(
      /<sup>\s*(?:<a\b[^>]*>)?\[(\d+)\](?:<\/a>)?\s*<\/sup>/gi,
      (_match, number) => `<sup class="ip-footnote-reference"><a id="ip-footnote-reference-${number}" href="#ip-footnote-${number}" aria-label="Read footnote ${number}">[${number}]</a></sup>`,
    );
    let foundCitationList = false;

    return withReferences.replace(/<ol(\b[^>]*)?>([\s\S]*?)<\/ol>/gi, (list, attributes = '', items) => {
      if (foundCitationList || !/(?:↑|href=["']#footnote(?:-ref|-reference)-\d+|id=["']footnote-\d+)/i.test(items)) return list;
      foundCitationList = true;
      let position = 0;
      const cleanedItems = items.replace(/<li(\b[^>]*)?>([\s\S]*?)<\/li>/gi, (_item: string, itemAttributes: string = '', item: string) => {
        position += 1;
        const citation = item
          .replace(/\s*<a\b[^>]*href=["']#footnote-ref-\d+["'][^>]*>\s*↑\s*<\/a>/gi, '')
          .replace(/\s*<a\b[^>]*href=["']#footnote-reference-\d+["'][^>]*>\s*↩\s*<\/a>/gi, '')
          .replace(/\s*↑\s*$/u, '');
        return `<li${itemAttributes} id="ip-footnote-${position}">${citation}</li>`;
      });
      return `<ol${attributes} class="ip-footnotes">${cleanedItems}</ol>`;
    });
  };
  const caption = (value?: string | null, credit?: string | null) => value || credit ? `<figcaption>${value ?? ''}${credit ? `<span class="ip-credit">${esc(credit)}</span>` : ''}</figcaption>` : '';
  const image = (asset: ImageAsset, className = '') => `<figure class="ip-media ${className}"><img src="${esc(absoluteUrl(asset.src))}" alt="${esc(asset.alt)}" loading="lazy">${caption(asset.caption, asset.credit)}</figure>`;
  const video = (asset: VideoAsset, className = '') => `<figure class="ip-media ${className}"><video controls playsinline preload="metadata"${asset.poster ? ` poster="${esc(absoluteUrl(asset.poster))}"` : ''}><source src="${esc(absoluteUrl(asset.src))}" type="video/mp4">${asset.captions ? `<track kind="captions" label="English captions" srclang="en" src="${esc(absoluteUrl(asset.captions))}" default>` : ''}</video>${caption(asset.caption, asset.credit)}</figure>`;
  const authorProfiles = story.authors?.filter((author) => author.name?.trim()).slice(0, 3) ?? (story.researcher?.name || story.byline ? [{ ...story.researcher, name: story.researcher?.name ?? story.byline }] : []);
  const author = (person: ResearcherProfile) => {
    const name = person.name?.trim() ?? '';
    const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
    return `<div class="ip-author"><div class="ip-author__avatar">${person.image ? `<img src="${esc(absoluteUrl(person.image))}" alt="${esc(person.imageAlt ?? `${name}, article author`)}">` : `<span>${esc(initials)}</span>`}</div><div><p class="ip-author__name">${esc(name)}</p>${person.role || person.organisation ? `<p class="ip-author__description">${esc(person.role ?? '')}${person.role && person.organisation ? ' <span aria-hidden="true">|</span> ' : ''}${esc(person.organisation ?? '')}</p>` : ''}</div></div>`;
  };
  const headingCounts = new Map<string, number>();
  const headings = story.showContents ? story.blocks.flatMap((block, index) => {
    const label = block.type === 'text' && block.headingLevel !== 3 ? block.heading : block.type === 'media-text' ? block.heading : undefined;
    if (!label) return [];
    const base = headingSlug(label);
    const count = headingCounts.get(base) ?? 0;
    headingCounts.set(base, count + 1);
    return [{ index, label, id: count ? `${base}-${count + 1}` : base }];
  }) : [];
  const headingIds = new Map(headings.map((entry) => [entry.index, entry.id]));
  const content = (value: StoryBlock, index: number): string => {
    switch (value.type) {
      case 'text': {
        const tag = value.headingLevel === 3 ? 'h3' : 'h2';
        return `<section>${value.heading ? `<${tag}${headingIds.get(index) ? ` id="${headingIds.get(index)}"` : ''}>${esc(value.heading)}</${tag}>` : ''}${paragraphs(value.paragraphs)}</section>`;
      }
      case 'table': return `<div class="ip-table">${value.html}</div>`;
      case 'image': return image(value.image, `ip-media--${value.layout ?? 'inline'}`);
      case 'video': return video(value.video, 'ip-media--wide');
      case 'media-text': return `<section class="ip-media-text ip-media-text--${value.mediaSide ?? 'right'}"><div>${value.eyebrow ? `<p class="ip-eyebrow">${esc(value.eyebrow)}</p>` : ''}${value.heading ? `<h2${headingIds.get(index) ? ` id="${headingIds.get(index)}"` : ''}>${esc(value.heading)}</h2>` : ''}${paragraphs(value.paragraphs)}</div>${value.media.type === 'image' ? image(value.media.asset as ImageAsset) : video(value.media.asset as VideoAsset)}</section>`;
      case 'flourish': return `<figure class="ip-flourish"><div class="flourish-embed flourish-${esc(value.embedType ?? 'chart')}" data-src="${esc(value.dataSrc)}">${value.thumbnail ? `<noscript><img src="${esc(absoluteUrl(value.thumbnail))}" alt="${esc(value.alt ?? 'Flourish visualisation')}"></noscript>` : ''}</div>${value.caption ? `<figcaption>${esc(value.caption)}</figcaption>` : ''}</figure>`;
      case 'link-list': return `<section class="ip-links">${value.eyebrow ? `<p class="ip-eyebrow">${esc(value.eyebrow)}</p>` : ''}${value.heading ? `<h2>${esc(value.heading)}</h2>` : ''}<div>${value.links.map((link) => `<a href="${esc(link.href)}"><strong>${esc(link.label)} <span aria-hidden="true">↗</span></strong>${link.description ? `<span>${esc(link.description)}</span>` : ''}</a>`).join('')}</div></section>`;
      case 'quote': return `<figure class="ip-quote"><blockquote>${value.text}</blockquote>${value.attribution ? `<figcaption>${esc(value.attribution)}</figcaption>` : ''}</figure>`;
      case 'chart': return `<figure class="ip-embed-placeholder"><figcaption>${esc(value.title ?? 'Chart')}</figcaption><p>This chart requires its supplied CMS embed or data visualisation component.</p>${value.caption ? `<small>${esc(value.caption)}</small>` : ''}</figure>`;
      case 'vote-map': return `<figure class="ip-embed-placeholder"><figcaption>${esc(value.title ?? 'Interactive vote map')}</figcaption><p>${esc(value.intro ?? 'This interactive requires its supplied CMS embed.')}</p>${value.caption ? `<small>${esc(value.caption)}</small>` : ''}</figure>`;
      case 'scrolly': return `<section class="ip-scrolly"><h2>${esc(value.title)}</h2>${value.intro ? `<p>${value.intro}</p>` : ''}${value.steps.map((step) => `<section><h3>${esc(step.title)}</h3><p>${step.body}</p>${image(step.image)}</section>`).join('')}</section>`;
      case 'scene-scrolly': return `<section class="ip-scrolly">${value.title ? `<h2>${esc(value.title)}</h2>` : ''}${value.intro ? `<p>${value.intro}</p>` : ''}${value.steps.map((step) => `<section>${step.eyebrow ? `<p class="ip-eyebrow">${esc(step.eyebrow)}</p>` : ''}<h3>${esc(step.title)}</h3><p>${step.body}</p>${step.video ? video(step.video) : image(step.image)}</section>`).join('')}</section>`;
      case 'committee-members': return `<section class="ip-members">${value.heading ? `<h2>${esc(value.heading)}</h2>` : ''}<ul class="ip-member-grid">${value.members.map((member) => `<li class="ip-member-card">${member.href ? `<a class="ip-member-link" href="${esc(member.href)}" aria-label="View ${esc(member.name)}’s Oireachtas profile">` : ''}${member.image ? `<img class="ip-member-avatar" src="${esc(absoluteUrl(member.image))}" alt="${esc(member.name)}" loading="lazy">` : `<span class="ip-member-avatar ip-member-avatar--fallback" aria-hidden="true">${esc(member.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0] ?? '').join(''))}</span>`}<span class="ip-member-copy">${esc(member.name)}</span>${member.href ? `</a>` : ''}</li>`).join('')}</ul></section>`;
      case 'observable': return `<figure class="ip-embed-placeholder"><figcaption>${esc(value.alt ?? 'Observable visualisation')}</figcaption><p><a href="${esc(value.notebookUrl ?? value.moduleUrl)}">Open the supplied Observable visualisation</a></p>${value.caption ? `<small>${esc(value.caption)}</small>` : ''}</figure>`;
      case 'arcgis-map': return `<figure class="ip-embed-placeholder"><figcaption>${esc(value.title ?? 'Interactive map')}</figcaption><p>This map requires its supplied CMS embed.</p>${value.caption ? `<small>${esc(value.caption)}</small>` : ''}</figure>`;
    }
  };

  const body = linkFootnotes(story.blocks.map(content).join(''));
  return `<style>${CMS_STYLE}.ip-summary{clear:both;display:block !important;float:none !important;position:relative;width:min(100%,720px)}.ip-layout{clear:both}.ip-author__avatar{flex:0 0 72px}.ip-author__name{color:#3f3d38}.ip-author__description{color:#6b6963;font-weight:500;opacity:1}.ip-footnote-reference{line-height:0}.ip-footnote-reference a{font-size:.72em;text-decoration:none}.ip-footnotes{margin-top:2.5rem;padding-top:1.25rem;border-top:1px solid #ded8c8}.ip-footnotes li{scroll-margin-top:2rem}.ip-members{margin:2.5rem 0}.ip-member-grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(8.5rem,1fr));list-style:none;margin:0;padding:0}.ip-member-card{padding:.5rem .35rem;text-align:center}.ip-member-link{display:grid;gap:.65rem;justify-items:center;color:inherit;text-decoration:none}.ip-member-link::before,.ip-member-link::after{content:none !important;display:none !important;background:none !important;padding:0 !important}.ip-member-link:focus-visible{outline:2px solid #786321;outline-offset:3px}.ip-member-avatar{flex:0 0 4.5rem;width:4.5rem !important;height:4.5rem !important;max-width:none !important;aspect-ratio:1/1;border:1px solid #ded8c8;border-radius:50%;object-fit:cover}.ip-member-avatar--fallback{display:grid;place-items:center;background:#eeece4;color:#786321;font-weight:700}.ip-member-copy{display:grid;gap:.2rem;color:#3f3d38;font-size:.82rem;font-weight:500 !important;line-height:1.2}.ip-member-copy a,.ip-member-copy strong{color:#3f3d38;font-size:.88rem;font-weight:700;line-height:1.2;text-decoration:none}.ip-member-copy a::after{content:none !important}.ip-member-copy small{display:block;color:#786321;font-size:.72rem;font-weight:500;letter-spacing:.03em;margin-top:.1rem;text-transform:uppercase}.ip-media video{width:100%;aspect-ratio:16/9;background:#111;border:1px solid #ded8c8}@media(max-width:620px){.ip-member-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ip-member-avatar{width:4rem;height:4rem}}.ip-body>section{margin:0;padding:0}.ip-body>section>h2:first-child,.ip-body>section>h3:first-child{margin-top:0}</style><article class="inside-parliament-embed">${story.abstract ? `<section class="ip-summary" aria-label="Article summary">${story.abstract}</section>` : ''}${authorProfiles.length ? `<section class="ip-authors" aria-label="Article author">${authorProfiles.map(author).join('')}</section>` : ''}<div class="ip-layout">${headings.length ? `<aside class="ip-contents"><p>Contents</p><nav>${headings.map((entry) => `<a href="#${entry.id}">${esc(entry.label)}</a>`).join('')}</nav></aside>` : ''}<div class="ip-body simple-content normal">${body}</div></div><script async src="https://public.flourish.studio/resources/embed.js"></script></article>`;
}

/* Only article-specific components are packaged. The host CMS controls normal type, colour and links. */
const CMS_STYLE = `
.inside-parliament-embed{box-sizing:border-box;max-width:1120px;margin:0 auto}.inside-parliament-embed *{box-sizing:border-box}.ip-authors,.ip-summary{max-width:720px;margin:0 auto 32px}.ip-authors{border-top:2px solid #ded8c8;padding-top:26px;display:grid;gap:18px}.ip-author{display:flex;align-items:center;gap:16px}.ip-author__avatar{width:72px;height:72px;border-radius:50%;overflow:hidden;background:#eeece4;border:1px solid #ded8c8;display:grid;place-items:center;font-weight:700}.ip-author__avatar img{width:100%;height:100%;object-fit:cover}.ip-author__name,.ip-author__description{margin:0}.ip-author__name{font-size:1.15rem;font-weight:700}.ip-author__description{opacity:.72}.ip-summary{background:#eeece4;border-left:6px solid #a7a39a;font-size:1.1rem;padding:26px 32px}.ip-layout{display:grid;gap:clamp(32px,6vw,96px);grid-template-columns:minmax(180px,280px) minmax(0,720px);margin:56px auto}.ip-contents{align-self:start;max-height:calc(100svh - 4rem);overflow-y:auto;position:sticky;top:2rem}.ip-contents>p{font-weight:700;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid #ded8c8;padding-bottom:16px}.ip-contents nav{display:grid}.ip-contents a{font-weight:700;padding:16px 0;border-bottom:1px solid #ded8c8;text-decoration:none}.ip-body>*,.ip-body>section{margin:0 0 42px}.ip-media{margin:42px 0}.ip-media img,.ip-media video{display:block;max-width:100%;height:auto}.ip-media--inline{max-width:620px}.ip-media--wide,.ip-flourish{max-width:100%}.ip-media--contain img{object-fit:contain}.ip-credit{display:block;opacity:.72}.ip-media-text{display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:start}.ip-media-text--left .ip-media{order:-1}.ip-table{overflow-x:auto}.ip-table table{border-collapse:collapse;width:100%}.ip-table th,.ip-table td{border:1px solid currentColor;padding:10px;text-align:left}.ip-flourish{margin:42px 0}.ip-links>div{border-top:1px solid #ded8c8}.ip-links a{display:grid;grid-template-columns:1fr 1.4fr;gap:18px;padding:16px 0;border-bottom:1px solid #ded8c8;text-decoration:none}.ip-links a>span{opacity:.72}.ip-quote{border-left:6px solid #ded8c8;margin:42px 0;padding-left:28px}.ip-quote blockquote{margin:0}.ip-quote figcaption{margin-top:12px;opacity:.72}.ip-scrolly section{margin:30px 0}.ip-members ul{display:grid;gap:12px;padding:0;list-style:none}.ip-members li{display:flex;align-items:center;gap:12px}.ip-members img{width:3rem;height:3rem;border-radius:50%;object-fit:cover}.ip-members small{display:block;opacity:.72}.ip-embed-placeholder{background:#eeece4;padding:24px;margin:42px 0}.ip-embed-placeholder figcaption{font-weight:700}@media(max-width:760px){.ip-layout{display:block;margin-top:36px}.ip-contents{max-height:none;overflow:visible;position:static;margin-bottom:40px}.ip-media-text{grid-template-columns:1fr}.ip-media-text--left .ip-media{order:0}.ip-links a{display:block}.ip-links a>span{display:block;margin-top:8px}}`;
