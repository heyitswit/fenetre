<script lang="ts">
	import { page } from '$app/state';
	import { logout } from '$lib/auth-client';
	import * as m from '$lib/paraglide/messages';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		CalendarDays,
		Users,
		Settings,
		LayoutDashboard,
		Clock,
		LogOut,
		UserCog
	} from '@lucide/svelte';
	import LanguageSelector from '$lib/components/language-selector.svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';

	let { children, data } = $props();

	const isAdmin = $derived(data.user.role === 'admin' || data.user.role === 'superadmin');

	const nav = $derived([
		{ href: '/admin', label: m['admin.nav.dashboard'](), icon: LayoutDashboard },
		{ href: '/admin/bookings', label: m['admin.nav.bookings'](), icon: Users },
		{ href: '/admin/event-types', label: m['admin.nav.event_types'](), icon: CalendarDays },
		{ href: '/admin/availability', label: m['admin.nav.availability'](), icon: Clock },
		...(isAdmin ? [{ href: '/admin/users', label: m['admin.nav.users'](), icon: UserCog }] : []),
		{ href: '/admin/settings', label: m['admin.nav.settings'](), icon: Settings }
	]);

	const currentPath = $derived(page.url.pathname);
</script>

<div class="flex h-screen overflow-hidden">
	<aside class="flex w-56 flex-shrink-0 flex-col border-r bg-card px-3 py-4">
		<div class="mb-4 flex items-center gap-2 px-2">
			<img src="/image.png" alt="Fenêtre" class="size-7 rounded-full" />
			<span class="text-sm font-semibold text-muted-foreground">Admin</span>
		</div>

		<nav class="flex flex-1 flex-col gap-1">
			{#each nav as item}
				{@const active = currentPath === item.href}
				<Button
					href={item.href}
					variant={active ? 'secondary' : 'ghost'}
					class="justify-start gap-2"
				>
					<item.icon class="size-4" />
					{item.label}
				</Button>
			{/each}
		</nav>

		<div class="flex items-center gap-1 px-1">
			<LanguageSelector />
			<ThemeToggle class="h-8 w-8" />
		</div>

		<Separator class="my-3" />

		<div class="flex flex-col gap-1">
			<p class="truncate px-2 text-xs text-muted-foreground">{data.user.email}</p>
			<Button variant="ghost" class="justify-start gap-2" onclick={logout}>
				<LogOut class="size-4" />
				{m['admin.nav.logout']()}
			</Button>
		</div>
	</aside>

	<main class="flex-1 overflow-auto p-8">
		{@render children()}
	</main>
</div>
