<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import * as m from '$lib/paraglide/messages';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { authClient } from '$lib/auth-client';
	import { getHasUsers } from '$lib/remote/users.remote';

	const hasUsers = $derived(await getHasUsers());

	$effect(() => {
		if (hasUsers) goto('/login', { replaceState: true });
	});

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let loading = $state(false);

	async function submit() {
		if (!name || !email || !password) return;
		loading = true;
		await authClient.signUp.email(
			{ name, email, password, callbackURL: '/admin/settings' },
			{
				onError: () => {
					toast.error(m['setup.error']());
					loading = false;
				}
			}
		);
	}
</script>

<div class="flex min-h-screen items-center justify-center px-4">
	{#if !hasUsers}
		<Card.Root class="w-full max-w-sm">
			<Card.Header>
				<img src="/image.png" alt="Fenêtre" class="mb-2 size-10 rounded-full" />
				<Card.Title class="text-2xl">{m['setup.title']()}</Card.Title>
				<Card.Description>{m['setup.description']()}</Card.Description>
			</Card.Header>
			<Card.Content>
				<form
					onsubmit={(e) => {
						e.preventDefault();
						submit();
					}}
				>
					<FieldGroup>
						<Field>
							<FieldLabel for="s-name">{m['setup.name']()}</FieldLabel>
							<Input
								id="s-name"
								bind:value={name}
								placeholder={m['setup.name.placeholder']()}
								required
							/>
						</Field>
						<Field>
							<FieldLabel for="s-email">{m['login.email_label']()}</FieldLabel>
							<Input
								id="s-email"
								type="email"
								bind:value={email}
								placeholder={m['login.email_placeholder']()}
								required
							/>
						</Field>
						<Field>
							<FieldLabel for="s-password">{m['login.password_label']()}</FieldLabel>
							<Input
								id="s-password"
								type="password"
								bind:value={password}
								placeholder={m['login.password_placeholder']()}
								minlength={8}
								required
							/>
						</Field>
						<Button type="submit" class="w-full" disabled={loading}>
							{#if loading}<Spinner class="mr-2" />{/if}
							{loading ? m['setup.submitting']() : m['setup.submit']()}
						</Button>
					</FieldGroup>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
