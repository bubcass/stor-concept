# Stór Publisher: End-to-End Overview

This note is intended for web administrators, platform owners, and data engineers who need a high-level view of how the Stór publishing flow works from document intake through to web delivery.

It describes:

- the editorial workflow now available in the prototype
- the canonical data model used by the publisher
- the transformation path from `.docx` to web output
- the likely production storage and delivery pattern using SQL, Elasticsearch, and S3-compatible object storage

## Executive Summary

The current Stór approach is:

1. import a Word document or start a blank draft
2. capture publication metadata
3. refine the document in a structured editor
4. preview and export from one canonical document model

The important architectural decision is that the canonical body is not HTML and not a flattened block export. The canonical body is a ProseMirror JSON document held inside a structured `StorDocument`.

That means the intended long-term pipeline is:

`DOCX -> transient import HTML -> canonical PM + metadata -> derived web output + derived XML + derived search/index records`

This keeps one source of truth for the publication while still allowing multiple delivery targets.

## What Exists In The Prototype Today

The prototype currently provides two major pieces:

- a Stór front end that renders longform web outputs
- a Stór publisher interface at `/publisher` that can ingest `.docx`, collect metadata, allow structured editing, preview the output, and export canonical JSON/XML

Today, the repo is still essentially a prototype and local publishing environment:

- canonical documents are assembled in the browser
- draft recovery is handled in browser `localStorage`
- media is referenced as local static assets
- exported JSON/XML can be downloaded manually

There is not yet a production persistence layer for canonical documents, assets, workflow state, or indexing.

## Core Publishing Model

The publisher is built around a canonical `StorDocument` model.

At a high level, a canonical document contains:

- routing information such as destination and content type
- publication metadata such as title, dek, status, date, contributors, licence, DOI, and keywords
- web presentation settings such as hero layout and contents visibility
- canonical body content as ProseMirror JSON
- optional enrichments such as image blocks, Flourish embeds, and preserved tables

This is the key distinction from the older PoC:

- the older PoC proved the workflow
- this repo keeps the body in PM as the canonical representation

That reduces format drift and makes it easier to derive multiple outputs from one source.

## Editorial Workflow

The publisher interface is intentionally split into four stages.

### 1. Start

An editor can:

- upload a `.docx`
- or start a blank draft

If a `.docx` is uploaded, the system:

- reads the file in the browser
- converts the Word content to HTML using Mammoth
- transforms that HTML into ProseMirror content
- extracts Word metadata where available

### 2. Publication Details

The editor completes and validates the metadata layer.

This includes:

- destination
- publication status
- title and dek
- publication date
- contributors
- committee selection where relevant
- keywords
- licence
- publisher and DOI fields where needed

The workflow is destination-aware. For example:

- committee reports require committee-specific metadata
- other destinations can show author/profile information on the page

### 3. Edit Content

The editor refines the canonical body for the web.

This stage supports:

- editing imported text in a PM editor
- inserting non-DOCX structured elements such as images and Flourish embeds
- preserving imported tables
- setting web presentation controls such as hero options and committee video options

This is the stage where the source document becomes a web-ready publication rather than just a Word import.

### 4. Preview And Export

The editor sees the rendered web output and can export derived representations.

At present, the prototype can export:

- canonical JSON
- canonical XML

The preview stage is the same conceptual path that a future production publish action would use.

## Document Ingestion Path

From a technical point of view, document ingestion works like this:

### Word import

The publisher accepts a `.docx` file and uses Mammoth to convert it into HTML.

That HTML is treated as a transient import format only. It is not the source of truth.

### Metadata extraction

The publisher also reads Word document properties and maps them into publication metadata where possible.

This reduces manual entry and supports the low-friction workflow established in the earlier PoC.

### Canonical conversion

Imported HTML is converted into ProseMirror JSON using the publisher’s schema and extensions.

That PM document becomes the canonical body content.

### Enrichment

Once in the editor, the publication can be enriched with elements that may not exist in the original `.docx`, for example:

- hero media
- additional images
- Flourish embeds
- committee launch video

This is important operationally: the Word file is an input, not the final editorial envelope.

## Tables

Tables were a known pain point and are now handled explicitly in the pipeline.

Current behavior:

- Word tables survive import
- imported HTML tables are preserved as table blocks in canonical PM
- tables render in preview
- tables are included in XML export

This means tables are no longer dropped during the `.docx -> PM` path.

The next likely area of work in production would be table quality rather than table survival, for example:

