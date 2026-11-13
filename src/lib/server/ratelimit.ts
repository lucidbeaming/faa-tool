const attempts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 10 * 60 * 1000;
const MAX_MESSAGES = 30;

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
	const now = Date.now();
	const record = attempts.get(ip);

	if (!record || now > record.resetAt) {
		attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
		return { allowed: true };
	}

	if (record.count >= MAX_MESSAGES) {
		return { allowed: false, retryAfterMs: record.resetAt - now };
	}

	record.count++;
	return { allowed: true };
}
