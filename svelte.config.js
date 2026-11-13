import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		// Served at joshuacurry.dev/faa-tool via reverse proxy (prefix is NOT stripped)
		paths: { base: '/faa-tool' }
	}
};

export default config;
