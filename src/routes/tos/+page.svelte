<script lang="ts">
	import { ArrowLeft } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<svelte:head>
	<title>Terms of Service — Fenêtre</title>
</svelte:head>

<div class="min-h-screen bg-background px-6 py-16">
	<div class="mx-auto max-w-2xl">
		<div class="mb-10">
			<Button href="/" variant="ghost" size="sm" class="-ml-2 mb-6">
				<ArrowLeft size={16} />
				Back
			</Button>
			<div class="flex items-center gap-2 mb-1">
				<img src="/image.png" alt="Fenêtre" class="size-5 rounded-full" />
				<span class="text-sm font-semibold tracking-tight">Fenêtre</span>
			</div>
			<h1 class="text-3xl font-bold mt-4">Terms of Service</h1>
			<p class="text-sm text-muted-foreground mt-1">Last updated: April 11, 2025</p>
		</div>

		<div class="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-foreground">
			<section>
				<h2 class="text-base font-semibold mb-2">1. What Fenêtre is</h2>
				<p class="text-muted-foreground">
					Fenêtre is an open-source, self-hosted scheduling tool for freelancers. By booking a call
					or creating an account through a Fenêtre-powered page, you agree to these terms.
				</p>
			</section>

			<section>
				<h2 class="text-base font-semibold mb-2">2. Booking a call</h2>
				<p class="text-muted-foreground">
					When you book a call through Fenêtre, you are scheduling a meeting with an independent
					freelancer — not with Fenêtre itself. The freelancer is solely responsible for the content
					and outcome of that meeting. Fenêtre only provides the scheduling infrastructure.
				</p>
			</section>

			<section>
				<h2 class="text-base font-semibold mb-2">3. Acceptable use</h2>
				<p class="text-muted-foreground mb-3">You agree not to:</p>
				<ul class="list-disc pl-5 space-y-1 text-muted-foreground">
					<li>Submit false or misleading information when booking</li>
					<li>Abuse the platform to send spam or unsolicited contact</li>
					<li>Attempt to access, modify, or disrupt any part of the service</li>
					<li>Use the service for any unlawful purpose</li>
				</ul>
			</section>

			<section>
				<h2 class="text-base font-semibold mb-2">4. Cancellations and rescheduling</h2>
				<p class="text-muted-foreground">
					You may cancel or reschedule your appointment using the link provided in your confirmation
					email. The freelancer's availability at the new time is not guaranteed and is subject to
					their calendar.
				</p>
			</section>

			<section>
				<h2 class="text-base font-semibold mb-2">5. Freelancer accounts</h2>
				<p class="text-muted-foreground">
					If you are a freelancer self-hosting or using a Fenêtre instance, you are responsible for
					all activity on your account, for keeping your credentials secure, and for complying with
					applicable laws regarding the personal data you collect from clients.
				</p>
			</section>

			<section>
				<h2 class="text-base font-semibold mb-2">6. Availability</h2>
				<p class="text-muted-foreground">
					Fenêtre is provided as-is. The operator of this instance makes no guarantees of uptime or
					availability. Scheduled appointments may be affected by service outages.
				</p>
			</section>

			<section>
				<h2 class="text-base font-semibold mb-2">7. Limitation of liability</h2>
				<p class="text-muted-foreground">
					To the maximum extent permitted by law, Fenêtre and its operators are not liable for any
					indirect, incidental, or consequential damages arising from your use of the service,
					including missed meetings, lost business, or data loss.
				</p>
			</section>

			<section>
				<h2 class="text-base font-semibold mb-2">8. Changes to these terms</h2>
				<p class="text-muted-foreground">
					The operator of this Fenêtre instance may update these terms at any time. Continued use of
					the service after changes are posted constitutes acceptance.
				</p>
			</section>

			<section>
				<h2 class="text-base font-semibold mb-2">9. Contact</h2>
				<p class="text-muted-foreground">
					For questions about these terms, contact the freelancer who operates this Fenêtre instance.
				</p>
			</section>
		</div>
	</div>
</div>
