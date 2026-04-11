import type { auth } from '$lib/server/auth';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user?: typeof auth.$Infer.Session.user;
			session?: typeof auth.$Infer.Session.session;
		}
	}
}

declare module '*.mjml?raw' {
	const content: string;
	export default content;
}

export {};
