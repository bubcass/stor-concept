import { error } from "@sveltejs/kit";
import { getStoriesBySection } from "$lib/content/stories";

const committeeStories = getStoriesBySection("committees");

export function entries() {
    return committeeStories.map((story) => ({ slug: story.slug }));
}

export function load({ params }) {
    const story = committeeStories.find((entry) => entry.slug === params.slug);

    if (!story) {
        error(404, "Committee article not found");
    }

    return { story };
}
