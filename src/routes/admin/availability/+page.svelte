<script lang="ts">
	import { toast } from 'svelte-sonner';
	import * as m from '$lib/paraglide/messages';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { getDayName } from '$lib/utils';
	import { getAllAvailability, saveAvailability } from '$lib/remote/availability.remote';

	type Row = { dayOfWeek: number; startTime: string; endTime: string; isActive: boolean };

	const saved = $derived(await getAllAvailability());

	let rows = $state<Row[]>([]);

	$effect(() => {
		rows = saved.map((r) => ({
			dayOfWeek: r.dayOfWeek,
			startTime: r.startTime,
			endTime: r.endTime,
			isActive: r.isActive
		}));
	});

	let submitting = $state(false);

	// 0 = Sunday … 6 = Saturday, sorted Mon–Sun for display
	const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];

	function rowFor(day: number): Row | undefined {
		return rows.find((r) => r.dayOfWeek === day);
	}

	function toggleDay(day: number) {
		const existing = rowFor(day);
		if (existing) {
			rows = rows.filter((r) => r.dayOfWeek !== day);
		} else {
			rows = [...rows, { dayOfWeek: day, startTime: '09:00', endTime: '18:00', isActive: true }];
		}
	}

	function updateRow(day: number, patch: Partial<Row>) {
		rows = rows.map((r) => (r.dayOfWeek === day ? { ...r, ...patch } : r));
	}

	async function save() {
		submitting = true;
		try {
			await saveAvailability(rows);
			toast.success(m['admin.availability.saved']());
		} catch {
			toast.error(m['admin.availability.error']());
		} finally {
			submitting = false;
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-bold">{m['admin.availability.title']()}</h1>
		<Button onclick={save} disabled={submitting}>
			{#if submitting}<Spinner class="mr-2" />{/if}
			{submitting ? m['admin.availability.saving']() : m['admin.availability.save']()}
		</Button>
	</div>

	<div class="flex flex-col gap-3">
		{#each WEEKDAYS as day}
			{@const row = rowFor(day)}
			<Card.Root>
				<Card.Content class="flex items-center gap-4 py-4">
					<Switch checked={!!row} onCheckedChange={() => toggleDay(day)} />
					<p class="w-28 font-medium capitalize">{getDayName(day)}</p>

					{#if row}
						<div class="flex items-center gap-3">
							<div class="flex items-center gap-2">
								<Label class="text-sm text-muted-foreground"
									>{m['admin.availability.start']()}</Label
								>
								<Input
									type="time"
									value={row.startTime}
									oninput={(e) => updateRow(day, { startTime: e.currentTarget.value })}
									class="w-28"
								/>
							</div>
							<div class="flex items-center gap-2">
								<Label class="text-sm text-muted-foreground">{m['admin.availability.end']()}</Label>
								<Input
									type="time"
									value={row.endTime}
									oninput={(e) => updateRow(day, { endTime: e.currentTarget.value })}
									class="w-28"
								/>
							</div>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
</div>
