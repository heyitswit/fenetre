<script lang="ts">
	import { setMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button/index.js';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';

	let {
		size = 'icon',
		class: className
	}: { size?: 'icon' | 'default' | 'sm' | 'lg' | 'icon-sm' | 'icon-lg'; class?: string } = $props();

	function smoothToggle() {
		const html = document.documentElement;
		const isDark = html.classList.contains('dark');
		const next = isDark ? 'light' : 'dark';

		if (!document.startViewTransition) {
			setMode(next);
			return;
		}

		document.startViewTransition(() => {
			html.classList.toggle('dark', !isDark);
			setMode(next);
		});
	}
</script>

<Button variant="ghost" {size} class={className} onclick={smoothToggle}>
	<Sun class="hidden size-4 dark:block" />
	<Moon class="size-4 dark:hidden" />
</Button>
