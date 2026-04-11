<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { authClient } from '$lib/auth-client';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	const token = $derived(page.url.searchParams.get('token') ?? '');

	let password = $state('');
	let confirm = $state('');
	let loading = $state(false);

	async function submit() {
		if (!password || !confirm) return;
		if (password !== confirm) {
			toast.error(m['reset_password.mismatch']());
			return;
		}
		loading = true;
		await authClient.resetPassword(
			{ newPassword: password, token },
			{
				onSuccess: () => {
					toast.success(m['reset_password.success']());
					goto('/login');
				},
				onError: () => {
					toast.error(m['reset_password.error']());
					loading = false;
				}
			}
		);
	}
</script>

<div class="flex h-screen w-full items-center justify-center px-4">
	{#if !token}
		<p class="text-sm text-muted-foreground">{m['reset_password.error']()}</p>
	{:else}
		<Card.Root class="mx-auto w-full max-w-sm">
			<Card.Header>
				<img src="/image.png" alt="Fenêtre" class="mb-2 size-10 rounded-full" />
				<Card.Title class="text-2xl">{m['reset_password.title']()}</Card.Title>
				<Card.Description>{m['reset_password.description']()}</Card.Description>
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
							<FieldLabel for="rp-password">{m['reset_password.password_label']()}</FieldLabel>
							<Input
								id="rp-password"
								type="password"
								placeholder={m['login.password_placeholder']()}
								bind:value={password}
								minlength={8}
								required
							/>
						</Field>
						<Field>
							<FieldLabel for="rp-confirm">{m['reset_password.confirm_label']()}</FieldLabel>
							<Input
								id="rp-confirm"
								type="password"
								placeholder={m['login.password_placeholder']()}
								bind:value={confirm}
								minlength={8}
								required
							/>
						</Field>
						<Button type="submit" class="w-full" disabled={loading}>
							{#if loading}<Spinner class="mr-2" />{/if}
							{loading ? m['reset_password.submitting']() : m['reset_password.submit']()}
						</Button>
					</FieldGroup>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
