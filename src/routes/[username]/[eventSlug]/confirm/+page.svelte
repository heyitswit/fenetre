<script lang="ts">
	import { page } from '$app/state';
	import ical from 'ical-generator';
	import * as m from '$lib/paraglide/messages';
	import { CheckCircle, Calendar, Clock, ExternalLink } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { formatDate, formatTime } from '$lib/utils';
	import { getBookingConfirmation } from '$lib/remote/bookings.remote';
	import { getPublicPortfolioLinks } from '$lib/remote/settings.remote';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	const username = $derived(params.username);
	const bookingId = $derived(page.url.searchParams.get('id') ?? '');
	const embed = $derived(page.url.searchParams.get('embed') === '1');

	$effect(() => {
		if (embed) window.parent.postMessage({ type: 'fenetre:confirm' }, '*');
	});
	const booking = $derived(bookingId ? await getBookingConfirmation({ id: bookingId }) : null);
	const allLinks = $derived(await getPublicPortfolioLinks({ username }));

	const portfolioLinks = $derived(
		allLinks?.filter((l) => l.missionType === 'all' || l.missionType === booking?.missionType) ?? []
	);

	function downloadIcs() {
		if (!booking) return;
		const cal = ical({ name: 'fenetre' });
		const event = cal.createEvent({
			id: `${booking.id}@fenetre`,
			start: new Date(booking.startTime),
			end: new Date(booking.endTime),
			summary: booking.eventType.name
		});
		if (booking.meetLink) {
			event.url(booking.meetLink);
			event.location(booking.meetLink);
		}
		const blob = new Blob([cal.toString()], { type: 'text/calendar' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'rendez-vous.ics';
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="mx-auto max-w-lg px-4 py-16 text-center">
	{#if !booking}
		<p class="text-muted-foreground">{m['confirm.not_found']()}</p>
		<Button href="/{username}{embed ? '?embed=1' : ''}" variant="ghost" class="mt-4"
			>{m['booking.back']()}</Button
		>
	{:else}
		<div class="flex flex-col items-center gap-6">
			<CheckCircle class="size-16 text-green-500" />

			<div>
				<h1 class="text-3xl font-bold">{m['confirm.title']()}</h1>
				<p class="mt-2 text-muted-foreground">{m['confirm.subtitle']()}</p>
			</div>

			<Card.Root class="w-full text-left">
				<Card.Header>
					<Card.Title>{booking.eventType.name}</Card.Title>
				</Card.Header>
				<Card.Content class="flex flex-col gap-2 text-sm text-muted-foreground">
					<div class="flex items-center gap-2">
						<Calendar class="size-4" />
						<span class="capitalize">{formatDate(booking.startTime)}</span>
					</div>
					<div class="flex items-center gap-2">
						<Clock class="size-4" />
						<span
							>{formatTime(booking.startTime)} — {formatTime(booking.endTime)} ({booking.eventType
								.duration} min)</span
						>
					</div>
				</Card.Content>
			</Card.Root>

			<Button variant="outline" class="w-full" onclick={downloadIcs}>
				<Calendar class="mr-2 size-4" />
				{m['confirm.add_to_calendar']()}
			</Button>

			{#if portfolioLinks.length > 0}
				<Card.Root class="w-full text-left">
					<Card.Header>
						<Card.Title class="text-base">{m['confirm.portfolio.title']()}</Card.Title>
					</Card.Header>
					<Card.Content class="flex flex-col gap-2">
						{#each portfolioLinks as link}
							<a
								href={link.url}
								target="_blank"
								rel="noopener noreferrer"
								class="flex items-center justify-between rounded-lg border px-4 py-3 text-sm hover:bg-accent"
							>
								<span class="font-medium">{link.title}</span>
								<ExternalLink class="size-4 text-muted-foreground" />
							</a>
						{/each}
					</Card.Content>
				</Card.Root>
			{/if}

			<Button href="/{username}{embed ? '?embed=1' : ''}" variant="outline" class="w-full"
				>{m['confirm.other_types']()}</Button
			>
		</div>
	{/if}
</div>
