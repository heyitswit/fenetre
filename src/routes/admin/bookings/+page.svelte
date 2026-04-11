<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import * as m from '$lib/paraglide/messages';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field/index.js';
	import { fade } from 'svelte/transition';
	import { Video } from '@lucide/svelte';
	import { formatDate, formatTime } from '$lib/utils';
	import { getAllBookings, getBookingById, updateBookingOutcome } from '$lib/remote/bookings.remote';

	const bookings = $derived(await getAllBookings());

	const selectedId = $derived(page.url.searchParams.get('id'));
	const selected = $derived(selectedId ? await getBookingById({ id: selectedId }) : null);

	let filterStatus = $state('all');
	let filterSource = $state('all');
	let outcomeNotes = $state('');
	let savingOutcome = $state(false);

	$effect(() => {
		if (!selected) return;
		outcomeNotes = selected.tracking?.notes ?? '';
	});

	const filtered = $derived(
		bookings.filter((b) => {
			if (filterStatus !== 'all' && b.status !== filterStatus) return false;
			if (filterSource !== 'all' && (b.source ?? 'direct') !== filterSource) return false;
			return true;
		})
	);

	const STATUSES = $derived([
		{ value: 'all', label: m['admin.bookings.filter.all']() },
		{ value: 'confirmed', label: m['admin.bookings.status.confirmed']() },
		{ value: 'cancelled', label: m['admin.bookings.status.cancelled']() },
		{ value: 'rescheduled', label: m['admin.bookings.status.rescheduled']() },
		{ value: 'completed', label: m['admin.bookings.status.completed']() }
	]);

	const SOURCES = $derived([
		{ value: 'all', label: m['admin.bookings.filter.all']() },
		{ value: 'malt', label: 'Malt' },
		{ value: 'linkedin', label: 'LinkedIn' },
		{ value: 'portfolio', label: 'Portfolio' },
		{ value: 'direct', label: 'Direct' }
	]);

	const OUTCOMES = $derived([
		{ value: 'pending', label: m['admin.bookings.outcome.pending']() },
		{ value: 'signed', label: m['admin.bookings.outcome.signed']() },
		{ value: 'declined', label: m['admin.bookings.outcome.declined']() },
		{ value: 'followup', label: m['admin.bookings.outcome.followup']() },
		{ value: 'ghost', label: m['admin.bookings.outcome.ghost']() }
	]);

	function outcomeLabel(value: string | null) {
		return OUTCOMES.find((o) => o.value === value)?.label ?? value ?? '—';
	}

	function statusLabel(status: string) {
		return STATUSES.find((s) => s.value === status)?.label ?? status;
	}

	const MISSION_LABELS: Record<string, () => string> = {
		courte: m['brief.mission.courte'],
		longue: m['brief.mission.longue'],
		conseil: m['brief.mission.conseil']
	};

	const URGENCY_LABELS: Record<string, () => string> = {
		normal: m['brief.urgency.normal'],
		urgent: m['brief.urgency.urgent']
	};

	function missionLabel(type: string) {
		return MISSION_LABELS[type]?.() ?? type;
	}

	function urgencyLabel(type: string) {
		return URGENCY_LABELS[type]?.() ?? type;
	}

	function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
		if (status === 'confirmed') return 'default';
		if (status === 'cancelled') return 'destructive';
		return 'secondary';
	}

	async function saveOutcome(outcome: string) {
		if (!selected) return;
		savingOutcome = true;
		try {
			await updateBookingOutcome({ bookingId: selected.id, outcome, notes: outcomeNotes });
			toast.success(m['admin.bookings.tracking.saved']());
		} catch {
			toast.error(m['admin.bookings.tracking.error']());
		} finally {
			savingOutcome = false;
		}
	}
</script>

