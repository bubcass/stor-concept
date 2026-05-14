import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import { stories } from '$lib/content/stories';

export function entries() {
  return stories.map((story) => ({ slug: story.slug }));
}

export function load({ params }) {
  redirect(308, `${base}/articles/${params.slug}/`);
}
