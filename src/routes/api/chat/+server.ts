import { json } from '@sveltejs/kit';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { getFacility } from '$lib/facilities';
import { getChatModel } from '$lib/server/llm';
import { systemPrompt } from '$lib/server/prompt';
import { acquire, checkRateLimit, isRepeat } from '$lib/server/ratelimit';
import {
	maxResponseLength,
	sanitizeInput,
	validateInput,
	validateOutput
} from '$lib/server/guardrails';
import type { RequestHandler } from './$types';

type Turn = { role: 'user' | 'assistant'; text: string };

const MAX_HISTORY_TURNS = 12;
const MAX_BODY_BYTES = 16 * 1024;
const MODEL_TIMEOUT_MS = 20 * 1000;

const TIRED = 'TOO MUCH TALK. ME TIRED. COME BACK WHEN SUN MOVE.';

/** History comes from the client, so it must look like something this server produced. */
function parseHistory(raw: unknown): Turn[] | undefined {
	if (raw === undefined) return [];
	if (!Array.isArray(raw) || raw.length > MAX_HISTORY_TURNS * 2) return undefined;
	const turns: Turn[] = [];
	for (const [i, t] of raw.entries()) {
		const role = i % 2 === 0 ? 'user' : 'assistant';
		if (!t || t.role !== role || typeof t.text !== 'string') return undefined;
		const text = role === 'user' ? sanitizeInput(t.text) : t.text;
		if (role === 'user' && !validateInput(text).passed) return undefined;
		if (role === 'assistant' && text.length > maxResponseLength() + 3) return undefined;
		turns.push({ role, text });
	}
	if (turns.length % 2 !== 0) return undefined;
	return turns.slice(-MAX_HISTORY_TURNS);
}

export const POST: RequestHandler = async ({ request, url, getClientAddress }) => {
	const model = getChatModel();
	if (!model) {
		return json({ error: 'Chat service is not configured' }, { status: 503 });
	}

	// Only accept calls from this site's own page (blocks drive-by use from other sites)
	const origin = request.headers.get('origin');
	const fetchSite = request.headers.get('sec-fetch-site');
	if (origin !== url.origin || (fetchSite && fetchSite !== 'same-origin')) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}
	if (!request.headers.get('content-type')?.startsWith('application/json')) {
		return json({ error: 'Expected JSON' }, { status: 415 });
	}

	const ip = getClientAddress();
	const limit = checkRateLimit(ip);
	if (!limit.allowed) {
		return json(
			{ error: TIRED },
			{
				status: 429,
				headers: { 'Retry-After': String(Math.ceil((limit.retryAfterMs ?? 0) / 1000)) }
			}
		);
	}

	const raw = await request.text();
	if (raw.length > MAX_BODY_BYTES) {
		return json({ error: 'Request too large' }, { status: 413 });
	}

	let body: { message?: unknown; facility?: unknown; history?: unknown };
	try {
		body = JSON.parse(raw);
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const facility = getFacility(typeof body.facility === 'string' ? body.facility : undefined);
	if (!facility) {
		return json({ error: 'Unknown facility' }, { status: 400 });
	}

	const message = sanitizeInput(typeof body.message === 'string' ? body.message : '');
	const check = validateInput(message);
	if (!check.passed) {
		return json({ error: check.reason }, { status: 400 });
	}
	if (isRepeat(ip, message)) {
		return json({ error: 'UGH. YOU SAY SAME THING. ME HEAR FIRST TIME.' }, { status: 429 });
	}

	const history = parseHistory(body.history);
	if (!history) {
		return json({ error: 'Invalid history' }, { status: 400 });
	}

	const release = acquire(ip);
	if (!release) {
		return json({ error: 'ONE AT TIME. ME ONLY HAVE ONE MOUTH.' }, { status: 429 });
	}

	try {
		const res = await model.invoke(
			[
				new SystemMessage(systemPrompt(facility)),
				...history.map((t) =>
					t.role === 'user' ? new HumanMessage(t.text) : new AIMessage(t.text)
				),
				new HumanMessage(message)
			],
			{ signal: AbortSignal.timeout(MODEL_TIMEOUT_MS) }
		);
		return json({ response: validateOutput(res.text.trim()) });
	} catch (err) {
		console.error('[faa-tool] chat error', err);
		return json({ error: 'Chat service is currently unavailable' }, { status: 502 });
	} finally {
		release();
	}
};
