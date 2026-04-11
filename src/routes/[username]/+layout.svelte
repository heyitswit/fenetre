<script lang="ts">
	import { page } from '$app/state';
	import LanguageSelector from '$lib/components/language-selector.svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';

	let { children } = $props();

	const embed = $derived(page.url.searchParams.get('embed') === '1');
</script>

{@render children()}

{#if !embed}
	<div class="fixed right-4 bottom-4 flex items-center gap-1">
		<LanguageSelector />
		<ThemeToggle class="h-8 w-8" />
	</div>
{/if}