- extremely wide tables
- merged cells
- alternative web presentation for repetitive committee tables

## Web Output

The front end is a derived rendering layer over the canonical document.

In practice this means:

- metadata and PM content are converted into a story model
- the story model is rendered by Svelte components
- committee reports and non-committee documents can share common infrastructure while differing in presentation rules

The web output is therefore not the master record. It is a rendered view of the canonical publication object.

## XML Output

The prototype also derives XML from the same canonical source.

This matters because it means:

- XML is not being authored separately
- XML and web output stay aligned
- long-term deposit in an open data or archival repository can be driven from the same source

That is consistent with the long-term direction:

- PM + metadata become canonical
- XML is a derived archival/export format
- web pages are derived presentation formats

## Recommended Production Architecture

For a production deployment using SQL, Elasticsearch, and S3-compatible storage, the cleanest model is:

### 1. SQL as the canonical publication store

Store each publication record in SQL.

Recommended SQL responsibilities:

- canonical publication metadata
- canonical PM JSON body
- workflow status
- audit timestamps
- contributor records
- routing/destination fields
- publication versioning
- references to media assets
- references to derived outputs if stored separately

In practice, the PM body can live in a JSON/JSONB column.

### 2. S3 as the asset store

Use S3-compatible buckets for:

- hero images
- inline/editorial images
- video posters
- videos
- optional downloadable artefacts

Operationally, this gives:

- stable asset URLs
- lifecycle controls
- easier CDN integration
- clearer separation between structured content and binary media

### 3. Elasticsearch as the discovery layer

Use Elasticsearch as a derived search index, not as the source of truth.

Recommended index contents:

- title
- dek/summary
- body text extracted from PM
- committee name
- contributors
- destination
- status
- keywords/topics
- dates
- featured flags
- any public filters needed by the site

The index should be rebuilt or updated from canonical SQL records.

## Recommended End-to-End Production Flow

In production, the process would ideally look like this:

1. Editor creates or imports a draft in the publisher.
2. Publisher converts the `.docx` to canonical metadata + PM JSON.
3. Editor refines metadata and web presentation settings.
4. Editor previews the rendered result.
5. On publish, the canonical `StorDocument` is saved to SQL.
6. Media assets are uploaded to S3 and linked from the canonical record.
7. Derived outputs are generated:
   - rendered web story data
   - XML export
   - search/index payload
8. Elasticsearch is updated from the canonical publication record.
9. The front end serves the published document from canonical/derived persisted data, not from an editor session.

## Responsibilities By Layer

### Publisher layer

Responsible for:

- author workflow
- `.docx` import
- metadata capture
- editorial validation
- PM editing
- preview

### Canonical content layer

Responsible for:

- structured publication schema
- PM body
- contributor and routing rules
- XML derivation
- story derivation

### Delivery layer

Responsible for:

- public web rendering
- search
- caching/CDN behavior
- media serving

### Platform/data layer

Responsible for:

- SQL persistence
- asset storage
- indexing pipeline
- backups
- retention
- operational monitoring

## Why This Model Is Useful

This approach gives a relatively clean separation of concerns:

- editors work in a guided publisher UI
- the organization keeps one canonical structured document
- web pages, XML, and search data are all derived from the same source
- production infrastructure can be managed with conventional web/data tooling

It also avoids a common failure mode in publishing systems: multiple competing master formats for the same document.

## Current Gaps Before Full Production Use

The prototype is in a good place functionally, but a production rollout would still need:

- server-side persistence for canonical publications
- authenticated user and role model
- media upload workflow to managed object storage
- publish/unpublish lifecycle
- revision history and recovery beyond browser draft state
- indexing jobs or event-driven search updates
- operational logging and monitoring
- explicit archival/export workflow for XML deposit

## Suggested Near-Term Delivery Plan

If the next step is to operationalize this stack, a pragmatic sequence would be:

1. Define the canonical SQL schema for `StorDocument` and related contributor/media records.
2. Introduce a publish API that stores canonical JSON in SQL.
3. Add asset upload and asset reference management against S3 buckets.
4. Add an indexing step into Elasticsearch.
5. Move the front end from local/static sample content to persisted published content.
6. Add editorial authentication and workflow permissions.
7. Formalize XML export/deposit as a production output path.

## In One Sentence

Stór now has the key building blocks for a PM-first publishing system in which `.docx` is an intake format, the canonical document is structured metadata plus ProseMirror JSON, and SQL/S3/Elasticsearch can provide the production storage, asset, and discovery layers around that model.
