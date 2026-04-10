<script lang="ts">
	import LanguageSelector from '$lib/components/language-selector.svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { BlurFade } from '$lib/components/magic/blur-fade';
	import { TypingAnimation } from '$lib/components/magic/typing-animation';
	import { MorphingText } from '$lib/components/magic/morphing-text';
	import * as m from '$lib/paraglide/messages';
	import { getAllUsernames } from '$lib/remote/users.remote';
	import {
		ArrowRight,
		Calendar,
		Check,
		FileText,
		Github,
		Mail,
		Mouse,
		TrendingUp,
		Users,
		Zap
	} from '@lucide/svelte';

	let { data } = $props();

	const users = $derived(await getAllUsernames());

	const sources = ['Malt', 'LinkedIn', 'Portfolio', 'clients'];

	const features = $derived([
		{
			icon: Calendar,
			title: m['landing.features.calendar.title'](),
			desc: m['landing.features.calendar.desc']()
		},
		{
			icon: FileText,
			title: m['landing.features.brief.title'](),
			desc: m['landing.features.brief.desc']()
		},
		{
			icon: Zap,
			title: m['landing.features.busy.title'](),
			desc: m['landing.features.busy.desc']()
		},
		{
			icon: Mail,
			title: m['landing.features.email.title'](),
			desc: m['landing.features.email.desc']()
		},
		{
			icon: TrendingUp,
			title: m['landing.features.insights.title'](),
			desc: m['landing.features.insights.desc']()
		},
		{
			icon: Users,
			title: m['landing.features.multi.title'](),
			desc: m['landing.features.multi.desc']()
		}
	]);

	const steps = $derived([
		{ n: '01', title: m['landing.flow.step1.title'](), desc: m['landing.flow.step1.desc']() },
		{ n: '02', title: m['landing.flow.step2.title'](), desc: m['landing.flow.step2.desc']() },
		{ n: '03', title: m['landing.flow.step3.title'](), desc: m['landing.flow.step3.desc']() }
	]);
</script>

<header
	class="fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-b border-border/60 bg-background/80 px-6 py-3 backdrop-blur-sm"
>
	<a href="/" class="flex items-center gap-2">
		<img src="/image.png" alt="Fenêtre" class="size-6 rounded-full" />
		<span class="text-sm font-semibold tracking-tight">Fenêtre</span>
	</a>
	<div class="flex items-center gap-1.5">
		<LanguageSelector />
		<ThemeToggle size="icon-sm" />
		<Button
			href="https://github.com/your-username/fenetre"
			variant="ghost"
			size="sm"
			target="_blank"
			rel="noopener noreferrer"
		>
			<Github />
			<span class="hidden sm:inline">GitHub</span>
		</Button>
		<Button href={data.user ? '/admin' : '/login'} variant="outline" size="sm">
			{data.user ? data.user.name : m['home.landing.login']()}
		</Button>
	</div>
</header>

<section
	class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-16 pb-24 text-center"
