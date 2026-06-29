<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import CompanyAutocomplete from '$lib/components/booking/CompanyAutocomplete.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Cal from '$lib/components/ui/calendar/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { getEnabledFields } from '$lib/form-fields';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { createBooking, saveBrief } from '$lib/remote/bookings.remote';
	import { formatDayLabel, formatTime, toastRemoteError } from '$lib/utils';
	import { getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import { ChevronLeft, Clock } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';
	import type { PageProps } from './$types';

	let { data, params }: PageProps = $props();

	const username = $derived(params.username);
	const slug = $derived(params.eventSlug);
	const source = $derived(page.url.searchParams.get('from') ?? 'direct');
	const embed = $derived(page.url.searchParams.get('embed') === '1');

	const eventType = $derived(data.eventType);
	const slots = $derived(data.slots);
	const effectiveFields = $derived(getEnabledFields(eventType?.formFields ?? null));

	const locale = $derived(getLocale());
	const availableDays = $derived(new Set(Object.keys(slots)));
	const minDate = today(getLocalTimeZone());

	function isDateDisabled(date: DateValue): boolean {
		return !availableDays.has(date.toString());
	}

	type Step = 'brief' | 'calendar';
	let step = $state<Step>('brief');
	let briefId = $state<string | null>(null);
	let selectedDate = $state<DateValue | undefined>(undefined);
	let selectedSlot = $state<{ start: string; end: string } | null>(null);
	let submitting = $state(false);

	// Always-shown fields
	let email = $state('');
	let name = $state('');
	let phone = $state('');

	const isPhoneCall = $derived(eventType?.locationType === 'phone');

	// Dynamic form values — keyed by field.key
	function initValues(): Record<string, string> {
		const vals: Record<string, string> = {};
		for (const field of getEnabledFields(data.eventType?.formFields ?? null)) {
			if ((field.type === 'radio' || field.type === 'select') && field.options?.length) {
				vals[field.key] = field.options[0].value;
			} else {
				vals[field.key] = '';
			}
		}
		return vals;
	}
	let values = $state<Record<string, string>>(initValues());

	// Pappers: siren from autocomplete selection
	let selectedSiren = $state<string | null>(null);

	const selectedDaySlots = $derived(selectedDate ? (slots[selectedDate.toString()] ?? []) : []);

	$effect(() => {
		if (selectedDate) selectedSlot = null;
	});

	function isValidEmail(v: string) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
	}

	const BUILT_IN_KEYS = new Set([
		'companyName',
		'projectDescription',
		'stack',
		'missionType',
		'budget',
		'urgency',
		'linkedin'
	]);

	async function submitBrief() {
		if (!email) {
			toast.error(m['booking.error.required_fields']());
			return;
		}
		if (!isValidEmail(email)) {
			toast.error(m['booking.error.invalid_email']());
			return;
		}

		const missingRequired = effectiveFields.filter((f) => f.required && !values[f.key]?.trim());
		if (missingRequired.length > 0) {
			toast.error(m['booking.error.required_fields']());
			return;
		}

		submitting = true;
		try {
			// Separate custom fields from built-in ones
			const customFields: Record<string, string> = {};
			for (const [k, v] of Object.entries(values)) {
				if (!BUILT_IN_KEYS.has(k) && v) customFields[k] = v;
			}

			const result = await saveBrief({
				briefId: briefId ?? undefined,
				username,
				clientEmail: email,
				companyName: values['companyName'] || undefined,
				projectDescription: values['projectDescription'] || undefined,
				stack: values['stack'] || undefined,
				missionType: values['missionType'] || undefined,
				budget: values['budget'] || undefined,
				urgency: values['urgency'] || undefined,
				customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
				companySiren: selectedSiren || undefined
			});
			briefId = result.briefId;
			step = 'calendar';
		} catch (err) {
			toastRemoteError(err, m['booking.error.generic'](), {
				clientEmail: m['booking.error.invalid_email']()
			});
		} finally {
			submitting = false;
		}
	}

	async function confirmBooking() {
		if (!selectedSlot || !briefId || name.trim().length < 2) {
			toast.error(m['booking.error.name_required']());
			return;
		}
		if (isPhoneCall && !phone.trim()) {
			toast.error(m['booking.error.phone_required']());
			return;
		}
		submitting = true;
		try {
			const result = await createBooking({
				briefId,
				username,
				eventTypeSlug: slug,
				startTime: selectedSlot.start,
				clientName: name,
				clientEmail: email,
				clientLinkedin: values['linkedin'] || undefined,
				clientPhone: isPhoneCall ? phone.trim() : undefined,
				source
			});
			goto(
				`/${username}/${result.eventSlug}/confirm?id=${result.bookingId}${embed ? '&embed=1' : ''}`
			);
		} catch (err) {
			toastRemoteError(err, m['booking.error.slot_unavailable'](), {
				clientName: m['booking.error.name_required'](),
				clientEmail: m['booking.error.invalid_email']()
			});
			selectedSlot = null;
		} finally {
			submitting = false;
		}
	}
