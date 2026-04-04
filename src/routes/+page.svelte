<script lang="ts">
	import * as m from "$lib/paraglide/messages";
	import { Button } from "$lib/components/ui/button/index.js";
	import { 
		Shield, 
		Database, 
		Languages, 
		ArrowRight, 
		Github, 
		CreditCard, 
		Mail, 
		Sparkles,
		Zap
	} from "@lucide/svelte";
</script>

<div class="flex min-h-screen flex-col bg-background font-sans">
	<!-- Navigation -->
	<header class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
		<div class="container mx-auto flex h-14 items-center justify-between px-4 sm:px-8">
			<div class="flex items-center gap-2 font-bold text-lg tracking-tight">
				<div class="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20">
					<Sparkles class="size-4 fill-current" />
				</div>
				<span class="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
					Zenith
				</span>
			</div>
			<nav class="flex items-center gap-2 sm:gap-4">
				<Button variant="ghost" href="/login" size="sm" class="hidden sm:inline-flex font-medium">Login</Button>
				<Button href="/login" size="sm" class="rounded-full px-4 shadow-sm shadow-primary/10">
					{m["homepage.get_started"]()}
				</Button>
			</nav>
		</div>
	</header>

	<main class="flex-1">
		<!-- Hero Section -->
		<section class="relative overflow-hidden pt-16 pb-16 md:pt-24 md:pb-24">
			<!-- Advanced Background -->
			<div class="absolute top-0 left-1/2 -z-10 h-[600px] w-full -translate-x-1/2 bg-[radial-gradient(circle_at_center,oklch(var(--primary)/0.08)_0%,transparent_70%)]"></div>
			<div class="absolute top-0 left-0 right-0 -z-10 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
			
			<div class="container mx-auto px-4 sm:px-8 flex flex-col items-center text-center gap-6">
				<div class="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary animate-in fade-in slide-in-from-bottom-4 duration-1000">
					<span class="flex items-center gap-2">
						<span class="size-1.5 rounded-full bg-primary animate-pulse"></span>
						{m["homepage.hero.badge"]()}
					</span>
				</div>
				
				<h1 class="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl text-foreground">
					{m["homepage.title"]()}
				</h1>
				
				<p class="max-w-2xl leading-relaxed text-muted-foreground text-base sm:text-lg font-normal opacity-90">
					{m["homepage.description"]()}
				</p>
				
				<div class="flex flex-wrap justify-center gap-3 mt-2">
					<Button size="lg" href="/login" class="h-11 px-6 rounded-xl text-base font-bold gap-2 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
						{m["homepage.get_started"]()} <ArrowRight class="size-4" />
					</Button>
					<Button size="lg" variant="outline" href="https://github.com/szerookii/boilerplate-auth-svelte" target="_blank" class="h-11 px-6 rounded-xl text-base font-bold gap-2 border-border/80 bg-background/50 backdrop-blur-sm hover:bg-accent transition-colors">
						<Github class="size-4" /> GitHub
					</Button>
				</div>

				<!-- Trust indicators -->
				<div class="flex flex-wrap justify-center gap-x-8 gap-y-4 mt-10 opacity-50 grayscale transition-all hover:grayscale-0">
					<div class="flex items-center gap-1.5 text-sm font-bold italic tracking-tighter">
						<CreditCard class="size-4" /> STRIPE
					</div>
					<div class="flex items-center gap-1.5 text-sm font-bold tracking-tight">
						<Shield class="size-4" /> BETTER-AUTH
					</div>
					<div class="flex items-center gap-1.5 text-sm font-mono font-bold">
						<Database class="size-4" /> DRIZZLE
					</div>
					<div class="flex items-center gap-1.5 text-sm font-semibold">
						<Mail class="size-4" /> RESEND
					</div>
				</div>
			</div>
		</section>

		<!-- Features Grid -->
		<section id="features" class="container mx-auto px-4 sm:px-8 py-16 md:py-20">
			<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
				<div class="space-y-2 text-left">
					<h2 class="text-3xl font-black tracking-tight sm:text-4xl max-w-xl">
						{m["homepage.features.title"]()}
					</h2>
					<p class="text-muted-foreground text-base max-w-lg font-normal italic">
						{m["homepage.features.subtitle"]()}
					</p>
				</div>
				<div class="hidden lg:block pb-1">
					<div class="flex -space-x-2">
						{#each Array(5) as _}
							<div class="size-8 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden shadow-sm">
								<img src="https://api.dicebear.com/7.x/avataaars/svg?seed={Math.random()}" alt="User avatar" />
							</div>
						{/each}
						<div class="size-8 rounded-full border-2 border-background bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shadow-sm">
							+2.4k
						</div>
					</div>
					<p class="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mt-2 text-center">Trusted by builders</p>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
				<!-- Payments -->
				<div class="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all hover:shadow-xl hover:border-primary/20">
					<div class="size-10 rounded-lg bg-muted flex items-center justify-center text-foreground mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
						<CreditCard class="size-5" />
					</div>
					<h3 class="text-lg font-black mb-2">{m["homepage.features.payments.title"]()}</h3>
					<p class="text-muted-foreground text-sm leading-relaxed font-normal">{m["homepage.features.payments.description"]()}</p>
				</div>

				<!-- Auth -->
				<div class="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all hover:shadow-xl hover:border-primary/20">
					<div class="size-10 rounded-lg bg-muted flex items-center justify-center text-foreground mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
						<Shield class="size-5" />
					</div>
					<h3 class="text-lg font-black mb-2">{m["homepage.features.auth.title"]()}</h3>
					<p class="text-muted-foreground text-sm leading-relaxed font-normal">{m["homepage.features.auth.description"]()}</p>
				</div>

				<!-- DB -->
				<div class="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all hover:shadow-xl hover:border-primary/20">
					<div class="size-10 rounded-lg bg-muted flex items-center justify-center text-foreground mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
						<Database class="size-5" />
					</div>
					<h3 class="text-lg font-black mb-2">{m["homepage.features.db.title"]()}</h3>
					<p class="text-muted-foreground text-sm leading-relaxed font-normal">{m["homepage.features.db.description"]()}</p>
				</div>

				<!-- i18n -->
				<div class="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all hover:shadow-xl hover:border-primary/20">
					<div class="size-10 rounded-lg bg-muted flex items-center justify-center text-foreground mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
						<Languages class="size-5" />
					</div>
					<h3 class="text-lg font-black mb-2">{m["homepage.features.i18n.title"]()}</h3>
					<p class="text-muted-foreground text-sm leading-relaxed font-normal">{m["homepage.features.i18n.description"]()}</p>
				</div>

				<!-- Forms -->
				<div class="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all hover:shadow-xl hover:border-primary/20">
					<div class="size-10 rounded-lg bg-muted flex items-center justify-center text-foreground mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
						<Zap class="size-5" />
					</div>
					<h3 class="text-lg font-black mb-2">{m["homepage.features.forms.title"]()}</h3>
					<p class="text-muted-foreground text-sm leading-relaxed font-normal">{m["homepage.features.forms.description"]()}</p>
				</div>

				<!-- Emails -->
				<div class="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all hover:shadow-xl hover:border-primary/20">
					<div class="size-10 rounded-lg bg-muted flex items-center justify-center text-foreground mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
						<Mail class="size-5" />
					</div>
					<h3 class="text-lg font-black mb-2">{m["homepage.features.emails.title"]()}</h3>
					<p class="text-muted-foreground text-sm leading-relaxed font-normal">{m["homepage.features.emails.description"]()}</p>
				</div>
			</div>
		</section>
	</main>

	<!-- Footer -->
	<footer class="border-t border-border/40 py-12 bg-background">
		<div class="container mx-auto px-4 sm:px-8 flex flex-col items-center text-center gap-6">
			<div class="flex items-center gap-2 font-black text-lg tracking-tighter">
				<Sparkles class="size-5 text-primary fill-current" />
				<span>Zenith</span>
			</div>
			<p class="text-muted-foreground text-sm font-normal max-w-sm italic opacity-80">
				Built for creators who demand excellence and speed.
			</p>
			<div class="flex flex-wrap justify-center gap-6 text-xs font-bold uppercase tracking-widest text-foreground/60">
				<a href="https://github.com" class="hover:text-primary transition-colors">GitHub</a>
				<a href="https://twitter.com" class="hover:text-primary transition-colors">Twitter</a>
				<a href="/login" class="hover:text-primary transition-colors">Login</a>
				<a href="#" class="hover:text-primary transition-colors">Status</a>
			</div>
			<p class="text-muted-foreground/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-4">
				© {new Date().getFullYear()} Zenith Stack. Ship different.
			</p>
		</div>
	</footer>
</div>

<style>
	:global(html) {
		scroll-behavior: smooth;
	}
</style>