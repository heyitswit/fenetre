<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import * as m from '$lib/paraglide/messages';
	import { Calendar, Clock, ChevronLeft } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { formatDate, formatTime, formatDayLabel, toastRemoteError } from '$lib/utils';
	import { slide } from 'svelte/transition';
	import { getBookingByToken, rescheduleBooking } from '$lib/remote/bookings.remote';
	import { getAvailableSlots } from '$lib/remote/availability.remote';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	const token = $derived(params.token);
	const booking = $derived(await getBookingByToken({ token }));
	const slots = $derived(
		booking?.username
			? await getAvailableSlots({
					username: booking.username,
					eventTypeSlug: booking.eventType.slug
				})
			: {}
	);

	let selectedSlot = $state<{ start: string; end: string } | null>(null);
	let submitting = $state(false);

	const sortedDays = $derived(Object.keys(slots).sort());

	async function confirm() {
		if (!selectedSlot) return;
		submitting = true;
		try {
			await rescheduleBooking({ token, startTime: selectedSlot.start });
			toast.success(m['reschedule.success']());
			goto('/');
		} catch (err) {
			toastRemoteError(err, m['booking.error.slot_unavailable']());
			selectedSlot = null;
		} finally {
			submitting = false;
		}
	}
</script>

<div class="mx-auto max-w-lg px-4 py-12">
	<Button href="/" variant="ghost" class="mb-6 -ml-2">
		<ChevronLeft class="size-4" />{m['booking.back']()}
	</Button>

	{#if !booking}
		<div class="text-center">
			<p class="text-muted-foreground">{m['reschedule.invalid']()}</p>
			<Button href="/" class="mt-4">{m['reschedule.book_new']()}</Button>
		</div>
	{:else}
		<h1 class="mb-6 text-2xl font-bold">{m['reschedule.title']()}</h1>

		<Card.Root class="mb-8">
			<Card.Header>
				<Card.Title>{booking.eventType.name}</Card.Title>
			</Card.Header>
			<Card.Content class="flex flex-col gap-2 text-sm text-muted-foreground">
				<div class="flex items-center gap-2">
					<Calendar class="size-4" />
					<span class="capitalize">{formatDate(booking.startTime.toISOString())}</span>
				</div>
				<div class="flex items-center gap-2">
					<Clock class="size-4" />
					<span>{formatTime(booking.startTime.toISOString())}</span>
				</div>
			</Card.Content>
		</Card.Root>

		<div class="flex flex-col gap-6">
			<p class="text-sm font-medium">{m['reschedule.choose']()}</p>

			{#if sortedDays.length === 0}
				<Empty.Root>
					<Empty.Header>
						<Empty.Title>{m['calendar.no_slots']()}</Empty.Title>
						<Empty.Description>
							<a href="/waitlist">{m['calendar.no_slots.waitlist']()}</a>
						</Empty.Description>
					</Empty.Header>
				</Empty.Root>
			{:else}
				{#each sortedDays as day}
					<div>
						<p class="mb-2 text-sm font-medium capitalize">{formatDate(day)}</p>
						<div class="flex flex-wrap gap-2">
							{#each slots[day] as slot}
								<button
									type="button"
									onclick={() => (selectedSlot = slot)}
									class="rounded-lg border px-3 py-1.5 text-sm transition-colors
										{selectedSlot?.start === slot.start
										? 'border-primary bg-primary text-primary-foreground'
										: 'hover:border-primary/50 hover:bg-accent'}"
								>
									{formatTime(slot.start)}
								</button>
							{/each}
						</div>
					</div>
				{/each}

				{#if selectedSlot}
					<div transition:slide={{ duration: 200, axis: 'y' }}>
						<Card.Root class="mb-4">
							<Card.Content class="py-4 text-sm">
								{m['reschedule.selected']()}
								<strong class="ml-1 capitalize">
									{m['common.date_at_time']({
										date: formatDate(selectedSlot.start.slice(0, 10)),
										time: formatTime(selectedSlot.start)
									})}
								</strong>
							</Card.Content>
						</Card.Root>
						<Button onclick={confirm} class="w-full" disabled={submitting}>
							{#if submitting}<Spinner class="mr-2" />{/if}
							{submitting ? m['reschedule.confirming']() : m['reschedule.confirm']()}
						</Button>
					</div>
				{/if}
			{/if}
		</div>
	{/if}
</div>
