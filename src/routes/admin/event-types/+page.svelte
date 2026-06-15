<script lang="ts">
	import { toast } from 'svelte-sonner';
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
	import { ChevronDown, Trash, X } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages';
	import { DEFAULT_FORM_FIELDS, deepCopyFields, type FormField } from '$lib/form-fields';
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
	let formFields = $state<FormField[]>(deepCopyFields(DEFAULT_FORM_FIELDS));

	// Field editor state
	let expandedField = $state<string | null>(null);
	let addingField = $state(false);
	let newFieldLabel = $state('');
	let newFieldType = $state<'text' | 'textarea' | 'radio' | 'select'>('text');

	function openCreate() {
		editing = null;
		creating = true;
		formSlug = '';
		formName = '';
		formDescription = '';
		formDuration = 30;
		formSortOrder = 0;
		formFields = deepCopyFields(DEFAULT_FORM_FIELDS);
		expandedField = null;
		addingField = false;
	}

	function openEdit(et: EventType) {
		creating = false;
		editing = et;
		formSlug = et.slug;
		formName = et.name;
		formDescription = et.description ?? '';
		formDuration = et.duration;
		formSortOrder = et.sortOrder ?? 0;
		formFields = deepCopyFields((et.formFields as FormField[] | null) ?? DEFAULT_FORM_FIELDS);
		expandedField = null;
		addingField = false;
	}

	function resetFieldsToDefaults() {
		formFields = deepCopyFields(DEFAULT_FORM_FIELDS);
		expandedField = null;
	}

	function addOption(fieldKey: string) {
		const field = formFields.find((f) => f.key === fieldKey);
		if (!field) return;
		if (!field.options) field.options = [];
		field.options.push({ value: '', label: '' });
	}

	function removeOption(fieldKey: string, idx: number) {
		const field = formFields.find((f) => f.key === fieldKey);
		if (!field?.options) return;
		field.options.splice(idx, 1);
	}

	function removeCustomField(idx: number) {
		const removedKey = formFields[idx]?.key;
		formFields.splice(idx, 1);
		if (expandedField === removedKey) expandedField = null;
	}

	function confirmAddField() {
		if (!newFieldLabel.trim()) return;
		const key = `custom_${Date.now()}`;
		formFields.push({
			key,
			label: newFieldLabel.trim(),
			type: newFieldType,
			enabled: true,
			options:
				newFieldType === 'radio' || newFieldType === 'select'
					? [
							{ value: 'option_1', label: 'Option 1' },
							{ value: 'option_2', label: 'Option 2' }
						]
					: undefined
		});
		expandedField = key;
		newFieldLabel = '';
		newFieldType = 'text';
		addingField = false;
	}

	async function submitCreate() {
		submitting = true;
		try {
			await createEventType({
				slug: formSlug,
				name: formName,
				description: formDescription || undefined,
				duration: formDuration,
				sortOrder: formSortOrder,
				formFields
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
				sortOrder: formSortOrder,
				formFields
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

	const FIELD_TYPE_LABELS: Record<string, string> = {
		text: 'Texte',
		textarea: 'Texte long',
		radio: 'Choix unique',
		select: 'Liste déroulante'
	};
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
							<!-- Basic info -->
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
									<FieldLabel for="f-duration"
										>{m['admin.event_types.form.duration']()}</FieldLabel
									>
									<Input
										id="f-duration"
										type="number"
										bind:value={formDuration}
										min={5}
										required
									/>
								</Field>
								<Field>
									<FieldLabel for="f-order">{m['admin.event_types.form.order']()}</FieldLabel>
									<Input id="f-order" type="number" bind:value={formSortOrder} />
								</Field>
							</div>

							<Separator />

							<!-- Form field editor -->
							<div>
								<div class="mb-3 flex items-center justify-between">
									<p class="text-sm font-medium">Formulaire de brief</p>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onclick={resetFieldsToDefaults}
										class="text-xs text-muted-foreground"
									>
										Réinitialiser
									</Button>
								</div>

								<div class="flex flex-col gap-2">
									{#each formFields as field, i (field.key)}
										<div class="rounded-md border">
											<!-- Field header -->
											<div class="flex items-center gap-2.5 px-3 py-2">
												<Switch
													checked={field.enabled}
													onCheckedChange={(v) => {
														field.enabled = v;
													}}
												/>
												<span class="min-w-0 flex-1 truncate text-sm font-medium"
													>{field.label}</span
												>
												<Badge variant="secondary" class="shrink-0 text-xs">
													{FIELD_TYPE_LABELS[field.type] ?? field.type}
												</Badge>
												{#if field.required}
													<Badge variant="outline" class="shrink-0 text-xs">requis</Badge>
												{/if}
												{#if field.key.startsWith('custom_')}
													<button
														type="button"
														class="shrink-0 text-muted-foreground hover:text-destructive"
														onclick={() => removeCustomField(i)}
													>
														<Trash class="size-3.5" />
													</button>
												{/if}
												<button
													type="button"
													class="shrink-0 text-muted-foreground"
													onclick={() => {
														expandedField = expandedField === field.key ? null : field.key;
													}}
												>
													<ChevronDown
														class="size-4 transition-transform {expandedField === field.key
															? 'rotate-180'
															: ''}"
													/>
												</button>
											</div>

											<!-- Expanded editor -->
											{#if expandedField === field.key}
												<div
													class="border-t px-3 py-3"
													transition:slide={{ duration: 150, axis: 'y' }}
												>
													<div class="flex flex-col gap-3">
														<Field>
															<FieldLabel>Label</FieldLabel>
															<Input bind:value={field.label} placeholder="Label du champ" />
														</Field>
														{#if field.type === 'text' || field.type === 'textarea'}
															<Field>
																<FieldLabel>Placeholder</FieldLabel>
																<Input
																	bind:value={field.placeholder}
																	placeholder="Texte indicatif..."
																/>
															</Field>
														{/if}
														<div class="flex items-center gap-2">
															<Switch
																id={`req-${field.key}`}
																checked={field.required ?? false}
																onCheckedChange={(v) => {
																	field.required = v;
																}}
															/>
															<FieldLabel for={`req-${field.key}`} class="cursor-pointer"
																>Champ obligatoire</FieldLabel
															>
														</div>
														{#if field.type === 'radio' || field.type === 'select'}
															<div>
																<FieldLabel class="mb-2 block">Options</FieldLabel>
																<div class="flex flex-col gap-1.5">
																	{#each field.options ?? [] as opt, j}
																		<div class="flex gap-2">
																			<Input
																				bind:value={opt.value}
																				placeholder="valeur"
																				class="w-28 text-sm"
																			/>
																			<Input
																				bind:value={opt.label}
																				placeholder="Label affiché"
																				class="flex-1 text-sm"
																			/>
																			<button
																				type="button"
																				class="shrink-0 text-muted-foreground hover:text-destructive"
																				onclick={() => removeOption(field.key, j)}
																			>
																				<X class="size-4" />
																			</button>
																		</div>
																	{/each}
																	<Button
																		type="button"
																		variant="ghost"
																		size="sm"
																		class="w-fit text-xs"
																		onclick={() => addOption(field.key)}
																	>
																		+ Ajouter une option
																	</Button>
																</div>
															</div>
														{/if}
													</div>
												</div>
											{/if}
										</div>
									{/each}
								</div>

								<!-- Add custom field -->
								{#if addingField}
									<div
										class="mt-2 rounded-md border p-3"
										transition:slide={{ duration: 150, axis: 'y' }}
									>
										<div class="flex flex-col gap-3">
											<div class="grid grid-cols-2 gap-3">
												<Field>
													<FieldLabel>Label</FieldLabel>
													<Input
														bind:value={newFieldLabel}
														placeholder="Ex: Taille d'équipe..."
													/>
												</Field>
												<Field>
													<FieldLabel>Type</FieldLabel>
													<select
														bind:value={newFieldType}
														class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
													>
														<option value="text">Texte</option>
														<option value="textarea">Texte long</option>
														<option value="radio">Choix unique</option>
														<option value="select">Liste déroulante</option>
													</select>
												</Field>
											</div>
											<div class="flex gap-2">
												<Button type="button" size="sm" onclick={confirmAddField}>Ajouter</Button>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onclick={() => {
														addingField = false;
													}}>Annuler</Button
												>
											</div>
										</div>
									</div>
								{:else}
									<Button
										type="button"
										variant="ghost"
										size="sm"
										class="mt-2 text-xs text-muted-foreground"
										onclick={() => {
											addingField = true;
										}}
									>
										+ Ajouter un champ personnalisé
									</Button>
								{/if}
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
