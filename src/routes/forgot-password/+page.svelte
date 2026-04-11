<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { authClient } from '$lib/auth-client';
	import { ArrowLeft } from '@lucide/svelte';

	let email = $state('');
	let loading = $state(false);
	let sent = $state(false);

	async function submit() {
		if (!email) return;
		loading = true;
		await authClient.requestPasswordReset(
			{ email, redirectTo: '/reset-password' },
			{
				onSuccess: () => {
					sent = true;
				},
				onError: () => {
					sent = true;
				}
			}
		);
		loading = false;
	}
</script>

<div class="flex h-screen w-full items-center justify-center px-4">
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<img src="/image.png" alt="Fenêtre" class="mb-2 size-10 rounded-full" />
			<Card.Title class="text-2xl">{m['forgot_password.title']()}</Card.Title>
			<Card.Description>{m['forgot_password.description']()}</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if sent}
				<p class="text-sm text-muted-foreground">{m['forgot_password.success']()}</p>
			{:else}
				<form
					onsubmit={(e) => {
						e.preventDefault();
						submit();
					}}
				>
					<FieldGroup>
						<Field>
							<FieldLabel for="fp-email">{m['login.email_label']()}</FieldLabel>
							<Input
								id="fp-email"
								type="email"
								placeholder={m['login.email_placeholder']()}
								bind:value={email}
								required
							/>
						</Field>
						<Button type="submit" class="w-full" disabled={loading}>
							{#if loading}<Spinner class="mr-2" />{/if}
							{loading ? m['forgot_password.submitting']() : m['forgot_password.submit']()}
						</Button>
					</FieldGroup>
				</form>
			{/if}
		</Card.Content>
		<Card.Footer>
			<a
				href="/login"
				class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft class="size-4" />
				{m['forgot_password.back']()}
			</a>
		</Card.Footer>
	</Card.Root>
</div>
