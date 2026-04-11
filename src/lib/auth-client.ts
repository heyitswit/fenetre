import { createAuthClient } from 'better-auth/svelte';
import { adminClient, lastLoginMethodClient } from 'better-auth/client/plugins';
import { goto } from '$app/navigation';

export const authClient = createAuthClient({
	plugins: [adminClient(), lastLoginMethodClient()]
});

export async function logout() {
	await authClient.signOut({ fetchOptions: { onSuccess: () => goto('/login') } });
}
