import fs from "node:fs/promises";
import path from "node:path";
import "dotenv/config";

const projectRoot = process.cwd();
const storiesRoot = path.join(projectRoot, "src/lib/content/stories");
const outputDir = path.join(projectRoot, "static/audio/stories");
const manifestPath = path.join(outputDir, "manifest.json");

// Configure the provider here when adding alternatives later.
const providerName = "elevenlabs";

// Configure the default model here if you want a different baseline.
const defaultModelId =
  process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";

// Configure the maximum chunk size here. Keep it conservative for API stability.
const maxChunkSize = 2200;

function parseEnvFile(content) {
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function loadLocalEnv() {
  for (const filename of [".env.local", ".env"]) {
    const filePath = path.join(projectRoot, filename);
    try {
      const content = await fs.readFile(filePath, "utf8");
      parseEnvFile(content);
    } catch {
      // Ignore missing env files.
    }
  }
}

async function findStoryFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findStoryFiles(fullPath)));
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".ts") &&
      entry.name !== "index.ts"
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function normaliseSourceForEval(source) {
  return source
    .replace(/^import\s+type\s+[^;]+;\s*$/gm, "")
    .replace(/^import\s+[^;]+;\s*$/gm, "")
    .replace(/export\s+const\s+\w+\s*:\s*Story\s*=/, "const __story =")
    .replace(/export\s+default\s+\w+;?\s*$/m, "");
}

async function loadStoryFromFile(filePath) {
  const source = await fs.readFile(filePath, "utf8");
  const script = `${normaliseSourceForEval(source)}\nreturn __story;`;
  const story = new Function(script)();
  return story;
}

function plainText(value) {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function storyBlockText(block) {
  switch (block.type) {
    case "text":
      return [block.heading, ...block.paragraphs];
    case "media-text":
      return [block.eyebrow, block.heading, ...block.paragraphs];
    case "quote":
      return [block.text, block.attribution];
    case "scrolly":
      return [
        block.title,
        block.intro,
        ...block.steps.flatMap((step) => [step.eyebrow, step.title, step.body]),
      ];
    case "scene-scrolly":
      return [
        block.title,
        block.intro,
        ...block.steps.flatMap((step) => [step.eyebrow, step.title, step.body]),
      ];
    case "link-list":
      return [
        block.eyebrow,
        block.heading,
        ...block.links.flatMap((link) => [link.label, link.description]),
      ];
    case "chart":
      return [block.title, block.caption];
    case "vote-map":
      return [block.title, block.intro, block.caption];
    default:
      return [];
  }
}

function storyPlainText(story) {
  return [story.title, story.dek, ...story.blocks.flatMap(storyBlockText)]
    .filter(Boolean)
    .map((value) => plainText(value))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitIntoChunks(text, maxLength) {
  if (text.length <= maxLength) return [text];

  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    const next = `${current} ${sentence}`.trim();
    if (next.length <= maxLength) {
      current = next;
      continue;
    }

    if (current) chunks.push(current);

    if (sentence.length <= maxLength) {
      current = sentence.trim();
      continue;
    }

    const words = sentence.trim().split(/\s+/);
    let wordChunk = "";
    for (const word of words) {
      const candidate = `${wordChunk} ${word}`.trim();
      if (candidate.length <= maxLength) {
        wordChunk = candidate;
      } else {
        if (wordChunk) chunks.push(wordChunk);
        wordChunk = word;
      }
    }
    current = wordChunk;
  }

  if (current) chunks.push(current);
  return chunks;
}

async function synthesizeWithElevenLabs(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const modelId = process.env.ELEVENLABS_MODEL_ID || defaultModelId;

  if (!apiKey || !voiceId) {
    throw new Error("Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID.");
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        output_format: "mp3_44100_128",
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `ElevenLabs request failed: ${response.status} ${errorText}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

async function synthesizeChunks(chunks) {
  const buffers = [];

  for (const chunk of chunks) {
    if (providerName !== "elevenlabs") {
      throw new Error(`Unsupported provider: ${providerName}`);
    }

    buffers.push(await synthesizeWithElevenLabs(chunk));
  }

  return Buffer.concat(buffers);
}

async function readManifest() {
  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeManifest(manifest) {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    manifestPath,
    JSON.stringify(manifest, null, 2) + "\n",
    "utf8",
  );
}

function parseArgs(argv) {
  return {
    force: argv.includes("--force"),
    filters: argv.filter((arg) => !arg.startsWith("--")),
  };
}

function matchesFilters(story, filePath, filters) {
  if (!filters.length) return true;
  return filters.some(
    (filter) => story.slug === filter || filePath.includes(filter),
  );
}

async function main() {
  await loadLocalEnv();
  const { force, filters } = parseArgs(process.argv.slice(2));
  const manifest = await readManifest();
  const files = await findStoryFiles(storiesRoot);

  for (const filePath of files) {
    const story = await loadStoryFromFile(filePath);
    if (!matchesFilters(story, filePath, filters)) continue;

    const outputPath = path.join(outputDir, `${story.slug}.mp3`);
    const publicSrc = `/audio/stories/${story.slug}.mp3`;

    let exists = true;
    try {
      await fs.access(outputPath);
    } catch {
      exists = false;
    }

    if (exists && !force) {
      const stats = await fs.stat(outputPath);
      manifest[story.slug] = {
        src: publicSrc,
        generatedAt: stats.mtime.toISOString(),
        provider: providerName,
      };
      continue;
    }

    const text = storyPlainText(story);
    const chunks = splitIntoChunks(text, maxChunkSize);
    const audioBuffer = await synthesizeChunks(chunks);

    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, audioBuffer);

    manifest[story.slug] = {
      src: publicSrc,
      generatedAt: new Date().toISOString(),
      provider: providerName,
    };
  }

  await writeManifest(manifest);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