>
	<div class="orb orb-1" aria-hidden="true"></div>
	<div class="orb orb-2" aria-hidden="true"></div>

	<span
		class="badge mb-6 inline-flex animate-in items-center rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground delay-[50ms] fill-mode-forwards fade-in slide-in-from-bottom-4"
	>
		{m['landing.badge']()}
	</span>

	<h1
		class="mb-1 max-w-2xl animate-in text-4xl leading-tight delay-200 fill-mode-forwards fade-in slide-in-from-bottom-4 sm:text-5xl lg:text-6xl"
	>
		{m['landing.hero.headline']()}
	</h1>
	<MorphingText
		texts={sources}
		class="mb-5 h-12 max-w-2xl text-4xl font-serif font-semibold tracking-[-0.02em] text-primary sm:h-14 sm:text-5xl lg:h-16 lg:text-6xl"
	/>

	<p
		class="mb-10 max-w-sm animate-in text-lg leading-relaxed text-muted-foreground delay-[350ms] fill-mode-forwards fade-in slide-in-from-bottom-4"
	>
		{m['landing.hero.description']()}
	</p>

	<div
		class="flex animate-in flex-wrap items-center justify-center gap-3 delay-500 fill-mode-forwards fade-in slide-in-from-bottom-4"
	>
		{#if users.length === 0}
			<Button href="/setup" size="lg">
				{m['home.landing.setup']()}
				<ArrowRight />
			</Button>
		{:else if users.length === 1}
			<Button href="/{users[0].username}" size="lg">
				{m['landing.cta.book_with']({ name: users[0].name })}
				<ArrowRight />
			</Button>
		{:else}
			<Button href="/directory" size="lg">
				{m['landing.cta.see_freelancers']()}
				<ArrowRight />
			</Button>
		{/if}
		<Button href={data.user ? '/admin' : '/login'} variant="outline" size="lg">
			{data.user ? data.user.name : m['home.landing.login']()}
		</Button>
	</div>

	<div
		class="absolute bottom-10 left-1/2 -translate-x-1/2 animate-in delay-[1100ms] fill-mode-forwards fade-in slide-in-from-bottom-4"
		aria-hidden="true"
	>
		<Mouse size={20} class="animate-pulse text-muted-foreground/50" />
	</div>
</section>

<section class="px-6 py-24">
	<div class="mx-auto max-w-5xl">
		<BlurFade direction="up" class="mb-14 text-center">
			<h2 class="mb-3 text-3xl sm:text-4xl">{m['landing.features.title']()}</h2>
			<p class="text-muted-foreground">{m['landing.features.subtitle']()}</p>
		</BlurFade>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each features as feat, i}
				<BlurFade
					direction="up"
					delay={i * 0.07}
					class="feature-card rounded-xl border border-border bg-card p-5"
				>
					<div
						class="mb-3 inline-flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground"
					>
						<feat.icon size={18} />
					</div>
					<h4 class="mb-1 text-sm font-semibold">{feat.title}</h4>
					<p class="text-sm leading-relaxed text-muted-foreground">{feat.desc}</p>
				</BlurFade>
			{/each}
		</div>
	</div>
</section>

