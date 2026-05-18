# Stór Publisher: Word-format (.docx) ingestion and publishing pipeline

A technical overview of how a Word `.docx` file moves through the [Stór proof of concept](https://bubcass.github.io/stor-concept/) and how that flow could be scaled into a production publishing pipeline.

This is focused on ingestion, transformation and publication mechanics.

It describes:

- how Word content is ingested into the publisher
- why [ProseMirror](https://prosemirror.net) JSON is the canonical body format, using [Tiptap](https://tiptap.dev) as implementation tool
- how metadata, tables, images and embeds are handled
- how the static proof of concept could evolve into a production service backed by PostgreSQL and Elasticsearch in conjunction with S3-compatible object storage

## Executive summary

The current Stór publisher treats a Word document as an input intofor a structured publication pipeline, not as the final authoritative format.

The working model is:

`.docx -> transient HTML import -> canonical ProseMirror JSON + metadata -> derived web output + derived XML + derived search/index records`

The architecture reduces duplication, with one canonical publication object rather than separate “Word”, “HTML”, “web JSON” and “archive XML” masters that potentially drift.

The architecture also gives a practical route to production. The proof of concept already demonstrates that editorial content can be imported from Word, normalised into a structured document model, enriched for the web and then derived into multiple outputs from the same source.

## Pipeline structure design

The key design choice in the current repo is that the canonical body is ProseMirror JSON embedded in a `StorDocument`.

That means:

- Word is an input format
- HTML is a transient conversion format (derived with [mammoth.js](https://github.com/mwilliamson/mammoth.js))
- Svelte is a rendering target
- XML is a derived export target
- search records are derived index targets

The publisher sits between authoring and delivery, purposed with:

1. extracting useful structure and metadata from the Word file (including author information, title, heading hierarchy)
2. converting this combined data into a canonical structured document
3. allowing editorial enrichment in preparation for the web and correction where necessary, including an editor UI and page previewer
4. deriving downstream outputs for web, archive and discovery

## Current proof-of-concept flow

In the current prototype the workflow is:

1. upload a `.docx` or start a blank draft
2. complete destination-aware metadata
3. refine the canonical document in the editor
4. preview, export and locally publish the derived output

The proof-of-concept site uses Github Pages and is static but the publisher is already modelling the same kinds of transformations that a dynamic production stack would need.

## Stage 1: .docx intake

### Word document as source

The publisher accepts a `.docx` in the browser. That file is treated as the editorial source material supplied by authors, researchers, committees or other publishing staff.

At this stage, the document may contain:

- textual structure such as headings, paragraphs, lists, and links
- document properties and custom metadata
- tables
- embedded images
- content that is useful for the web, including signposted Flourish embeds
- content that is purely print-oriented or administrative and may need to be cleaned up

### Mammoth conversion

The first body conversion step uses Mammoth to transform the Word file into HTML.

This HTML is intentionally transient.

Mammoth provides a pragmatic bridge from the `.docx` package into browser-usable structured markup but it is not stored as the canonical body format.

### Metadata extraction from .docx properties

Alongside the body conversion, the publisher reads core and custom Word document properties where available and maps them into publication metadata where possible.

This supports the low-friction editorial workflow established as  a core part of the proof-of-concept:

- title and description-like fields can be prefilled with a properly constructed Word document
- contributor, date, status, DOI, licence, keywords and related publication metadata may be carried in with the document

The result is not “perfect metadata automation” but it has the potential to reduces repetitive manual entry, making the Word file a more useful handoff asset. There is also incentive for document producers to populate metadata and document structure properly as it makes for a shorter and more accurate metadata population step in the publisher.

## Stage 2: Canonical normalisation into ProseMirror (PM)

### HTML To PM

Once the Word content has been converted to HTML, the publisher transforms it into a ProseMirror document using the editor schema and custom block handling.

This is the point at which the imported document stops being “Word-derived HTML” and becomes a canonical publication object.

At a high level, this stage maps imported content into:

- headings
- paragraphs
- lists
- blockquotes
- code blocks where relevant
- preserved tables
- structured image blocks
- structured embed-like blocks where they exist natively in the canonical model (Flourish and ArcGIS)

### Why PM Is canonical

ProseMirror fills the following roles:

- it provides a structured editable document model
- it supports controlled enrichment inside the publisher
- it gives a stable body format from which multiple outputs can be derived

This is what makes the Stór proof-of-concept approach materially different from a simpler “upload and render HTML” flow.

The canonical object is not just for display to user and can be:

- validated
- stored
- versioned
- indexed
- exported
- transformed again later without needing to reopen the original Word file

## Stage 3: Metadata completion And routing

Once a draft exists in canonical form, the data is ready for metadata layering and routing.

The publisher currently supports destination-aware metadata entry, for example:

- committee reports
- Parliamentary Budget Office outputs, including research document type
- Library & Research Service outputs, including research document type
- Houses of the Oireachtas outputs as a general document type not fitting any of the above

It is important that the ingestion pipeline does not just deal with body content but determining how the resulting publication should be classified, stored, indexed and rendered.

Examples of metadata responsibilities in this stage include:

- destination (L&RS, PBO)
- document type (article, briefing, visual data)
- publication status (draft, in review, ready for publication, published etc.)
- publication date
- contributors, including a mandatory metadata field for author
- committee identity where required
- keywords or topics
- licence (defaulting to Oireachtas PSI)
- DOI details or other desirable academic identifiers where feasible
- optional web-facing presentation data (hero assets and metadata, Flourish embed metadata etc.)

In a production system, these fields would become first-class structured records in the canonical store rather than remaining browser-only state.

## Stage 4: Editorial enrichment

The imported Word file may not be enough to produce a clean web publication. It is at this point that print-ready documents can be inspected and edited in preparation for digital preview.

Leveraging the PM-first approach, once the imported content is made canonical, editors can add or adjust structured elements without changing the original Word file, thus allowing the document content to be truly “born digital”.

### Tables

Tables are a known pain point and are now treated explicitly at this point in the pipeline.

In the current proof of concept:

- Word tables are pushed through the import step
- imported HTML tables are preserved into canonical table blocks
- table blocks render in the web preview
- table content is carried into XML export

The current implementation is designed to preserve tables rather than lose them.

That is already a meaningful improvement over a naive import pipeline, where tables may disappear or become degraded flat text.

The next production questions for tables are about presentation quality rather than survival:

- handling very wide tables well on the web
- dealing with merged cells more rigorously
- deciding whether some repetitive committee tables should remain tables or be rendered through more editorial web components

### Images

Imported Word images are recognised and converted into structured image blocks in the PM workflow.

The current proof-of-concept supports two distinct moments in the image lifecycle:

1. **import state**
   images may exist temporarily as embedded `data:` payloads while the document is still in a draft/editor state. This is due to the potentially expensive nature of images embedded in  Word documents
2. **publish state**
   images are materialised into proper media files and the canonical publication is rewritten to point at file-based asset paths

For a proof of concept, embedded images may be acceptable during editing. For production, images will need to become managed assets with:

- stable file identity
- object storage locations
- predictable URLs
- optional derivatives and optimisation
- metadata, such as alt text, captioning and credits

### Flourish, ArcGIS and other embeds

The publisher also supports structured non-.docx enrichments, with Flourish embeds being the most-used.

Many useful publication elements such as the Flourish embeds will not be present or signposted in the Word file at all.

Operationally, this means the Word import should be thought of as a starting point rather than a complete publication package.

The editor stage is where the publication becomes web-ready by allowing:

- Flourish embeds
- additional images
- hero media selection
- committee launch video or other media deemed appropriate (including visual representation of committee membership)
- other structured blocks that should live in the canonical model rather than as ad hoc pasted HTML

## Stage 5: Derived outputs

Once the canonical object exists, the site does not render the Word document directly.

Instead, the system derives downstream outputs from the canonical `StorDocument`.

### Svelte web output

The public web layer is a derived representation.

At a high level:

- canonical metadata and PM content are transformed into a story model
- that story model is rendered by Svelte components
- destination-specific presentation rules can still be applied, while preserving a shared infrastructure

This is a critical separation of concerns.

The Svelte front end is not the source of truth. It is the delivery layer for the canonical publication object.

### XML Output

The proof-of-concept also derives XML from the same canonical source document through a serializer function. In this model, XML is not an attempt to snapshot or mirror the web page but a structured open data output generated from the same underlying publication object.

That matters because it means the move to a PM-first and Svelte-first publishing workflow does not leave XML behind. Instead, it puts XML in a clearer role as a reusable, standards-oriented data asset.

In practice:

Canonical PM + metadata remain the master publication object. 
XML is generated from that object as an open data output.
Web rendering is generated from that object as a presentation output. 

### Search And discovery records

Search records are another derived output.

The front-end proof of concept does search in application space today but the production pattern should be:

- extract searchable text from canonical PM
- combine it with publication metadata
- push a normalised record into a discovery index

With this approach Elasticsearch fits naturally as the discovery layer, allowing research outputs to sit alongside other parliamentary data assets such as committee memberships, votes and member data rather than remaining separate from the wider information estate.

## What the static proof-of-concept demonstrates

The proof-of-concept site is static but is already demonstrating the important architectural pieces needed for a more production-ready publishing platform:

- a structured editorial intake flow
- a canonical publication model
- a controlled transformation path from Word into canonical data
- derived web rendering
- derived XML
- destination-aware routing and classification
- structured handling of tables, images and embeds as a starting point


## Recommended production architecture

### PostgreSQL as canonical store

PostgreSQL should hold the canonical publication record.

Typical responsibilities would be:

- publication identity and slug management
- canonical metadata
- workflow status
- contributor records
- destination and document type
- PM JSON body in JSONB
- publication timestamps and audit history
- links to media assets
- links to derived outputs or export jobs

In practical terms, a publication row would represent the canonical document, and related tables would manage contributors, asset references, workflow state and publication history.

### S3-Compatible Object Storage For Media

S3-compatible storage should hold binary assets and any other file-like artefacts.

Typical assets would include:

- imported images
- hero images
- video files
- video posters
- downloadable artefacts where required


### Elasticsearch As Search Layer

Elasticsearch should be treated as a derived search index, not as the master content store.

Candidate indexed fields include:

- title
- dek, or subheadline
- abstract
- canonical body text extracted from PM
- committee name
- contributors
- keywords
- destination
- type
- status
- publication dates

This would allow search, filtering and relevance tuning without making the index itself authoritative.

## A scaled publishing flow

In production, the end-to-end flow would be represented as:

1. a user uploads a `.docx`
2. an ingestion service extracts metadata and converts the document to canonical PM
3. the canonical draft is saved in PostgreSQL
4. imported binary assets are materialised into S3 and referenced from the document
5. editors refine metadata and structured content in the publisher
6. a publish action writes an immutable or versioned release record
7. web-facing JSON or API responses are derived from the canonical document
8. XML is generated for archival/export purposes
9. an indexing job writes search records into Elasticsearch
10. the front end retrieves and renders the publication


## Limitations of proof-of-concept

- browser-local draft persistence rather than server-side draft storage
- local publish semantics rather than a multi-user workflow
- limited asset management while images are in pre-publish state
- no real permissions, audit or approval model
- no production indexing or API layer
- limited table semantics beyond preservation
- pragmatic rather than final XML and archival modelling

Those are important gaps but they do not invalidate the architectural direction.

## Practical Conclusion

The current Stór proof of concept has already answered a key question: a Word-driven publishing workflow can be normalised into a structured document model that Svelte can render cleanly, while still preserving a path to XML, search and richer data handling.

The central pattern is:

`DOCX as input -> PM + metadata as canon -> Svelte/XML/search as derivations`

The next production step is therefore not to rethink the content model from scratch but to operationalise it with:

- PostgreSQL for canonical content and workflow
- S3-compatible storage for assets
- Elasticsearch for search and discovery
- a proper publish/index/export pipeline around the canonical `StorDocument`
