<script lang="ts">
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { CalendarDays, Clock, TrendingUp } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages';
	import { formatDate, formatTime } from '$lib/utils';
	import { getDashboardStats, getUpcomingBookings } from '$lib/remote/bookings.remote';
	import { getAllEventTypes, setBusyModeAll } from '$lib/remote/eventTypes.remote';

	const upcomingBookings = $derived(await getUpcomingBookings());
	const allEventTypes = $derived(await getAllEventTypes());
	const stats = $derived(await getDashboardStats());

	const busyMode = $derived(allEventTypes.some((et) => et.isBusyMode));

	const todayStr = new Date().toISOString().slice(0, 10);

	let togglingBusy = $state(false);

	async function toggleBusyMode(value: boolean) {
		togglingBusy = true;
		try {
			await setBusyModeAll({ isBusyMode: value });
			toast.success(
				value ? m['admin.dashboard.busy_mode.on']() : m['admin.dashboard.busy_mode.off']()
			);
		} catch {
			toast.error(m['admin.dashboard.busy_mode.error']());
		} finally {
			togglingBusy = false;
		}
	}
</script>

<div class="flex flex-col gap-8">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">{m['admin.dashboard.title']()}</h1>
		<div class="flex items-center gap-3">
			<Label for="busy-mode" class="text-sm">{m['admin.dashboard.busy_mode']()}</Label>
			<Switch
				id="busy-mode"
				checked={busyMode}
				disabled={togglingBusy}
				onCheckedChange={toggleBusyMode}
			/>
		</div>
	</div>

	<div class="grid grid-cols-3 gap-4">
		<Card.Root>
			<Card.Content class="flex items-center gap-4 py-6">
				<CalendarDays class="size-8 text-muted-foreground" />
				<div>
					<p class="text-2xl font-bold">{upcomingBookings.length}</p>
					<p class="text-sm text-muted-foreground">{m['admin.dashboard.upcoming']()}</p>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="flex items-center gap-4 py-6">
				<Clock class="size-8 text-muted-foreground" />
				<div>
					<p class="text-2xl font-bold">{stats.todayCount}</p>
					<p class="text-sm text-muted-foreground">{m['admin.dashboard.today']()}</p>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="flex items-center gap-4 py-6">
				<TrendingUp class="size-8 text-muted-foreground" />
				<div>
					<p class="text-2xl font-bold">{stats.thisMonthCount}</p>
					<p class="text-sm text-muted-foreground">{m['admin.dashboard.this_month']()}</p>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<div>
		<h2 class="mb-4 text-lg font-semibold">{m['admin.dashboard.next_bookings']()}</h2>
		{#if upcomingBookings.length === 0}
			<p class="text-sm text-muted-foreground">{m['admin.dashboard.no_bookings']()}</p>
		{:else}
			<div class="flex flex-col gap-3">
				{#each upcomingBookings.slice(0, 5) as booking}
					{@const isToday = new Date(booking.startTime).toISOString().slice(0, 10) === todayStr}
					<Card.Root class={isToday ? 'border-primary' : ''}>
						<Card.Content class="flex items-center justify-between gap-4 py-4">
							<div>
								<div class="flex items-center gap-2">
									<p class="font-medium">{booking.clientName}</p>
									{#if isToday}
										<Badge variant="default">{m['admin.dashboard.today_badge']()}</Badge>
									{/if}
								</div>
								<p class="text-sm text-muted-foreground">
									{booking.eventType.name} · {m['common.date_at_time']({
										date: formatDate(booking.startTime.toISOString()),
										time: formatTime(booking.startTime.toISOString())
									})}
								</p>
							</div>
							<Button href="/admin/bookings?id={booking.id}" variant="ghost" size="sm">
								{m['admin.dashboard.view']()}
							</Button>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		{/if}
	</div>
</div>
