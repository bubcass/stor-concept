import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { StorDocument } from '$lib/content/stor/types';

type PublishPayload = {
  path?: string;
  document?: StorDocument;
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const payload = (await request.json()) as PublishPayload;
    const relativePath = payload.path?.trim();
    const document = payload.document;

    if (!relativePath || !document) {
      return json({ ok: false }, { status: 400 });
    }

    const targetPath = resolve(process.cwd(), relativePath);
    const contentRoot = resolve(process.cwd(), 'src/lib/content/stor/documents');

    if (!targetPath.startsWith(contentRoot)) {
      return json({ ok: false }, { status: 400 });
    }

    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

    return json({ ok: true, path: relativePath });
  } catch {
    return json({ ok: false }, { status: 500 });
  }
};