<section class="px-6 py-24">
	<div class="mx-auto max-w-5xl">
		<BlurFade direction="up" class="mb-14 text-center">
			<h2 class="mb-3 text-3xl sm:text-4xl">{m['landing.flow.title']()}</h2>
			<p class="text-muted-foreground">{m['landing.flow.subtitle']()}</p>
		</BlurFade>
		<div class="grid gap-10 sm:grid-cols-3">
			{#each steps as step, i}
				<BlurFade direction="up" delay={i * 0.11}>
					<span class="mb-4 block font-serif text-5xl font-semibold text-primary/25">{step.n}</span>
					<h4 class="mb-2 font-semibold">{step.title}</h4>
					<p class="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
				</BlurFade>
			{/each}
		</div>
	</div>
</section>

<section class="px-6 py-24">
	<div class="mx-auto max-w-5xl">
		<div class="grid items-center gap-12 lg:grid-cols-2">
			<BlurFade direction="up">
				<h2 class="mb-4 text-3xl sm:text-4xl">{m['landing.deploy.title']()}</h2>
				<p class="mb-6 leading-relaxed text-muted-foreground">{m['landing.deploy.subtitle']()}</p>
				<ul class="mb-8 space-y-2.5">
					{#each [m['landing.deploy.check1'](), m['landing.deploy.check2'](), m['landing.deploy.check3']()] as item}
						<li class="flex items-center gap-2 text-sm">
							<Check size={15} class="shrink-0 text-primary" />
							{item}
						</li>
					{/each}
				</ul>
				<Button
					href="https://github.com/your-username/fenetre"
					variant="outline"
					target="_blank"
					rel="noopener noreferrer"
				>
					<Github />
					{m['landing.deploy.github']()}
				</Button>
			</BlurFade>

			<BlurFade direction="up" delay={0.15} class="terminal overflow-hidden rounded-xl shadow-xl">
				<div class="terminal-bar flex items-center gap-1.5 px-4 py-3">
					<span class="dot bg-red-400/70"></span>
					<span class="dot bg-yellow-400/70"></span>
					<span class="dot bg-green-400/70"></span>
				</div>
				<div class="terminal-body px-5 py-4 font-mono text-sm leading-relaxed">
					<TypingAnimation
						content="$ git clone github.com/you/fenetre"
						typeSpeed={30}
						delay={200}
						startOnView={true}
						showCursor={false}
						loop={false}
						class="block leading-relaxed tracking-normal"
					/>
					<TypingAnimation
						content="$ cp .env.example .env"
						typeSpeed={30}
						delay={1500}
						startOnView={true}
						showCursor={false}
						loop={false}
						class="block leading-relaxed tracking-normal"
					/>
					<TypingAnimation
						content="$ docker compose up -d"
						typeSpeed={30}
						delay={2600}
						startOnView={true}
						showCursor={false}
						loop={false}
						class="block leading-relaxed tracking-normal"
					/>
					<TypingAnimation
						content="✓ Ready on http://localhost:3000"
						typeSpeed={30}
						delay={3700}
						startOnView={true}
						showCursor={true}
						blinkCursor={false}
						loop={false}
						class="term-success block leading-relaxed tracking-normal"
					/>
				</div>
			</BlurFade>
		</div>
	</div>
</section>

<section class="px-6 py-28 text-center">
	<BlurFade direction="up" class="mx-auto max-w-2xl">
		<h2 class="mb-8 text-3xl sm:text-4xl lg:text-5xl">{m['landing.cta.headline']()}</h2>
		<div class="flex flex-wrap items-center justify-center gap-3">
			{#if users.length === 0}
				<Button href="/setup" size="lg">
					{m['home.landing.setup']()}
					<ArrowRight />
				</Button>
			{:else if users.length === 1}
				<Button href="/{users[0].username}" size="lg">
					{m['landing.cta.book_with']({ name: users[0].name })}
					<ArrowRight />
				</Button>
			{:else}
				<Button href="/directory" size="lg">
					{m['landing.cta.browse']()}
					<ArrowRight />
				</Button>
			{/if}
			<Button href={data.user ? '/admin' : '/login'} variant="ghost" size="sm">
				{data.user ? data.user.name : m['home.landing.login']()}
			</Button>
		</div>
	</BlurFade>
</section>

<style>
	.orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(88px);
		pointer-events: none;
		will-change: transform;
	}

	.orb-1 {
		width: 520px;
		height: 520px;
		top: -140px;
		right: -100px;
		background: oklch(0.72 0.12 85 / 0.3);
		animation: float1 9s ease-in-out infinite;
	}

	.orb-2 {
		width: 380px;
		height: 380px;
		bottom: 80px;
		left: -80px;
		background: oklch(0.56 0.11 140 / 0.22);
		animation: float2 11s ease-in-out infinite;
	}

	@keyframes float1 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		50% {
			transform: translate(-22px, 28px) scale(1.07);
		}
	}

	@keyframes float2 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		50% {
			transform: translate(26px, -20px) scale(1.05);
		}
	}

	:global(.feature-card) {
		transition:
			box-shadow 0.2s ease,
			transform 0.2s ease;
	}

	:global(.feature-card:hover) {
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	:global(.terminal) {
		background: oklch(0.13 0.016 250);
	}

	.terminal-bar {
		background: oklch(0.18 0.016 250);
		border-bottom: 1px solid oklch(0.22 0.016 250);
	}

	.dot {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}

	.terminal-body {
		color: oklch(0.78 0.035 245);
		min-height: 9rem;
	}

	:global(.term-success) {
		color: oklch(0.72 0.2 150);
	}

	:global(.dark) .orb-1 {
		background: oklch(0.68 0.144 56 / 0.18);
	}

	:global(.dark) .orb-2 {
		background: oklch(0.64 0.11 140 / 0.14);
	}
</style>
