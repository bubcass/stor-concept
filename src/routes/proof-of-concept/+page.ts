import { redirect } from "@sveltejs/kit";

export function load() {
    redirect(308, "/proof-of-concept/committees/");
}
