<script lang="ts">
	import { authClient } from "$lib/auth-client";
	import { goto } from "$app/navigation";
	import { Button } from "$lib/components/ui/button/index.js";

	let { data } = $props();
	const user = data.user;

	async function logout() {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					goto("/login");
				}
			}
		});
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4">
	<div class="mx-auto w-full max-w-md text-center">
		<h1 class="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
			Bienvenue sur le dashboard !
		</h1>
		<p class="mt-4 text-lg text-muted-foreground">
			Ravi de vous revoir, <span class="font-semibold text-primary">{user?.name || user?.email}</span>.
		</p>
		<div class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
			<a
				href="/"
				class="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
			>
				Retour à l'accueil
			</a>
			<Button variant="outline" onclick={logout}>
				Se déconnecter
			</Button>
		</div>
	</div>
</div>
