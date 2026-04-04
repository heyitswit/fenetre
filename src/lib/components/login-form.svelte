<script lang="ts">
	import * as m from "$lib/paraglide/messages";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import {
		FieldGroup,
		Field,
		FieldLabel,
	} from "$lib/components/ui/field/index.js";
	import { authClient } from "$lib/auth-client";
	import { toast } from "svelte-sonner";

	const id = $props.id();
	let email = $state("");
	let loading = $state(false);

	async function signInWithMagicLink() {
		if (!email) {
			toast.error(m["login.error.email_required"]());
			return;
		}
		loading = true;
		await authClient.signIn.magicLink({
			email,
			callbackURL: "/dashboard"
		}, {
			onRequest: () => {
				toast.message(m["login.info.sending_magic_link"]());
			},
			onSuccess: () => {
				toast.success(m["login.success.magic_link_sent"]());
				loading = false;
			},
			onError: (ctx) => {
				toast.error(ctx.error.message);
				loading = false;
			}
		});
	}

	async function signInWithGoogle() {
		await authClient.signIn.social({
			provider: "google",
			callbackURL: "/dashboard"
		});
	}

	async function signInWithApple() {
		await authClient.signIn.social({
			provider: "apple",
			callbackURL: "/dashboard"
		});
	}

	const lastUsed = authClient.getLastUsedLoginMethod();
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">{m["login.title"]()}</Card.Title>
		<Card.Description>
			{m["login.description"]()}
			{#if lastUsed}
				<div class="mt-2 text-xs font-medium text-muted-foreground">
					{m["login.last_used"]({ method: lastUsed })}
				</div>
			{/if}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="grid gap-4">
			<div class="grid gap-2">
				<Button variant="outline" onclick={signInWithGoogle} class="w-full">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="mr-2 h-4 w-4">
						<path
							d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
							fill="currentColor"
						/>
					</svg>
					{m["login.google"]()}
				</Button>
				<Button variant="outline" onclick={signInWithApple} class="w-full">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="mr-2 h-4 w-4" fill="currentColor">
						<path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-.35-.16-1.07-.16-1.42 0-1.03.48-2.1.55-3.08-.4-1.96-1.93-2.61-5.32-1.03-8.08 1.08-1.91 2.95-2.3 4.16-2.3.69 0 1.25.1 1.72.29.47.19.89.19 1.36 0 .52-.22 1.1-.32 1.81-.32 1.6 0 2.99.78 3.84 2.01-3.21 1.93-2.55 6.36.96 7.78-.65 1.63-1.57 3.32-3.31 5.06l-.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
					</svg>
					{m["login.apple"]()}
				</Button>
			</div>
			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<span class="w-full border-t"></span>
				</div>
				<div class="relative flex justify-center text-xs uppercase">
					<span class="bg-background px-2 text-muted-foreground">{m["login.or_continue_with"]()}</span>
				</div>
			</div>
			<FieldGroup>
				<Field>
					<FieldLabel for="email-{id}">{m["login.email_label"]()}</FieldLabel>
					<Input id="email-{id}" type="email" placeholder={m["login.email_placeholder"]()} bind:value={email} required />
				</Field>
				<Button onclick={signInWithMagicLink} disabled={loading} class="w-full">
					{loading ? m["login.magic_link_loading"]() : m["login.magic_link_button"]()}
				</Button>
			</FieldGroup>
		</div>
	</Card.Content>
</Card.Root>