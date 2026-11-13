import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import pkg from '../../../../../package.json' with { type: 'json' };
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	if (!env.MISTRAL_API_KEY) {
		return json({ error: 'Chat service is not configured' }, { status: 503 });
	}
	return json({ status: 'ok', version: pkg.version });
};
