import type { StorDestination } from '$lib/content/stor/types';

function slugify(input: string) {
  const base = input.trim() || 'untitled';
  return (
    base
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-]+|[-]+$/g, '')
      .toLowerCase() || 'untitled'
  );
}

export function destinationFolder(destination: StorDestination) {
  switch (destination) {
    case 'committee-reports':
      return 'committee-reports';
    case 'houses-of-the-oireachtas':
      return 'houses-of-the-oireachtas';
    case 'library-research-service':
      return 'library-research-service';
    case 'parliamentary-budget-office':
      return 'parliamentary-budget-office';
  }
}

export function suggestedStorDocumentPath(options: {
  destination: StorDestination;
  committeeName?: string;
  slug: string;
}) {
  const base = `src/lib/content/stor/documents/${destinationFolder(options.destination)}`;

  if (options.destination === 'committee-reports') {
    const committeeFolder = slugify(options.committeeName || 'unsorted-committee');
    return `${base}/${committeeFolder}/${options.slug}.json`;
  }

  return `${base}/${options.slug}.json`;
}
