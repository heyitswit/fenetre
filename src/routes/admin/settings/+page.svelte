<script lang="ts">
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import * as m from '$lib/paraglide/messages';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { getAllEventTypes, setBusyModeAll } from '$lib/remote/eventTypes.remote';
	import { slide } from 'svelte/transition';
	import { getSettings, updateSettings } from '$lib/remote/settings.remote';
	import type { PortfolioLink } from '$lib/server/db/schema';

	const eventTypes = $derived(await getAllEventTypes());
	const busyMode = $derived(eventTypes.some((et) => et.isBusyMode));
	const settings = $derived(await getSettings());

	// Toast on OAuth redirect feedback
	$effect(() => {
		const connected = page.url.searchParams.get('connected');
		const error = page.url.searchParams.get('error');
		if (connected) toast.success(m['admin.settings.google.connected']());
		if (error === 'no_refresh_token')
			toast.error(m['admin.settings.google.error_no_refresh_token']());
		if (error === 'oauth_invalid_state')
			toast.error(m['admin.settings.google.error_oauth_state']());
		if (error === 'google_not_configured')
			toast.error(m['admin.settings.google.error_not_configured']());
	});

	let username = $state('');
	let notificationEmail = $state('');
	let bufferMinutes = $state(15);
	let portfolioLinks = $state<PortfolioLink[]>([]);

	$effect(() => {
		username = settings.username ?? '';
		notificationEmail = settings.notificationEmail ?? '';
		bufferMinutes = settings.bufferMinutes;
		portfolioLinks = settings.portfolioLinks ?? [];
	});

	let toggling = $state(false);
	let saving = $state(false);

	const MISSION_OPTIONS = $derived([
		{ value: 'all', label: m['admin.settings.portfolio.mission.all']() },
		{ value: 'courte', label: m['admin.settings.portfolio.mission.courte']() },
		{ value: 'longue', label: m['admin.settings.portfolio.mission.longue']() },
		{ value: 'conseil', label: m['admin.settings.portfolio.mission.conseil']() }
	]);

	async function toggleBusyMode(value: boolean) {
		toggling = true;
		try {
			await setBusyModeAll({ isBusyMode: value });
			toast.success(
				value ? m['admin.settings.busy_mode.on']() : m['admin.settings.busy_mode.off']()
			);
		} catch {
			toast.error(m['admin.settings.busy_mode.error']());
		} finally {
			toggling = false;
		}
	}

	async function save() {
		saving = true;
		try {
			await updateSettings({
				username: username || undefined,
				notificationEmail: notificationEmail || null,
				bufferMinutes,
				portfolioLinks
			});
			toast.success(m['admin.settings.saved']());
		} catch {
			toast.error(m['admin.settings.error']());
		} finally {
			saving = false;
		}
	}

	function addLink() {
		portfolioLinks = [...portfolioLinks, { missionType: 'all', title: '', url: '' }];
	}

	function removeLink(i: number) {
		portfolioLinks = portfolioLinks.filter((_, idx) => idx !== i);
	}
</script>

