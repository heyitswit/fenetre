<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { authClient } from '$lib/auth-client';
	import { toast } from 'svelte-sonner';
	import { getRegistrationOpen } from '$lib/remote/users.remote';

	const id = $props.id();
	const registrationOpen = $derived(await getRegistrationOpen());
	let email = $state('');
	let password = $state('');
	let loading = $state(false);

	const lastUsed = authClient.getLastUsedLoginMethod();

	async function signIn() {
		if (!email || !password) return;
		loading = true;
		await authClient.signIn.email(
			{ email, password, callbackURL: '/admin' },
			{
				onError: () => {
					toast.error(m['login.error.invalid']());
					loading = false;
				}
			}
		);
	}
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header>
		<img src="/image.png" alt="Fenêtre" class="mb-2 size-10 rounded-full" />
		<Card.Title class="text-2xl">{m['login.title']()}</Card.Title>
		<Card.Description>
			{m['login.description']()}
			{#if lastUsed}
				<div class="mt-2 text-xs font-medium text-muted-foreground">
					{m['login.last_used']({ method: lastUsed })}
				</div>
			{/if}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				signIn();
			}}
		>
			<FieldGroup>
				<Field>
					<FieldLabel for="email-{id}">{m['login.email_label']()}</FieldLabel>
					<Input
						id="email-{id}"
						type="email"
						placeholder={m['login.email_placeholder']()}
						bind:value={email}
						required
					/>
				</Field>
				<Field>
					<FieldLabel for="password-{id}">{m['login.password_label']()}</FieldLabel>
					<Input
						id="password-{id}"
						type="password"
						placeholder={m['login.password_placeholder']()}
						bind:value={password}
						required
					/>
				</Field>
				<Button type="submit" class="w-full" disabled={loading}>
					{#if loading}<Spinner class="mr-2" />{/if}
					{loading ? m['login.submitting']() : m['login.submit']()}
				</Button>
				<a
					href="/forgot-password"
					class="block text-center text-sm text-muted-foreground hover:text-foreground"
				>
					{m['login.forgot_password']()}
				</a>
			</FieldGroup>
		</form>
	</Card.Content>
	{#if registrationOpen}
		<Card.Footer>
			<p class="w-full text-center text-sm text-muted-foreground">
				{m['login.register_link']()}
				<a href="/register" class="text-primary hover:underline">{m['register.title']()}</a>
			</p>
		</Card.Footer>
	{/if}
</Card.Root>