<div class="flex h-full gap-6">
	<div class="w-80 flex-shrink-0">
		<div class="mb-4 flex items-center justify-between">
			<h1 class="text-xl font-bold">{m['admin.bookings.title']()}</h1>
			<Badge variant="secondary">{filtered.length}</Badge>
		</div>

		<div class="mb-3 grid grid-cols-2 gap-2">
			<Select.Root type="single" bind:value={filterStatus}>
				<Select.Trigger class="text-xs" size="sm">
					<span class="text-muted-foreground">{m['admin.bookings.filter.status']()}:</span>
					{STATUSES.find((s) => s.value === filterStatus)?.label}
				</Select.Trigger>
				<Select.Content>
					{#each STATUSES as s}
						<Select.Item value={s.value}>{s.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>

			<Select.Root type="single" bind:value={filterSource}>
				<Select.Trigger class="text-xs" size="sm">
					<span class="text-muted-foreground">{m['admin.bookings.filter.source']()}:</span>
					{SOURCES.find((s) => s.value === filterSource)?.label}
				</Select.Trigger>
				<Select.Content>
					{#each SOURCES as s}
						<Select.Item value={s.value}>{s.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<div class="flex flex-col gap-2">
			{#each filtered as booking}
				{@const isSelected = booking.id === selectedId}
				<button
					type="button"
					onclick={() => goto(`/admin/bookings?id=${booking.id}`)}
					class="w-full rounded-lg border p-3 text-left transition-colors
						{isSelected ? 'border-primary bg-primary/5' : 'hover:bg-accent'}"
				>
					<div class="flex items-center justify-between gap-2">
						<p class="truncate text-sm font-medium">{booking.clientName}</p>
						<Badge variant={statusBadgeVariant(booking.status)} class="shrink-0 text-xs">
							{statusLabel(booking.status)}
						</Badge>
					</div>
					<p class="mt-1 truncate text-xs text-muted-foreground">
						{booking.eventType.name} · {formatDate(booking.startTime.toISOString())}
					</p>
				</button>
			{/each}
		</div>
	</div>

	<Separator orientation="vertical" />

	<div class="flex-1 overflow-auto">
		{#if !selected}
			<div class="flex h-full items-center justify-center text-muted-foreground">
				<p>{m['admin.bookings.empty']()}</p>
			</div>
		{:else}
			{#key selectedId}
			<div class="flex flex-col gap-6" in:fade={{ duration: 150 }}>
				<div class="flex items-start justify-between">
					<div>
						<h2 class="text-xl font-bold">{selected.clientName}</h2>
						<p class="text-sm text-muted-foreground">{selected.clientEmail}</p>
						{#if selected.clientLinkedin}
							<a
								href={selected.clientLinkedin}
								target="_blank"
								rel="noopener noreferrer"
								class="text-xs text-primary hover:underline"
							>
								LinkedIn
							</a>
						{/if}
					</div>
					<Badge variant={statusBadgeVariant(selected.status)}>{statusLabel(selected.status)}</Badge>
				</div>

				<Card.Root>
					<Card.Header>
						<Card.Title class="text-base">{selected.eventType.name}</Card.Title>
					</Card.Header>
					<Card.Content class="flex flex-col gap-1 text-sm text-muted-foreground">
						<p>
							{m['admin.bookings.datetime']({
								date: formatDate(selected.startTime.toISOString()),
								start: formatTime(selected.startTime.toISOString()),
								end: formatTime(selected.endTime.toISOString())
							})}
						</p>
						{#if selected.source}
							<p>{m['admin.bookings.source']()} {selected.source}</p>
						{/if}
					</Card.Content>
					{#if selected.meetLink}
						<Card.Footer>
							<Button
								href={selected.meetLink}
								target="_blank"
								rel="noopener noreferrer"
								variant="outline"
								size="sm"
								class="gap-2"
							>
								<Video class="size-3.5" />
								Google Meet
							</Button>
						</Card.Footer>
					{/if}
				</Card.Root>

				{#if selected.brief}
					<Card.Root>
						<Card.Header>
							<Card.Title class="text-base">{m['admin.bookings.brief.title']()}</Card.Title>
						</Card.Header>
						<Card.Content class="flex flex-col gap-2 text-sm">
							{#if selected.brief.projectDescription}
								<p>{selected.brief.projectDescription}</p>
							{/if}
							<div class="flex flex-wrap gap-4 text-muted-foreground">
								{#if selected.brief.stack}
									<span>{m['admin.bookings.brief.stack']()} {selected.brief.stack}</span>
								{/if}
								{#if selected.brief.missionType}
									<span>{m['admin.bookings.brief.mission']()} {missionLabel(selected.brief.missionType)}</span>
								{/if}
								{#if selected.brief.budget}
									<span>{m['admin.bookings.brief.budget']()} {selected.brief.budget}</span>
								{/if}
								{#if selected.brief.urgency}
									<span>{m['admin.bookings.brief.urgency']()} {urgencyLabel(selected.brief.urgency)}</span>
								{/if}
							</div>
						</Card.Content>
					</Card.Root>
				{/if}

				{#if selected.insights}
					<Card.Root>
						<Card.Header>
							<Card.Title class="text-base">{m['admin.bookings.insights.title']()}</Card.Title>
							{#if selected.insights.compatibilityScore !== null}
								<Card.Description>
									{m['admin.bookings.insights.score']({ score: selected.insights.compatibilityScore })}
								</Card.Description>
							{/if}
						</Card.Header>
						<Card.Content class="flex flex-col gap-3 text-sm">
							{#if selected.insights.company}
								<div>
									<p class="font-medium">{selected.insights.company}</p>
									{#if selected.insights.companySector}
										<p class="text-muted-foreground">{selected.insights.companySector}</p>
									{/if}
								</div>
							{/if}
							{#if selected.insights.aiBrief}
								<p>{selected.insights.aiBrief}</p>
							{/if}
							{#if selected.insights.aiOpeningQuestion}
								<p class="italic text-muted-foreground">"{selected.insights.aiOpeningQuestion}"</p>
							{/if}
						</Card.Content>
					</Card.Root>
				{/if}

				<Card.Root>
					<Card.Header>
						<Card.Title class="text-base">{m['admin.bookings.tracking.title']()}</Card.Title>
					</Card.Header>
					<Card.Content>
						<FieldGroup>
							<Field>
								<FieldLabel>{m['admin.bookings.tracking.outcome']()}</FieldLabel>
								{@const currentOutcome = selected.tracking?.outcome ?? 'pending'}
							<Select.Root type="single" value={currentOutcome} onValueChange={(v: string) => saveOutcome(v)}>
									<Select.Trigger class="w-full">
										{outcomeLabel(currentOutcome)}
									</Select.Trigger>
									<Select.Content>
										{#each OUTCOMES as opt}
											<Select.Item value={opt.value}>{opt.label}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</Field>
							<Field>
								<FieldLabel>{m['admin.bookings.tracking.notes']()}</FieldLabel>
								<Textarea
									bind:value={outcomeNotes}
									rows={3}
									placeholder={m['admin.bookings.tracking.notes.placeholder']()}
								/>
							</Field>
							<Button
								onclick={() => saveOutcome(selected.tracking?.outcome ?? 'pending')}
								disabled={savingOutcome}
								class="w-full"
							>
								{#if savingOutcome}<Spinner class="mr-2" />{/if}
								{m['admin.bookings.tracking.save']()}
							</Button>
						</FieldGroup>
					</Card.Content>
				</Card.Root>
			</div>
			{/key}
		{/if}
	</div>
</div>
