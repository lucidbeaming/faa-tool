<script lang="ts">
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { tick } from 'svelte';

	let matomoInited = $state(false);
	let previousPageUrl: string | undefined = undefined;

	$effect(() => {
		if (!browser) return;

		if (!matomoInited) {
			if (window._paq) {
				matomoInited = true;
			} else {
				window._paq = [];
				window._paq.push(['setTrackerUrl', 'https://lucidbeaming.net/m/matomo.php']);
				window._paq.push(['setSiteId', '8']);
				window._paq.push(['enableLinkTracking']);
				const script = document.createElement('script');
				script.async = true;
				script.src = 'https://lucidbeaming.net/m/matomo.js';
				document.head.appendChild(script);
				matomoInited = true;
			}
		}
	});

	$effect(() => {
		const pathname = page.url.pathname;
		const hash = page.url.hash ?? '';
		const currentUrl = pathname + hash;

		if (!browser) return;
		if (!window._paq) return;
		if (previousPageUrl !== undefined && currentUrl === previousPageUrl) return;

		async function pushParamsAndTrack() {
			await tick();
			const referrer = previousPageUrl ?? document.referrer ?? '';
			window._paq!.push(['setReferrerUrl', referrer]);
			window._paq!.push(['setCustomUrl', currentUrl]);
			window._paq!.push(['setDocumentTitle', document.title]);
			window._paq!.push(['trackPageView']);
			previousPageUrl = currentUrl;
		}

		pushParamsAndTrack();
	});
</script>
