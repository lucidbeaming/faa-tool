import { json } from '@sveltejs/kit';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { getFacility } from '$lib/facilities';
import { getChatModel } from '$lib/server/llm';
import { systemPrompt } from '$lib/server/prompt';
import { checkRateLimit } from '$lib/server/ratelimit';
import { sanitizeInput, validateInput, validateOutput } from '$lib/server/guardrails';
import type { RequestHandler } from './$types';

type Turn = { role: 'user' | 'assistant'; text: string };

const MAX_HISTORY_TURNS = 20;

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const model = getChatModel();
	if (!model) {
		return json({ error: 'Chat service is not configured' }, { status: 503 });
	}

	const limit = checkRateLimit(getClientAddress());
	if (!limit.allowed) {
		return json(
			{ error: 'FREQ CONGESTED. TRY AGAIN LATER.' },
			{
				status: 429,
				headers: { 'Retry-After': String(Math.ceil((limit.retryAfterMs ?? 0) / 1000)) }
			}
		);
	}

	let body: { message?: unknown; facility?: unknown; history?: unknown };
	try {
		body = await request.json();
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

	const history = (Array.isArray(body.history) ? body.history : [])
		.filter(
			(t): t is Turn =>
				!!t &&
				(t.role === 'user' || t.role === 'assistant') &&
				typeof t.text === 'string' &&
				t.text.length <= 2000
		)
		.slice(-MAX_HISTORY_TURNS);

	try {
		const res = await model.invoke([
			new SystemMessage(systemPrompt(facility)),
			...history.map((t) => (t.role === 'user' ? new HumanMessage(t.text) : new AIMessage(t.text))),
			new HumanMessage(message)
		]);
		return json({ response: validateOutput(res.text.trim()) });
	} catch (err) {
		console.error('[faa-tool] chat error', err);
		return json({ error: 'Chat service is currently unavailable' }, { status: 502 });
	}
};
