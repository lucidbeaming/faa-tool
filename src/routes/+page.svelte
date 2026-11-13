<script lang="ts">
	import FaaChat from '$lib/components/FaaChat.svelte';

	// Fictional targets painted on the scope: polar position + data block
	const targets = [
		{ angle: 38, r: 0.62, tag: 'UAL123', alt: '370' },
		{ angle: 112, r: 0.34, tag: 'SWA88', alt: '120' },
		{ angle: 201, r: 0.78, tag: 'DAL1902', alt: '350' },
		{ angle: 263, r: 0.48, tag: 'N512KR', alt: '045' },
		{ angle: 318, r: 0.85, tag: 'AAL17', alt: '390' },
		{ angle: 154, r: 0.7, tag: 'ASA301', alt: '240' }
	].map((t) => {
		const rad = ((t.angle - 90) * Math.PI) / 180;
		return { ...t, x: 50 + Math.cos(rad) * t.r * 46, y: 50 + Math.sin(rad) * t.r * 46 };
	});

	const pageTitle = 'FAA-TOOL | Joshua Curry';
	const pageDescription =
		'A novelty chatbot that imitates an inter-facility coordination line between air traffic control facilities.';
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:type" content="website" />
	<meta property="og:description" content={pageDescription} />
	<meta property="og:url" content="https://joshuacurry.dev/faa-tool" />
	<meta property="og:site_name" content="Joshua Curry" />
</svelte:head>

<main class="max-w-6xl mx-auto px-4 py-8 md:py-12">
	<header class="faa-banner">
		<h1>FAA-TOOL</h1>
		<p>Inter-facility coordination line · simulation</p>
	</header>
	<div class="faa-page grid grid-cols-1 md:grid-cols-2 gap-4">
		<div class="faa-col">
			<div class="scope" aria-hidden="true">
				<svg viewBox="0 0 100 100">
					<circle cx="50" cy="50" r="46" class="ring" />
					<circle cx="50" cy="50" r="34.5" class="ring" />
					<circle cx="50" cy="50" r="23" class="ring" />
					<circle cx="50" cy="50" r="11.5" class="ring" />
					<line x1="50" y1="4" x2="50" y2="96" class="ring" />
					<line x1="4" y1="50" x2="96" y2="50" class="ring" />
					<g class="sweep">
						<path d="M50 50 L50 4 A46 46 0 0 1 82.5 17.5 Z" class="sweep-fill" />
						<line x1="50" y1="50" x2="50" y2="4" class="sweep-line" />
					</g>
					{#each targets as t (t.tag)}
						<g class="target" style="animation-delay: {(t.angle / 360) * 6}s">
							<rect x={t.x - 0.9} y={t.y - 0.9} width="1.8" height="1.8" />
							<text x={t.x + 2} y={t.y - 1.2}>{t.tag}</text>
							<text x={t.x + 2} y={t.y + 2.2}>{t.alt}</text>
						</g>
					{/each}
				</svg>
			</div>
		</div>
		<div class="faa-col">
			<FaaChat />
		</div>
	</div>
	<p class="faa-disclaimer">
		Novelty project. Not affiliated with or endorsed by the FAA. Not for real-world flight
		operations. Responses are AI-generated and fictional.
	</p>
</main>

<style>
	.faa-banner {
		margin-bottom: 1rem;
	}
	.faa-banner h1 {
		font-size: 1.25rem;
		font-weight: 700;
		letter-spacing: 0.2em;
		color: var(--scope-green);
	}
	.faa-banner p {
		font-size: 0.7rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--scope-muted);
	}
	.faa-disclaimer {
		margin-top: 1.5rem;
		font-size: 0.7rem;
		color: var(--scope-muted);
		max-width: 60ch;
	}

	.faa-page {
		height: 145vh;
		align-items: stretch;
	}
	.faa-col {
		max-height: 715px;
		align-self: center;
	}
	@media (min-width: 768px) {
		.faa-page {
			height: 80vh;
		}
	}
	/* single column: two equal rows so each section fills half height */
	@media (max-width: 767px) {
		.faa-page {
			grid-template-rows: 1fr 1fr;
		}
	}

	/* grid children: stretch to fill grid row height */
	.faa-page :global(> div) {
		min-width: 0;
		min-height: 0;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	/* radar scope */
	.scope {
		width: 100%;
		max-height: 100%;
		aspect-ratio: 1;
		margin: auto;
		border-radius: 50%;
		background: radial-gradient(circle, #0b2414 0%, var(--scope-bg) 70%);
		box-shadow:
			inset 0 0 40px rgba(57, 255, 122, 0.08),
			0 0 0 2px var(--scope-line);
	}
	.scope svg {
		width: 100%;
		height: 100%;
	}
	.ring {
		fill: none;
		stroke: var(--scope-line);
		stroke-width: 0.3;
	}
	.sweep {
		transform-origin: 50px 50px;
		animation: sweep 6s linear infinite;
	}
	.sweep-fill {
		fill: rgba(57, 255, 122, 0.12);
	}
	.sweep-line {
		stroke: var(--scope-green);
		stroke-width: 0.4;
	}
	.target {
		fill: var(--scope-green);
		animation: paint 6s linear infinite;
	}
	.target text {
		font-family: var(--scope-font);
		font-size: 2.4px;
	}

	@keyframes sweep {
		to {
			transform: rotate(360deg);
		}
	}
	/* blip brightens as the sweep passes, then decays */
	@keyframes paint {
		0% {
			opacity: 1;
		}
		70% {
			opacity: 0.25;
		}
		100% {
			opacity: 0.25;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sweep {
			animation: none;
			transform: rotate(40deg);
		}
		.target {
			animation: none;
			opacity: 0.85;
		}
	}

	/* chat wrapper: fill grid cell */
	.faa-page :global(.faa-wrapper) {
		flex: 1;
		min-height: 0;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	/* card: fill wrapper height */
	.faa-page :global(.faa-card) {
		flex: 1;
		min-height: 0;
	}

	/* chat message window: grow to fill available space, shrink to scroll */
	.faa-page :global(.faa-messages) {
		flex: 1 1 0;
		min-height: 0;
		height: auto;
	}
</style>
