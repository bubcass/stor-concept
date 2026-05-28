# Oireachtas digital publishing

## Getting a `.docx` into a good structured form

This note explains the following:

- what [ProseMirror](https://prosemirror.net) and [Tiptap](https://tiptap.dev) are
- why the [Stór concept](https://github.com/bubcass/stor-concept) and [Inside Parliament](https://github.com/bubcass/inside-parliament) repos use them as the editorial core
- how a Word `.docx` becomes a structured publication document
- where this pattern might fit with current web publishing practice for `oireachtas.ie`
- what realistic alternatives exist at each layer

The short version is:

`DOCX -> Mammoth HTML -> normalised import HTML -> canonical ProseMirror JSON + metadata -> derived web output + derived XML (if desired)`

The important design choice is that a Word document is treated as an input format, not the master format. The tool used is referred to as a “**Publisher**” in this document.

## Examples
### Main example
- [Committee reports proof of concept](https://bubcass.github.io/stor-concept/proof-of-concept/committees/)
- [Publisher tool](https://bubcass.github.io/stor-concept/publisher/)
### Other examples
- [Richer research repository concept (Stór)](https://bubcass.github.io/stor-concept/)
- [Newsroom-type article outputs (Inside Parliament)](https://bubcass.github.io/inside-parliament/)

## Where this fits in the Stór concept repo

The Stór concept repo Publisher [`src/routes/publisher/+page.svelte`](https://github.com/bubcass/stor-concept/blob/main/src/routes/publisher/%2Bpage.svelte) is the editorial entry point for research-type documents, including committee reports in the proof of concept.

The canonical content model is `StorDocument` in [`src/lib/content/stor/types.ts`](https://github.com/bubcass/stor-concept/blob/main/src/lib/content/stor/types.ts). The model combines:

- routing and destination metadata
- publication metadata
- optional hero and enhancement metadata
- canonical body content as ProseMirror JSON

The Stór-type Publisher is envisaged for committee reports in the first instance. Potential to later add PBO, L&RS, and general content for proposed research repository but for now this is the main example of how to take a committee report output and get it into structured format suitable for scalable web publication.

The Inside Parliament Publisher takes account of differences in presentation and publication pipelines (more web-savvy authors) but the editorial problem is the same: take authoring input, normalise it into structured content, then render it into one or more delivery formats. This document will concentrate on the Stór-type Publisher.


## What ProseMirror is

[ProseMirror](https://prosemirror.net/) is a toolkit for building structured rich-text editors. It is not a ready-made CMS editor in the way TinyMCE or CKEditor feel like off-the-shelf products. It provides:

- a document model
- a schema for allowed nodes and marks
- transactions and editor state
- parsing and serialisation tools
- a plugin system
- good support for programmatic transformations

The key idea is that the editor is editing a structured document tree, not just a blob of HTML.

That matters for parliamentary and research publishing because these documents are not just "formatted text" and should contain structure with downstream meaning:

- headings and document hierarchy
- paragraphs, quotations, lists and tables
- figures and captions
- potential for interactive embedding, such as Flourish charts, although these are not currently possible with the .pdf endpoint
- metadata such as date, publication status, authors, committee identity (which can in turn be indexed to existing Oireachtas metadata)

When content has to become multiple outputs, this structured form matters more than appearance or the layout approach seen with Word documents.

## What Tiptap is

[Tiptap](https://tiptap.dev/) is a higher-level framework built on ProseMirror.

It gives developers:

- a friendlier extension API
- a simpler way to configure schemas and commands
- framework-friendly integration patterns
- useful starter extensions for common editing behaviour

In practice:

- ProseMirror is the engine and document model
- Tiptap is the developer ergonomics layer used to assemble the editor

In the Stór concept repo, the editor route uses Tiptap packages such as `@tiptap/core`, `@tiptap/starter-kit`, and a set of custom extensions for structured blocks. The custom nodes live in [`src/lib/publisher/editor/extensions.ts`](https://github.com/bubcass/stor-concept/blob/main/src/lib/publisher/editor/extensions.ts).

That file shows the core pattern clearly: custom elements such as `stor-image`, `stor-flourish`, `stor-media-text` and table blocks are treated as first-class nodes in the editor schema, not as arbitrary pasted HTML.

## Why ProseMirror and Tiptap are a good fit

For this use case, the main strengths are:

1. Structured editing instead of HTML editing

This Publisher model is not a case of "saving whatever came from Word". It is a process to normalise content into a document tree we can trust.

2. Strong control over allowed content

For Oireachtas publishing, this is a feature, not a restriction. It is usually better to have a constrained editorial model than an endlessly flexible one that creates inconsistent output.

First-class custom content blocks

Images, tables, mixed media/text blocks and customised blocks (such as for Flourish chart embeds) are represented explicitly in schema terms. That makes them easier to validate, serialise, transform and render consistently.

4. Multiple output formats from one canonical source

**The Stór concept repo derives web output and XML from the same ProseMirror-backed document (the “canon”)**. This is much safer than maintaining separate HTML and XML masters. The `.docx` is not considered canon but rather an input to producing this canon.

5. Good fit for enrichment after Word import

A Word file can be a good starting point but it is rarely suited to being a complete web publication. ProseMirror/Tiptap makes it practical to import, clean, enrich and publish without pretending the `.docx` is the final web model.

A good example is a richer representation of committee membership, reliable table of content UX or optional inclusion of committee report launch videos: https://bubcass.github.io/stor-concept/articles/report-on-adult-safeguarding-20260519/

## Why not just store HTML?

Storing HTML is tempting because it looks simple but it risks pushing complexity downstream.

HTML as canon usually may lead to problems such as:

- inconsistent structure from different authoring sources
- fragile transformation into XML or other structured outputs
- difficulty validating whether a "table", "figure", or "aside" is really present in a reliable way
- *ad hoc* exceptions for embeds, captions, credits and presentation metadata
- hard-to-control editorial drift over time

HTML is excellent as a rendering format and a transfer format. It is weaker as a canonical editorial format for multi-channel publishing.

That is why the Stór concept repo treats [Mammoth](https://github.com/mwilliamson/mammoth.js/) HTML as transient import material, not the master body format.

## Why not just store Word?

The `.docx` model is an authoring handoff format, not a web publishing domain model.

A Word package is good at preserving office-document semantics and formatting but it is not a practical canonical model for:

- web rendering
- search indexing
- downstream XML production
- structured editorial enrichment
- validating publication rules
- diffing and versioning at the publication-structure level

It is also much harder to inspect and manipulate safely in the browser and in standard web application tooling.

## How the Word-to-web pipeline works in the Stór concept repo

### 1. The `.docx` file is uploaded in the Publisher

The editor route at [`src/routes/publisher/+page.svelte`](https://github.com/bubcass/stor-concept/blob/main/src/routes/publisher/%2Bpage.svelte) accepts a Word file or a blank draft.

That route owns the four-stage workflow:

1. start
2. publication details
3. edit content
4. preview and export

This is a sensible publishing flow because it separates import, metadata entry and editing, editorial cleanup and the preview or publication step.

### 2. Word metadata is extracted from the `.docx` package

[`src/lib/publisher/extractDocxMetadata.ts`](https://github.com/bubcass/stor-concept/blob/main/src/lib/publisher/extractDocxMetadata.ts) opens the `.docx` as a ZIP and reads:

- `docProps/core.xml`
- `docProps/custom.xml`

It extracts fields such as:

- title
- subject and description
- creator or author
- revision
- category
- language
- keywords
- created and modified dates
- custom properties such as publication date or destination when present

This is important because it lets a well-prepared Word document carry useful publishing metadata into the system instead of forcing editors to retype everything. It also has the potential to incentivise good metadata entry at the Word document phase, as it leads to less friction in the web publication stage.

This is the point where required metadata (authors, dates, titles or even image alt text) may be “red-flagged” in a validation step, meaning the process does not proceed without good metadata.

### 3. Mammoth converts `.docx` body content into HTML

Mammoth is the bridge between Word and browser-usable markup rather than a canonical format layer. It is, in essence, the “import bridge”.

The conversion path is intentionally:

`Word OOXML -> HTML -> normalised HTML -> ProseMirror`

Mammoth is a pragmatic choice because:

- it runs well in JavaScript
- it focuses on semantic-ish HTML rather than pixel-perfect Word rendering
- it gives a manageable handoff format for the next normalisation step

### 4. Imported HTML is normalised before it becomes ProseMirror

[`src/lib/publisher/editor/importHtml.ts`](https://github.com/bubcass/stor-concept/blob/main/src/lib/publisher/editor/importHtml.ts) performs a crucial cleanup step.

This file does not just accept imported HTML as-is. It rewrites parts of it into structured placeholders that match the editor schema:

- HTML tables become `stor-table`
- imported images become `stor-image`
- paragraph-wrapped single images are normalised into image blocks

This is an important architectural move. Instead of asking ProseMirror to infer everything from arbitrary HTML, the importer first turns troublesome structures into explicit block-level markers that the editor understands.

That reduces ambiguity and preserves higher-value content like tables and images.

### 5. HTML is converted into canonical ProseMirror JSON

[`src/lib/publisher/prosemirrorFromHtml.ts`](https://github.com/bubcass/stor-concept/blob/main/src/lib/publisher/prosemirrorFromHtml.ts) maps normalised HTML into a ProseMirror document tree.

The current conversion handles:

- paragraphs
- headings
- bullet and ordered lists
- blockquotes
- inline marks such as bold, italic, underline, strike, code, subscript, superscript, and links

The canonical output is a `doc` node with typed child nodes, not a stored HTML fragment.

For plain research and explanatory publishing, this is the heart of the system.

### 6. Custom block nodes sit alongside ordinary rich text

The editor schema in [`src/lib/publisher/editor/extensions.ts`](https://github.com/bubcass/stor-concept/blob/main/src/lib/publisher/editor/extensions.ts) adds domain-specific blocks such as:

- `imageBlock`
- `flourishBlock`
- `mediaTextBlock`
- `tableBlock`

This is where the Stór concept stops being "a rich-text editor" and becomes "a publisher for a structured publication model".

These blocks carry attributes such as:

- image source, alt text, caption, credit and layout
- Flourish source, caption, thumbnail, embed type and width
- serialized table HTML
- media/text layout metadata

That lets the same body hold both:

- standard narrative text
- editorially meaningful blocks that are not well represented by ordinary HTML paragraphs

### 7. The body and metadata are assembled into `StorDocument`

The canonical object is defined in [`src/lib/content/stor/types.ts`](https://github.com/bubcass/stor-concept/blob/main/src/lib/content/stor/types.ts).

At a high level, `StorDocument` contains article component data such as:

- `id`
- `slug`
- `destination`
- `type`
- title, dek, abstract, eyebrow, byline
- contributors
- publisher, licence, DOI, keywords, version, language
- optional hero and video metadata
- `content`, which is the ProseMirror document

This is the real publication object.

Once this exists, the source Word file no longer needs to be the system of record.

### 8. The canonical document is validated and transformed into outputs

[`src/lib/content/stor/validate.ts`](https://github.com/bubcass/stor-concept/blob/main/src/lib/content/stor/validate.ts) performs basic validation, including checks for:

- required IDs and routing fields
- a valid ProseMirror `doc`
- destination-specific requirements such as `committeeName`

Then the canonical document can be derived into:

- article story data for web rendering via [`src/lib/content/stor/toStory.ts`](https://github.com/bubcass/stor-concept/blob/main/src/lib/content/stor/toStory.ts)
- XML via [`src/lib/content/stor/toXml.ts`](https://github.com/bubcass/stor-concept/blob/main/src/lib/content/stor/toXml.ts). The XML step is important for archive and open data reasons.

This is the payoff for using structured canonical content. One editorial object can produce several delivery forms without separate authoring tracks.

### 9. Embedded images are materialised at publish time

When the document is published through [`src/routes/api/publish-document/+server.ts`](https://github.com/bubcass/stor-concept/blob/main/src/routes/api/publish-document/%2Bserver.ts), imported `data:` images are rewritten into proper files under `static/media/imported/...`.

That is a useful distinction between:

- draft/editor state
- publishable asset state

For production, this same step would target managed object storage instead of the local static folder.

## Potential alternatives

The important element of the Stór concept is the publishing contract and approach to making a structured document.

### Alternative 1: Lexical

[Lexical](https://lexical.dev/) is a modern editor framework from Meta.

Advantages:

- strong performance
- pleasant developer experience
- modern architecture

Disadvantages in this context:

- less proven than ProseMirror for complex structured publishing workflows
- weaker existing ecosystem for some document-model and import/export patterns
- would still require substantial custom work for schema discipline and downstream transforms


### Alternative 2: Slate

[Slate](https://docs.slatejs.org/) is flexible and React-friendly.

Pros:

- flexible JSON editing structure

Cons:

- more app-defined behavior
- historically more work to keep complex editor behaviour stable
- weaker fit when strict structural guarantees matter

Slate can work well for custom editorial tools but it is usually a looser system than ProseMirror.

### Alternative 3: CKEditor 5 or TinyMCE

These are more product-like editors.

Pros:

- rich feature sets
- familiar enterprise editing experience
- less initial editor assembly work

Cons:

- can encourage HTML-centric thinking
- deeper customisation for a domain-specific canonical model can become awkward
- harder to make the editor schema the heart of the publishing architecture


### Alternative 4: DOCX -> XML directly

This may look attractive for official-document pipelines.

Pros:

- strong structure if the XML target is well defined
- good for archival or publishing pipelines with tight schemas

Cons:

- weak editorial usability in-browser
- difficult cleanup and enrichment workflow
- poor fit for interactive web-focused editing

Direct XML pipelines are viable in highly controlled publishing environments but they often need a friendlier editorial layer anyway.

## Stór concept approach

The current stack makes a pragmatic compromise:

- Word remains a familiar authoring tool
- Mammoth handles import without pretending to preserve desktop layout exactly
- ProseMirror becomes the canonical structured body
- Tiptap keeps the editor implementation manageable
- [Svelte](https://svelte.dev) components render the web view
- XML is derived and not separately maintained

That is a strong fit for an organisation that still receives a lot of document content as `.docx` but wants web-native, reusable, structured outputs.

## Current `Oireachtas.ie` web practice

The website currently needs to support:

- strong information architecture and section routing
- accessible longform content
- search and discovery across committee reports and, in the longer term, other institutional research outputs
- mixed media, including images, video and, potentially interactive and embedded resources
- durable public URLs for documents and records

The current approach outputs separately to:

- HTML content pages
- PDF and other document or data assets on `data.oireachtas.ie`

That landscape argues for a structured-content approach rather than a page-template-only approach. The practical web patterns to lean into are:

- semantic HTML derived from structured source content
- accessibility-first handling of headings, tables, images and media
- stable canonical URLs and durable identifiers
- progressive enhancement rather than editor-driven markup hacks
- structured metadata that can feed search, related-content logic and API integration
- separation of canonical content from front-end presentation

The exact front-end stack can be varied but the important element is the publication model remaining stable behind it.

## Sveltekit and Svelte

It is reasonable to concentrate less on the Svelte layer in this explanation because Svelte is not the hard part conceptually.

Svelte is used in the proof of concept, with the front end mostly a rendering target:

- `StorDocument` becomes story data
- story data becomes Svelte components

That could be replaced, if required, with:

- another SSG or SSR front end
- a headless CMS consumer
- server-rendered templates
- API-driven clients

The lasting architectural value is in the canonical structured content and the import pipeline, not in the choice of view technology.

### How Svelte is used in the proof of concept

Svelte is best thought of as a component framework that moves a lot of work to compile time rather than relying on a large runtime in the browser.

In practical terms, that means:

- components are written in single-file `.svelte` files
- markup, styling and component logic live together
- the compiler turns that component code into efficient JavaScript DOM updates
- there is much less framework runtime machinery than in a typical virtual-DOM approach

In comparison with React, Vue, or server-rendered template systems, the main process shift is that Svelte is not primarily "a runtime library that re-renders components". It is "a compiler that turns declarative component code into imperative DOM operations".

That usually gives:

- smaller client bundles
- straightforward component code
- less boilerplate around state wiring
- good performance for content-heavy pages

### What SvelteKit adds

[SvelteKit](https://svelte.dev/docs/kit/introduction) is the application framework around Svelte.

It provides the outputs normally expected from a modern web app framework:

- file-based routing
- layouts and nested routes
- server-side rendering
- static generation and prerendering
- endpoint handlers for server logic
- data-loading conventions
- deployment adapter support

In the Stór concept repo, that means routes such as:

- [`src/routes/publisher/+page.svelte`](https://github.com/bubcass/stor-concept/blob/main/src/routes/publisher/%2Bpage.svelte) for the editor UI
- [`src/routes/api/publish-document/+server.ts`](https://github.com/bubcass/stor-concept/blob/main/src/routes/api/publish-document/%2Bserver.ts) for server-side publish handling
- [`src/routes/stories/[slug]/+page.svelte`](https://github.com/bubcass/stor-concept/blob/main/src/routes/stories/%5Bslug%5D/%2Bpage.svelte) and related load files for rendered long-form pages

So, in broad architectural terms:

- Svelte handles components
- SvelteKit handles the application shell, routing, server hooks, build modes, and deployment model

For both the Stór concept and Inside Parliament-style publishing, SvelteKit is a good fit because it handles both of the important delivery modes cleanly:

- content-heavy public pages
- a richer in-browser editorial tool

It supports static generation well, which is useful for the public long-form side, while still supporting server endpoints and browser-rich interactions for the publisher side.

That combination is valuable here because the project is really two related things:

- a publication renderer
- a structured editorial application

### Technical description

1. Routes are filesystem-based

Pages and endpoints are created by file location under `src/routes`.

Examples:

- `+page.svelte` defines a page component
- `+page.ts` defines page data loading
- `+server.ts` defines an HTTP endpoint
- `+layout.svelte` defines shared layout wrappers

This is the main organising principle for the resource.

2. Server and browser code are separated by convention

SvelteKit makes it relatively clear what runs where:

- page components can run in the browser and participate in hydration
- `+server.ts` files run on the server
- load functions can run server-side, client-side or both depending on how they are authored

For publishing systems, that separation is useful because some work belongs in the browser and some belongs on the server.

In the Stór concept repo, for example:

- interactive editing lives in the browser
- writing exported files during publish is handled in the server route

3. Reactivity is compiler-driven

Recent Svelte uses explicit reactive primitives rather than the hook-heavy model many developers will know from React.

In the Stór concept repo, state usage is indicated as `$state(...)` inside the publisher route. The important idea is that local state changes automatically drive DOM updates, without needing a virtual DOM diffing model or explicit dependency arrays.


4. Components are plain and composable

Svelte components are usually easy to read because they mostly look like:

- HTML-like markup
- TypeScript in a `<script>` block
- CSS in a `<style>` block

That makes component-level rendering logic approachable even for developers who have not used Svelte before.

5. Static and dynamic delivery can coexist

This matters a lot for Oireachtas publishing.

SvelteKit can support:

- prerendered public pages for speed, simplicity and cacheability
- server endpoints where mutation or file handling is needed
- client-side enhancement for richer editorial interfaces

### How Svelte/SvelteKit relate to the publishing model

The key point is that SvelteKit is not the canonical content layer. It is the application and rendering layer.

In the Stór concept repo:

- ProseMirror plus metadata defines the canonical publication object
- SvelteKit provides the UI in which that object is edited, previewed, and rendered

That separation is healthy. It means the content model is portable even if the front end changes later.

## Repo files worth reading next

- [`src/routes/publisher/+page.svelte`](https://github.com/bubcass/stor-concept/blob/main/src/routes/publisher/%2Bpage.svelte)
- [`src/lib/publisher/extractDocxMetadata.ts`](https://github.com/bubcass/stor-concept/blob/main/src/lib/publisher/extractDocxMetadata.ts)
- [`src/lib/publisher/editor/importHtml.ts`](https://github.com/bubcass/stor-concept/blob/main/src/lib/publisher/editor/importHtml.ts)
- [`src/lib/publisher/prosemirrorFromHtml.ts`](https://github.com/bubcass/stor-concept/blob/main/src/lib/publisher/prosemirrorFromHtml.ts)
- [`src/lib/publisher/editor/extensions.ts`](https://github.com/bubcass/stor-concept/blob/main/src/lib/publisher/editor/extensions.ts)
- [`src/lib/content/stor/types.ts`](https://github.com/bubcass/stor-concept/blob/main/src/lib/content/stor/types.ts)
- [`src/lib/content/stor/toStory.ts`](https://github.com/bubcass/stor-concept/blob/main/src/lib/content/stor/toStory.ts)
- [`src/lib/content/stor/toXml.ts`](https://github.com/bubcass/stor-concept/blob/main/src/lib/content/stor/toXml.ts)
- [`src/routes/api/publish-document/+server.ts`](https://github.com/bubcass/stor-concept/blob/main/src/routes/api/publish-document/%2Bserver.ts)