<div class="flex flex-col gap-6">
	<h1 class="text-xl font-bold">{m['admin.settings.title']()}</h1>

	<!-- URL publique -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">{m['admin.settings.username.title']()}</Card.Title>
			<Card.Description>{m['admin.settings.username.description']()}</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex items-center gap-2">
				<span class="text-sm text-muted-foreground">/</span>
				<Input
					bind:value={username}
					placeholder={m['admin.settings.username.placeholder']()}
					class="max-w-xs"
				/>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Busy mode -->
	<Card.Root>
		<Card.Content class="flex items-center justify-between gap-4 py-6">
			<div>
				<Label class="text-base font-medium">{m['admin.settings.busy_mode.title']()}</Label>
				<p class="mt-1 text-sm text-muted-foreground">
					{m['admin.settings.busy_mode.description']()}
				</p>
			</div>
			<Switch checked={busyMode} disabled={toggling} onCheckedChange={toggleBusyMode} />
		</Card.Content>
	</Card.Root>

	<!-- Google Calendar -->
	<Card.Root>
		<Card.Header>
			<div class="flex items-center justify-between">
				<div>
					<Card.Title class="text-base">{m['admin.settings.google.title']()}</Card.Title>
					<Card.Description>{m['admin.settings.google.description']()}</Card.Description>
				</div>
				{#if settings.googleRefreshToken}
					<Badge variant="default">{m['admin.settings.google.connected']()}</Badge>
				{:else}
					<Badge variant="secondary">{m['admin.settings.google.not_connected']()}</Badge>
				{/if}
			</div>
		</Card.Header>
		<Card.Content>
			<Button
				href="/api/google/connect"
				variant={settings.googleRefreshToken ? 'outline' : 'default'}
			>
				{settings.googleRefreshToken
					? m['admin.settings.google.reconnect']()
					: m['admin.settings.google.connect']()}
			</Button>
		</Card.Content>
	</Card.Root>

	<!-- Notification email + buffer -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">{m['admin.settings.notification_email.title']()}</Card.Title>
			<Card.Description>{m['admin.settings.notification_email.description']()}</Card.Description>
		</Card.Header>
		<Card.Content>
			<FieldGroup>
				<Field>
					<Input
						type="email"
						bind:value={notificationEmail}
						placeholder={m['admin.settings.notification_email.placeholder']()}
					/>
				</Field>
				<Field>
					<FieldLabel>{m['admin.settings.buffer.title']()}</FieldLabel>
					<p class="mb-2 text-sm text-muted-foreground">
						{m['admin.settings.buffer.description']()}
					</p>
					<Input type="number" bind:value={bufferMinutes} min={0} max={120} class="w-32" />
				</Field>
			</FieldGroup>
		</Card.Content>
	</Card.Root>

	<!-- Portfolio links -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">{m['admin.settings.portfolio.title']()}</Card.Title>
			<Card.Description>{m['admin.settings.portfolio.description']()}</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			{#if portfolioLinks.length === 0}
				<p class="text-sm text-muted-foreground">{m['admin.settings.portfolio.empty']()}</p>
			{:else}
				{#each portfolioLinks as link, i}
					<div
						class="grid grid-cols-[180px_1fr_1fr_auto] items-end gap-3"
						transition:slide={{ duration: 150, axis: 'y' }}
					>
						<Field>
							{#if i === 0}
								<FieldLabel>{m['admin.settings.portfolio.mission_type']()}</FieldLabel>
							{/if}
							<Select.Root
								type="single"
								value={link.missionType}
								onValueChange={(v: string) => {
									portfolioLinks[i].missionType = v;
								}}
							>
								<Select.Trigger>
									{MISSION_OPTIONS.find((o) => o.value === link.missionType)?.label ??
										link.missionType}
								</Select.Trigger>
								<Select.Content>
									{#each MISSION_OPTIONS as opt}
										<Select.Item value={opt.value}>{opt.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</Field>
						<Field>
							{#if i === 0}<FieldLabel>{m['admin.settings.portfolio.link_title']()}</FieldLabel
								>{/if}
							<Input
								bind:value={portfolioLinks[i].title}
								placeholder={m['admin.settings.portfolio.link_title']()}
							/>
						</Field>
						<Field>
							{#if i === 0}<FieldLabel>{m['admin.settings.portfolio.link_url']()}</FieldLabel>{/if}
							<Input bind:value={portfolioLinks[i].url} type="url" placeholder="https://" />
						</Field>
						<Button
							variant="ghost"
							size="sm"
							onclick={() => removeLink(i)}
							class="text-destructive hover:text-destructive"
						>
							{m['admin.settings.portfolio.remove']()}
						</Button>
					</div>
				{/each}
			{/if}
			<Button variant="outline" size="sm" onclick={addLink} class="w-fit">
				{m['admin.settings.portfolio.add']()}
			</Button>
		</Card.Content>
	</Card.Root>

	<Button onclick={save} disabled={saving} class="w-fit">
		{#if saving}<Spinner class="mr-2" />{/if}
		{m['admin.settings.save']()}
	</Button>
</div>
