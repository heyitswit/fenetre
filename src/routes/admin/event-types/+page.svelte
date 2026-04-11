<script lang="ts">
	import { toast } from 'svelte-sonner';
	import * as m from '$lib/paraglide/messages';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field/index.js';
	import { slide } from 'svelte/transition';
	import {
		getAllEventTypes,
		createEventType,
		updateEventType
	} from '$lib/remote/eventTypes.remote';

	type EventType = Awaited<ReturnType<typeof getAllEventTypes>>[number];

	const eventTypes = $derived(await getAllEventTypes());

	let editing = $state<EventType | null>(null);
	let creating = $state(false);
	let submitting = $state(false);

	let formSlug = $state('');
	let formName = $state('');
	let formDescription = $state('');
	let formDuration = $state(30);
	let formSortOrder = $state(0);

	function openCreate() {
		editing = null;
		creating = true;
		formSlug = '';
		formName = '';
		formDescription = '';
		formDuration = 30;
		formSortOrder = 0;
	}

	function openEdit(et: EventType) {
		creating = false;
		editing = et;
		formSlug = et.slug;
		formName = et.name;
		formDescription = et.description ?? '';
		formDuration = et.duration;
		formSortOrder = et.sortOrder ?? 0;
	}

	async function submitCreate() {
		submitting = true;
		try {
			await createEventType({
				slug: formSlug,
				name: formName,
				description: formDescription || undefined,
				duration: formDuration,
				sortOrder: formSortOrder
			});
			toast.success(m['admin.event_types.created']());
			creating = false;
		} catch {
			toast.error(m['admin.event_types.error']());
		} finally {
			submitting = false;
		}
	}

	async function submitEdit() {
		if (!editing) return;
		submitting = true;
		try {
			await updateEventType({
				id: editing.id,
				slug: formSlug,
				name: formName,
				description: formDescription || undefined,
				duration: formDuration,
				sortOrder: formSortOrder
			});
			toast.success(m['admin.event_types.updated']());
			editing = null;
		} catch {
			toast.error(m['admin.event_types.error']());
		} finally {
			submitting = false;
		}
	}

	async function toggleActive(et: EventType) {
		try {
			await updateEventType({ id: et.id, isActive: !et.isActive });
			toast.success(
				et.isActive ? m['admin.event_types.deactivated']() : m['admin.event_types.activated']()
			);
		} catch {
			toast.error(m['admin.event_types.error']());
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-bold">{m['admin.event_types.title']()}</h1>
		<Button onclick={openCreate}>{m['admin.event_types.create']()}</Button>
	</div>

	{#if creating || editing}
		<div transition:slide={{ duration: 200, axis: 'y' }}>
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-base">
						{creating ? m['admin.event_types.new']() : m['admin.event_types.edit']()}
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<form
						onsubmit={(e) => {
							e.preventDefault();
							creating ? submitCreate() : submitEdit();
						}}
					>
						<FieldGroup>
							<div class="grid grid-cols-2 gap-4">
								<Field>
									<FieldLabel for="f-name">{m['admin.event_types.form.name']()}</FieldLabel>
									<Input id="f-name" bind:value={formName} required />
								</Field>
								<Field>
									<FieldLabel for="f-slug">{m['admin.event_types.form.slug']()}</FieldLabel>
									<Input id="f-slug" bind:value={formSlug} required />
								</Field>
							</div>
							<Field>
								<FieldLabel for="f-desc">{m['admin.event_types.form.description']()}</FieldLabel>
								<Textarea id="f-desc" bind:value={formDescription} rows={2} />
							</Field>
							<div class="grid grid-cols-2 gap-4">
								<Field>
									<FieldLabel for="f-duration">{m['admin.event_types.form.duration']()}</FieldLabel>
									<Input id="f-duration" type="number" bind:value={formDuration} min={5} required />
								</Field>
								<Field>
									<FieldLabel for="f-order">{m['admin.event_types.form.order']()}</FieldLabel>
									<Input id="f-order" type="number" bind:value={formSortOrder} />
								</Field>
							</div>
							<div class="flex justify-end gap-2">
								<Button
									type="button"
									variant="ghost"
									onclick={() => {
										creating = false;
										editing = null;
									}}
								>
									{m['admin.event_types.form.cancel']()}
								</Button>
								<Button type="submit" disabled={submitting}>
									{#if submitting}<Spinner class="mr-2" />{/if}
									{m['admin.event_types.form.save']()}
								</Button>
							</div>
						</FieldGroup>
					</form>
				</Card.Content>
			</Card.Root>

			<Separator />
		</div>
	{/if}

	<div class="flex flex-col gap-3">
		{#each eventTypes as et}
			<Card.Root class={et.isActive ? '' : 'opacity-60'}>
				<Card.Content class="flex items-center justify-between gap-4 py-4">
					<div>
						<div class="flex items-center gap-2">
							<p class="font-medium">{et.name}</p>
							<Badge variant="secondary">{et.duration} min</Badge>
							{#if !et.isActive}
								<Badge variant="outline">{m['admin.event_types.inactive']()}</Badge>
							{/if}
						</div>
						{#if et.description}
							<p class="mt-0.5 text-sm text-muted-foreground">{et.description}</p>
						{/if}
						<p class="text-xs text-muted-foreground">/{et.slug}</p>
					</div>
					<div class="flex items-center gap-2">
						<Switch checked={et.isActive} onCheckedChange={() => toggleActive(et)} />
						<Button variant="ghost" size="sm" onclick={() => openEdit(et)}>
							{m['admin.event_types.edit']()}
						</Button>
					</div>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
</div>
