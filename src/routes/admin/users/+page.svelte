<script lang="ts">
	import { toast } from 'svelte-sonner';
	import * as m from '$lib/paraglide/messages';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field/index.js';
	import { slide } from 'svelte/transition';
	import {
		getAllUsers,
		createUser,
		deleteUser,
		banUser,
		unbanUser,
		setRole,
		revokeUserSessions
	} from '$lib/remote/users.remote';

	const { data } = $props();
	const isSuperAdmin = $derived(data.user.role === 'superadmin');

	const usersQuery = getAllUsers();
	const users = $derived(await usersQuery);

	let creating = $state(false);
	let submitting = $state(false);
	let formName = $state('');
	let formEmail = $state('');
	let formPassword = $state('');

	function canActOn(targetRole: string | null) {
		if (targetRole === 'superadmin') return isSuperAdmin;
		if (targetRole === 'admin') return isSuperAdmin;
		return true;
	}

	function patchUser(userId: string, patch: Record<string, unknown>) {
		const current = usersQuery.current;
		if (!current) return;
		usersQuery.set(current.map((u) => (u.id === userId ? { ...u, ...patch } : u)));
	}

	async function submitCreate() {
		submitting = true;
		try {
			await createUser({ name: formName, email: formEmail, password: formPassword });
			toast.success(m['admin.users.created']());
			creating = false;
			formName = '';
			formEmail = '';
			formPassword = '';
			await usersQuery.refresh();
		} catch {
			toast.error(m['admin.users.error']());
		} finally {
			submitting = false;
		}
	}

	async function handleDelete(userId: string) {
		try {
			await deleteUser({ userId });
			const current = usersQuery.current;
			if (current) usersQuery.set(current.filter((u) => u.id !== userId));
			toast.success(m['admin.users.deleted']());
		} catch {
			toast.error(m['admin.users.delete_error']());
		}
	}

	async function handleBan(userId: string) {
		try {
			await banUser({ userId });
			patchUser(userId, { banned: true });
			toast.success(m['admin.users.banned']());
		} catch {
			toast.error(m['admin.users.ban_error']());
		}
	}

	async function handleUnban(userId: string) {
		try {
			await unbanUser({ userId });
			patchUser(userId, { banned: false });
			toast.success(m['admin.users.unbanned']());
		} catch {
			toast.error(m['admin.users.unban_error']());
		}
	}

	async function handleSetRole(userId: string, role: 'user' | 'admin' | 'superadmin') {
		try {
			await setRole({ userId, role });
			patchUser(userId, { role });
			toast.success(m['admin.users.role_updated']());
		} catch {
			toast.error(m['admin.users.role_error']());
		}
	}

	async function handleRevokeSessions(userId: string) {
		try {
			await revokeUserSessions({ userId });
			toast.success(m['admin.users.sessions_revoked']());
		} catch {
			toast.error(m['admin.users.sessions_error']());
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-bold">{m['admin.users.title']()}</h1>
		<Button onclick={() => (creating = !creating)}>{m['admin.users.invite']()}</Button>
	</div>

	<Card.Root>
		<Card.Content class="flex items-start gap-2 py-4 text-sm text-muted-foreground">
			<Badge variant={true ? 'secondary' : 'default'} class="mt-0.5 shrink-0">
				{m['admin.users.registration_open']()}
			</Badge>
			<p>{m['admin.users.registration_open.description']()}</p>
		</Card.Content>
	</Card.Root>

	{#if creating}
		<div transition:slide={{ duration: 200, axis: 'y' }}>
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-base">{m['admin.users.invite']()}</Card.Title>
				</Card.Header>
				<Card.Content>
					<form
						onsubmit={(e) => {
							e.preventDefault();
							submitCreate();
						}}
					>
						<FieldGroup>
							<Field>
								<FieldLabel for="u-name">{m['admin.users.form.name']()}</FieldLabel>
								<Input id="u-name" bind:value={formName} required />
							</Field>
							<Field>
								<FieldLabel for="u-email">{m['admin.users.form.email']()}</FieldLabel>
								<Input id="u-email" type="email" bind:value={formEmail} required />
							</Field>
							<Field>
								<FieldLabel for="u-password">{m['admin.users.form.password']()}</FieldLabel>
								<Input
									id="u-password"
									type="password"
									bind:value={formPassword}
									minlength={8}
									required
								/>
							</Field>
							<div class="flex justify-end gap-2">
								<Button type="button" variant="ghost" onclick={() => (creating = false)}>
									{m['admin.users.form.cancel']()}
								</Button>
								<Button type="submit" disabled={submitting}>
									{#if submitting}<Spinner class="mr-2" />{/if}
									{m['admin.users.form.save']()}
								</Button>
							</div>
						</FieldGroup>
					</form>
				</Card.Content>
			</Card.Root>

			<Separator />
		</div>
	{/if}

	{#if users.length === 0}
		<p class="text-sm text-muted-foreground">{m['admin.users.empty']()}</p>
	{:else}
		<div class="flex flex-col gap-3">
			{#each users as u (u.id)}
				<div transition:slide={{ duration: 200, axis: 'y' }}>
					<Card.Root>
						<Card.Content class="flex items-center justify-between gap-4 py-4">
							<div class="flex flex-col gap-1">
								<div class="flex items-center gap-2">
									<p class="font-medium">{u.name}</p>
									<Badge variant="outline" class="text-xs capitalize">{u.role ?? 'user'}</Badge>
									{#if u.banned}
										<Badge variant="destructive" class="text-xs">Banned</Badge>
									{/if}
								</div>
								<p class="text-sm text-muted-foreground">{u.email}</p>
							</div>

							{#if canActOn(u.role)}
								<div class="flex items-center gap-2">
									{#if u.banned}
										<Button variant="outline" size="sm" onclick={() => handleUnban(u.id)}>
											Unban
										</Button>
									{:else}
										<Button
											variant="ghost"
											size="sm"
											class="text-yellow-600 hover:text-yellow-600"
											onclick={() => handleBan(u.id)}
										>
											Ban
										</Button>
									{/if}

									<Button variant="ghost" size="sm" onclick={() => handleRevokeSessions(u.id)}>
										Revoke sessions
									</Button>

									{#if isSuperAdmin}
										{#if u.role !== 'admin' && u.role !== 'superadmin'}
											<Button
												variant="ghost"
												size="sm"
												onclick={() => handleSetRole(u.id, 'admin')}
											>
												Make admin
											</Button>
										{:else if u.role === 'admin'}
											<Button variant="ghost" size="sm" onclick={() => handleSetRole(u.id, 'user')}>
												Remove admin
											</Button>
										{/if}
									{/if}

									<Button
										variant="ghost"
										size="sm"
										class="text-destructive hover:text-destructive"
										onclick={() => handleDelete(u.id)}
									>
										{m['admin.users.delete']()}
									</Button>
								</div>
							{/if}
						</Card.Content>
					</Card.Root>
				</div>
			{/each}
		</div>
	{/if}
</div>
