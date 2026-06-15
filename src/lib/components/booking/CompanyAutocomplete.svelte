<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';

	interface Suggestion {
		siren: string;
		nom: string;
		ville?: string;
	}

	interface Props {
		value: string;
		siren?: string | null;
		placeholder?: string;
		id?: string;
	}

	let { value = $bindable(''), siren = $bindable(null), placeholder, id }: Props = $props();

	let suggestions = $state<Suggestion[]>([]);
	let open = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout>;

	function handleInput(e: Event) {
		const q = (e.currentTarget as HTMLInputElement).value;
		value = q;
		siren = null;

		clearTimeout(debounceTimer);
		if (q.length < 2) {
			suggestions = [];
			open = false;
			return;
		}

		debounceTimer = setTimeout(async () => {
			try {
				const res = await fetch(`/api/pappers/autocomplete?q=${encodeURIComponent(q)}`);
				if (res.ok) {
					suggestions = await res.json();
					open = suggestions.length > 0;
				}
			} catch {
				suggestions = [];
				open = false;
			}
		}, 300);
	}

	function select(s: Suggestion) {
		value = s.nom;
		siren = s.siren;
		open = false;
		suggestions = [];
	}

	function handleBlur() {
		setTimeout(() => {
			open = false;
		}, 150);
	}
</script>

<div class="relative">
	<Input
		{id}
		{value}
		{placeholder}
		oninput={handleInput}
		onblur={handleBlur}
		onfocus={() => {
			if (suggestions.length > 0) open = true;
		}}
		autocomplete="off"
	/>
	{#if open && suggestions.length > 0}
		<div
			class="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-popover shadow-md"
		>
			{#each suggestions as s}
				<button
					type="button"
					class="flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-accent"
					onmousedown={() => select(s)}
				>
					<span class="font-medium">{s.nom}</span>
					{#if s.ville}
						<span class="text-xs text-muted-foreground">{s.ville}</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
