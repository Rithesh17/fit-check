// Ensure this page is pre-rendered as a static page
export const prerender = true;

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	// No server-side data needed for fitness app
	return {};
}
