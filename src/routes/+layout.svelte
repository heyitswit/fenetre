<script lang="ts">
	import { page } from '$app/state';
	import { Toaster } from '$lib/components/ui/sonner';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import { ModeWatcher, mode } from 'mode-watcher';
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href="/favicon.ico" /></svelte:head>

<ModeWatcher defaultMode="light" />
<Toaster theme={mode.current === 'dark' ? 'dark' : 'light'} />

{@render children()}
<div style="display:none">
	{#each locales as locale}
		<a href={localizeHref(page.url.pathname, { locale })}>
			{locale}
		</a>
	{/each}
</div>