</script>

{#if !eventType}
	<div class="flex min-h-screen items-center justify-center px-4 text-center">
		<div>
			<p class="text-muted-foreground">{m['booking.not_found']()}</p>
			<Button href="/{username}" variant="ghost" class="mt-4">{m['booking.back']()}</Button>
		</div>
	</div>
{:else if step === 'brief'}
	<!-- ── Brief step: narrow centered form ── -->
	<div class="mx-auto max-w-xl px-4 py-12">
		<Card.Root
			><Card.Content>
				<Button href="/{username}{embed ? '?embed=1' : ''}" variant="ghost" class="mb-8 -ml-2">
					<ChevronLeft class="size-4" />{m['booking.back']()}
				</Button>

				<div class="mb-8">
					<h1 class="text-2xl font-bold">{eventType.name}</h1>
					{#if eventType.description}
						<p class="mt-1 text-muted-foreground">{eventType.description}</p>
					{/if}
					<div class="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
						<Clock class="size-4" />
						<span>{eventType.duration} min</span>
					</div>
				</div>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						submitBrief();
					}}
				>
					<FieldGroup>
						<!-- Email: always shown -->
						<Field>
							<FieldLabel for="email">{m['brief.email']()}</FieldLabel>
							<Input
								id="email"
								type="email"
								bind:value={email}
								placeholder={m['brief.email.placeholder']()}
								required
							/>
						</Field>

						<!-- Dynamic fields from formFields config -->
						{#each effectiveFields as field (field.key)}
							{#if field.type === 'text'}
								<Field>
									<FieldLabel for={field.key}>
										{field.label}
										{#if !field.required}
											<span class="text-muted-foreground">({m['booking.optional']()})</span>
										{/if}
									</FieldLabel>
									{#if field.key === 'companyName'}
										<CompanyAutocomplete
											id={field.key}
											bind:value={values[field.key]}
											bind:siren={selectedSiren}
											placeholder={field.placeholder}
										/>
									{:else}
										<Input
											id={field.key}
											bind:value={values[field.key]}
											placeholder={field.placeholder}
											required={field.required}
										/>
									{/if}
								</Field>
							{:else if field.type === 'textarea'}
								<Field>
									<FieldLabel for={field.key}>
										{field.label}
										{#if !field.required}
											<span class="text-muted-foreground">({m['booking.optional']()})</span>
										{/if}
									</FieldLabel>
									<Textarea
										id={field.key}
										bind:value={values[field.key]}
										placeholder={field.placeholder}
										rows={4}
										required={field.required}
									/>
								</Field>
							{:else if field.type === 'radio' && field.options?.length}
								<Field>
									<FieldLabel>
										{field.label}
										{#if !field.required}
											<span class="text-muted-foreground">({m['booking.optional']()})</span>
										{/if}
									</FieldLabel>
									<RadioGroup bind:value={values[field.key]} class="mt-1 flex flex-col gap-2">
										{#each field.options as opt}
											<div class="flex items-center gap-2">
												<RadioGroupItem value={opt.value} id={`${field.key}-${opt.value}`} />
												<FieldLabel for={`${field.key}-${opt.value}`}>{opt.label}</FieldLabel>
											</div>
										{/each}
									</RadioGroup>
								</Field>
							{:else if field.type === 'select' && field.options?.length}
								<Field>
									<FieldLabel for={field.key}>
										{field.label}
										{#if !field.required}
											<span class="text-muted-foreground">({m['booking.optional']()})</span>
										{/if}
									</FieldLabel>
									<select
										id={field.key}
										class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
										bind:value={values[field.key]}
									>
										{#each field.options as opt}
											<option value={opt.value}>{opt.label}</option>
										{/each}
									</select>
								</Field>
							{/if}
						{/each}

						<p class="text-xs text-muted-foreground">{m['brief.rgpd']()}</p>
						<Button type="submit" class="w-full" disabled={submitting}>
							{#if submitting}<Spinner class="mr-2" />{/if}
							{submitting ? m['brief.submitting']() : m['brief.submit']()}
						</Button>
					</FieldGroup>
				</form>
			</Card.Content></Card.Root
		>
	</div>
{:else}
	<!-- ── Calendar step: full-width 3-col card ── -->
	<div
		class="flex items-start justify-center px-4 py-8 md:h-screen md:items-center md:overflow-hidden"
	>
		<Card.Root
			class="flex w-full max-w-5xl flex-col overflow-hidden md:h-full md:max-h-180"
			style="min-height: 520px;"
		>
			<div
				class="grid min-h-0 flex-1 grid-cols-1 divide-y overflow-hidden md:grid-cols-[240px_1fr_280px] md:divide-x md:divide-y-0"
			>
				<!-- Col 1: event info -->
				<div class="flex flex-col gap-4 overflow-hidden p-6">
					<div>
						<p class="text-xs font-medium tracking-wide text-muted-foreground">
							{eventType.hostName ?? username}
						</p>
						<h2 class="mt-2 text-xl font-bold">{eventType.name}</h2>
						{#if eventType.description}
							<p class="mt-1 text-sm text-muted-foreground">{eventType.description}</p>
						{/if}
					</div>
					<div class="flex items-center gap-1.5 text-sm text-muted-foreground">
						<Clock class="size-4 shrink-0" />
						<span>{eventType.duration} min</span>
					</div>
					<Separator />
					<Field>
						<FieldLabel for="name">{m['calendar.name']()}</FieldLabel>
						<Input id="name" bind:value={name} placeholder={m['calendar.name.placeholder']()} />
					</Field>
					{#if isPhoneCall}
						<Field>
							<FieldLabel for="phone">{m['calendar.phone']()}</FieldLabel>
							<Input
								id="phone"
								type="tel"
								bind:value={phone}
								placeholder={m['calendar.phone.placeholder']()}
							/>
							<p class="text-xs text-muted-foreground">{m['calendar.phone.hint']()}</p>
						</Field>
					{/if}
					<Button
						variant="ghost"
						size="sm"
						class="-ml-2 w-fit text-muted-foreground"
						onclick={() => {
							step = 'brief';
							selectedDate = undefined;
							selectedSlot = null;
						}}
					>
						{m['calendar.edit_brief']()}
					</Button>
				</div>

				<!-- Col 2: calendar -->
				<div class="@container relative overflow-hidden">
					{#if availableDays.size === 0}
						<div class="flex h-full items-center justify-center p-8">
							<Empty.Root>
								<Empty.Header>
									<Empty.Title>{m['calendar.no_slots']()}</Empty.Title>
									<Empty.Description>
										<a href="/{username}/waitlist" class="text-primary hover:underline">
											{m['calendar.no_slots.waitlist']()}
										</a>
									</Empty.Description>
								</Empty.Header>
							</Empty.Root>
						</div>
					{:else}
						<Cal.Calendar
							type="single"
							bind:value={selectedDate}
							{locale}
							{isDateDisabled}
							minValue={minDate}
							weekStartsOn={1}
							class="h-full w-full bg-transparent"
							style="--cell-size: calc((100cqw - 1.5rem) / 7)"
						/>
					{/if}
				</div>

				<!-- Col 3: time slots -->
				<div class="flex flex-col overflow-hidden p-6">
					{#if !selectedDate}
						<p class="text-sm text-muted-foreground">{m['calendar.select_day']()}</p>
					{:else}
						{#key selectedDate}
							<div class="flex min-h-0 flex-1 flex-col" in:fade={{ duration: 120 }}>
								<p class="mb-4 text-sm font-semibold capitalize">
									{formatDayLabel(selectedDate.toString(), locale)}
								</p>

								{#if selectedDaySlots.length === 0}
									<p class="text-sm text-muted-foreground">{m['calendar.no_slots']()}</p>
								{:else}
									<div class="min-h-0 flex-1 overflow-y-auto pr-1">
										<div class="flex flex-col gap-1.5">
											{#each selectedDaySlots as slot}
												<button
													type="button"
													onclick={() => (selectedSlot = slot)}
													class="w-full rounded-lg border px-4 py-3 text-sm font-medium transition-all
												{selectedSlot?.start === slot.start
														? 'border-primary bg-primary text-primary-foreground shadow-sm'
														: 'border-border bg-card hover:border-primary/50 hover:bg-accent'}"
												>
													{formatTime(slot.start, locale)}
												</button>
											{/each}
										</div>
									</div>

									<div class="mt-4 shrink-0 border-t pt-4">
										<Button
											class="w-full"
											disabled={submitting || !name || !selectedSlot}
											onclick={confirmBooking}
										>
											{#if submitting}<Spinner class="mr-2" />{/if}
											{submitting ? m['calendar.confirming']() : m['calendar.confirm']()}
										</Button>
									</div>
								{/if}
							</div>
						{/key}
					{/if}
				</div>
			</div>
		</Card.Root>
	</div>
{/if}
