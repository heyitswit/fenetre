<script lang="ts">
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import * as m from '$lib/paraglide/messages';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { joinWaitlist } from '$lib/remote/waitlist.remote';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	const username = $derived(params.username);
	const eventSlug = $derived(page.url.searchParams.get('event') ?? '');

	let email = $state('');
	let name = $state('');
	let submitted = $state(false);
	let loading = $state(false);

	async function handleSubmit() {
		if (!email) return;
		loading = true;
		try {
			await joinWaitlist({ username, eventTypeSlug: eventSlug, email, name: name || undefined });
			submitted = true;
		} catch {
			toast.error(m['booking.error.generic']());
		} finally {
			loading = false;
		}
	}
</script>

<div class="mx-auto max-w-sm px-4 py-16">
	{#if submitted}
		<Card.Root>
			<Card.Header class="text-center">
				<Card.Title class="text-2xl">{m['waitlist.success.title']()}</Card.Title>
				<Card.Description>{m['waitlist.success.description']()}</Card.Description>
			</Card.Header>
			<Card.Footer>
				<Button href="/{username}" variant="outline" class="w-full">{m['waitlist.back']()}</Button>
			</Card.Footer>
		</Card.Root>
	{:else}
		<Card.Root>
			<Card.Header>
				<Card.Title>{m['waitlist.title']()}</Card.Title>
				<Card.Description>{m['waitlist.description']()}</Card.Description>
			</Card.Header>
			<Card.Content>
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleSubmit();
					}}
				>
					<FieldGroup>
						<Field>
							<FieldLabel for="email">{m['waitlist.email']()}</FieldLabel>
							<Input id="email" type="email" bind:value={email} required />
						</Field>
						<Field>
							<FieldLabel for="name">
								{m['waitlist.name']()}
								<span class="text-muted-foreground">({m['booking.optional']()})</span>
							</FieldLabel>
							<Input id="name" bind:value={name} />
						</Field>
						<Button type="submit" class="w-full" disabled={loading}>
							{#if loading}<Spinner class="mr-2" />{/if}
							{loading ? m['waitlist.submitting']() : m['waitlist.submit']()}
						</Button>
					</FieldGroup>
				</form>
			</Card.Content>
			<Card.Footer>
				<Button href="/{username}" variant="ghost" class="w-full">{m['waitlist.back']()}</Button>
			</Card.Footer>
		</Card.Root>
	{/if}
</div>
