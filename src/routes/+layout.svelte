<script lang="ts">
	import '../app.css';
	import MatomoTracker from '$lib/components/MatomoTracker.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<!-- Same Matomo site as joshuacurry.dev (site 8), so visits show up as /faa-tool/ there -->
<MatomoTracker />
{@render children()}
