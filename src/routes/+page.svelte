<script lang="ts">
	import FaaChat from '$lib/components/FaaChat.svelte';
	import { asset } from '$app/paths';

	const pageTitle = 'Big Bird Talk | Joshua Curry';
	const pageDescription =
		'A novelty caveman chatbot that imitates a coordination line between air traffic control facilities.';
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
	<header class="bbt-banner">
		<h1>Big Bird Talk</h1>
		<p>Sky-cave coordination line · simulation</p>
	</header>
	<div class="faa-page grid grid-cols-1 md:grid-cols-2 gap-6">
		<div class="faa-col">
			<img
				class="emblem"
				src={asset('/big-bird-talk.svg')}
				alt="Big Bird Talk emblem: a gold bird flying over mountains and a river, ringed in navy and gold"
				width="400"
				height="400"
			/>
		</div>
		<div class="faa-col">
			<FaaChat />
		</div>
	</div>
	<p class="bbt-disclaimer">
		Novelty project. Not affiliated with or endorsed by the FAA or any government agency. Not for
		real-world flight operations. Responses are AI-generated and fictional.
	</p>
</main>

<style>
	.bbt-banner {
		margin-bottom: 1.5rem;
		padding-bottom: 0.75rem;
		border-bottom: 3px solid var(--bbt-navy);
	}
	.bbt-banner h1 {
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--bbt-navy);
		line-height: 1.1;
	}
	.bbt-banner p {
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--bbt-navy);
	}
	.bbt-disclaimer {
		margin-top: 1.5rem;
		font-size: 0.75rem;
		color: var(--bbt-navy);
		max-width: 62ch;
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
	/* single column: emblem row shrinks, chat gets the rest */
	@media (max-width: 767px) {
		.faa-page {
			height: auto;
			grid-template-rows: auto 70vh;
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

	.emblem {
		display: block;
		width: 100%;
		max-width: 460px;
		max-height: 100%;
		height: auto;
		margin: auto;
		object-fit: contain;
		filter: drop-shadow(0 12px 24px rgba(9, 31, 98, 0.35));
	}
	@media (max-width: 767px) {
		.emblem {
			max-width: 240px;
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
