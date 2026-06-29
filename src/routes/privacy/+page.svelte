<script lang="ts">
	import { ArrowLeft } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<svelte:head>
	<title>Privacy Policy — Fenêtre</title>
</svelte:head>

<div class="min-h-screen bg-background px-6 py-16">
	<div class="mx-auto max-w-2xl">
		<div class="mb-10">
			<Button href="/" variant="ghost" size="sm" class="mb-6 -ml-2">
				<ArrowLeft size={16} />
				Back
			</Button>
			<div class="mb-1 flex items-center gap-2">
				<img src="/image.png" alt="Fenêtre" class="size-5 rounded-full" />
				<span class="text-sm font-semibold tracking-tight">Fenêtre</span>
			</div>
			<h1 class="mt-4 text-3xl font-bold">Privacy Policy</h1>
			<p class="mt-1 text-sm text-muted-foreground">Last updated: June 29, 2026</p>
		</div>

		<div
			class="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-foreground"
		>
			<section>
				<h2 class="mb-2 text-base font-semibold">1. Overview</h2>
				<p class="text-muted-foreground">
					Fenêtre is a self-hosted booking tool for freelancers. This policy describes what data is
					collected when you book a call through a Fenêtre-powered page, and how it is used.
				</p>
			</section>

			<section>
				<h2 class="mb-2 text-base font-semibold">2. Data we collect</h2>
				<p class="mb-3 text-muted-foreground">When you book an appointment, we collect:</p>
				<ul class="list-disc space-y-1 pl-5 text-muted-foreground">
					<li>Your full name and email address</li>
					<li>Your phone number, when you book a phone call (so the freelancer can reach you)</li>
					<li>Your LinkedIn profile URL (optional)</li>
					<li>
						Your project brief — description, stack, budget, timeline, mission type (optional)
					</li>
					<li>
						Your company name and SIREN, plus any custom fields the freelancer added to their form
						(optional)
					</li>
					<li>The date, time, and type of the meeting you selected</li>
					<li>The source you came from (e.g. Malt, LinkedIn, Portfolio)</li>
				</ul>
				<p class="mt-3 text-muted-foreground">
					If you are the freelancer using Fenêtre to manage your schedule, we also store your Google
					account credentials (via OAuth) to create and update calendar events on your behalf.
				</p>
			</section>

			<section>
				<h2 class="mb-2 text-base font-semibold">3. How we use your data</h2>
				<ul class="list-disc space-y-1 pl-5 text-muted-foreground">
					<li>To confirm your booking and send you a confirmation email</li>
					<li>To send reminder emails before the meeting (24 hours and 1 hour before)</li>
					<li>To create a Google Calendar event with a Google Meet link</li>
					<li>
						For phone calls, to share your phone number with the freelancer shortly before the
						meeting
					</li>
					<li>To allow you to reschedule or cancel your appointment</li>
					<li>
						If you start a brief but do not finish booking, to send you a single email reminding you
						to complete it
					</li>
					<li>To provide the freelancer with context about your project</li>
					<li>
						To enrich your company details (via SIREN lookup) and generate an AI summary of your
						project to help the freelancer prepare for the meeting
					</li>
				</ul>
			</section>

			<section>
				<h2 class="mb-2 text-base font-semibold">4. Data storage</h2>
				<p class="text-muted-foreground">
					All data is stored in a PostgreSQL database hosted by the operator of this Fenêtre
					instance. Fenêtre is self-hosted software — the person running this service controls where
					and how data is stored. Emails are sent via Resend.
				</p>
			</section>

			<section>
				<h2 class="mb-2 text-base font-semibold">5. Data retention</h2>
				<p class="text-muted-foreground">
					Booking data is retained for as long as the freelancer's account is active. You may
					request deletion of your personal data at any time by contacting the freelancer directly.
				</p>
			</section>

			<section>
				<h2 class="mb-2 text-base font-semibold">6. Third-party services</h2>
				<ul class="list-disc space-y-1 pl-5 text-muted-foreground">
					<li><strong class="text-foreground">Google</strong> — Calendar and Meet integration</li>
					<li><strong class="text-foreground">Resend</strong> — Transactional emails</li>
					<li>
						<strong class="text-foreground">Pappers</strong> — Company lookup and enrichment from a SIREN
					</li>
					<li>
						<strong class="text-foreground">OpenAI</strong> — AI summary and compatibility scoring of
						your project
					</li>
				</ul>
				<p class="mt-3 text-muted-foreground">
					Your data is shared with these providers only as required to operate the features above.
					It is never sold, and not shared for any other purpose.
				</p>
			</section>

			<section>
				<h2 class="mb-2 text-base font-semibold">7. Your rights</h2>
				<p class="text-muted-foreground">
					You have the right to access, correct, or delete personal data we hold about you. To
					exercise these rights, contact the freelancer who operates this Fenêtre instance.
				</p>
			</section>

			<section>
				<h2 class="mb-2 text-base font-semibold">8. Contact</h2>
				<p class="text-muted-foreground">
					For any privacy-related questions, reach out directly to the freelancer whose booking page
					you used.
				</p>
			</section>
		</div>
	</div>
</div>
