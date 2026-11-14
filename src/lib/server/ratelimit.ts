import { env } from '$env/dynamic/private';

type Client = { hits: number[]; inFlight: boolean; lastMessage: string; repeats: number };

const clients = new Map<string, Client>();
let globalHits: number[] = [];

const BURST_MAX = 4;
const BURST_WINDOW_MS = 20 * 1000;
const GLOBAL_WINDOW_MS = 60 * 60 * 1000;
const MAX_REPEATS = 2;

const windowMax = () => Number(env.RATE_LIMIT_MAX) || 30;
const windowMs = () => Number(env.RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000;
// Site-wide ceiling so a botnet can't run up the Mistral bill
const globalMax = () => Number(env.GLOBAL_RATE_LIMIT_MAX) || 600;

function client(ip: string): Client {
	let c = clients.get(ip);
	if (!c) {
		c = { hits: [], inFlight: false, lastMessage: '', repeats: 0 };
		clients.set(ip, c);
	}
	return c;
}

/** Counts a request against the per-IP burst/window limits and the global limit. */
export function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
	const now = Date.now();
	const c = client(ip);
	c.hits = c.hits.filter((t) => now - t < windowMs());
	globalHits = globalHits.filter((t) => now - t < GLOBAL_WINDOW_MS);

	if (globalHits.length >= globalMax()) {
		return { allowed: false, retryAfterMs: GLOBAL_WINDOW_MS - (now - globalHits[0]) };
	}
	if (c.hits.length >= windowMax()) {
		return { allowed: false, retryAfterMs: windowMs() - (now - c.hits[0]) };
	}
	const recent = c.hits.filter((t) => now - t < BURST_WINDOW_MS);
	if (recent.length >= BURST_MAX) {
		return { allowed: false, retryAfterMs: BURST_WINDOW_MS - (now - recent[0]) };
	}

	c.hits.push(now);
	globalHits.push(now);
	return { allowed: true };
}

/** One model call at a time per IP. Returns a release function, or undefined if busy. */
export function acquire(ip: string): (() => void) | undefined {
	const c = client(ip);
	if (c.inFlight) return undefined;
	c.inFlight = true;
	return () => {
		c.inFlight = false;
	};
}

/** True when the same message has been sent more than MAX_REPEATS times in a row. */
export function isRepeat(ip: string, message: string): boolean {
	const c = client(ip);
	const key = message.toLowerCase().replace(/\s+/g, ' ');
	c.repeats = key === c.lastMessage ? c.repeats + 1 : 0;
	c.lastMessage = key;
	return c.repeats >= MAX_REPEATS;
}

// Drop idle clients so the map can't grow without bound
setInterval(() => {
	const now = Date.now();
	for (const [ip, c] of clients) {
		if (!c.inFlight && c.hits.every((t) => now - t > windowMs())) clients.delete(ip);
	}
}, 60 * 1000).unref();
