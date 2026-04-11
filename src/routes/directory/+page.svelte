<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { ArrowRight } from '@lucide/svelte';
	import { getAllUsernames } from '$lib/remote/users.remote';
	import * as m from '$lib/paraglide/messages';

	const users = $derived(await getAllUsernames());
</script>

<div class="flex min-h-screen flex-col items-center px-6 py-24">
	<div class="w-full max-w-sm">
		<div class="mb-10 text-center">
			<a href="/">
				<img src="/image.png" alt="Fenêtre" class="mx-auto mb-4 size-10 rounded-full shadow-sm" />
			</a>
			<h1 class="text-2xl">Fenêtre</h1>
			<p class="mt-1 text-sm text-muted-foreground">{m['directory.subtitle']()}</p>
		</div>

		{#if users.length === 0}
			<p class="text-center text-sm text-muted-foreground">{m['home.directory.empty']()}</p>
		{:else}
			<div class="space-y-2">
				{#each users as u}
					<a
						href="/{u.username}"
						class="user-card flex items-center gap-3 rounded-xl border border-border bg-card p-4"
					>
						<div
							class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary"
						>
							{u.name[0].toUpperCase()}
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate font-medium">{u.name}</p>
							<p class="text-xs text-muted-foreground">/{u.username}</p>
						</div>
						<ArrowRight size={15} class="shrink-0 text-muted-foreground" />
					</a>
				{/each}
			</div>
		{/if}

		<div class="mt-8 text-center">
			<Button href="/" variant="ghost" size="sm">← Back</Button>
		</div>
	</div>
</div>

<style>
	.user-card {
		transition:
			box-shadow 0.18s ease,
			transform 0.18s ease;
	}

	.user-card:hover {
		box-shadow: var(--shadow);
		transform: translateY(-1px);
	}
</style>
