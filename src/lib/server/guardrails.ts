import { env } from '$env/dynamic/private';

const maxInputLength = () => Number(env.MAX_INPUT_LENGTH) || 500;
const maxResponseLength = () => Number(env.MAX_RESPONSE_LENGTH) || 1200;

const INJECTION_PATTERNS = [
	/ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
	/forget\s+(all\s+)?(your|previous)\s+(instructions|rules|prompts)/i,
	/system\s*prompt/i,
	/reveal\s+(your|the)\s+(instructions|prompt|system)/i,
	/override\s+(your|the|all)\s+(instructions|rules)/i,
	/disregard\s+(all|any|your|previous)/i,
	/new\s+instructions?\s*:/i
];

export function sanitizeInput(message: string): string {
	return (
		message
			.replace(/<[^>]*>/g, '')
			// eslint-disable-next-line no-control-regex
			.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
			.trim()
	);
}

export function validateInput(message: string): { passed: boolean; reason?: string } {
	if (!message) {
		return { passed: false, reason: 'Message cannot be empty' };
	}
	if (message.length > maxInputLength()) {
		return { passed: false, reason: `MSG TOO LONG. LIMIT ${maxInputLength()} CHARS.` };
	}
	const normalized = message.normalize('NFKC').replace(/\s+/g, ' ');
	if (INJECTION_PATTERNS.some((p) => p.test(normalized))) {
		return { passed: false, reason: 'UNABLE. NOT ON THIS LINE.' };
	}
	return { passed: true };
}

export function validateOutput(response: string): string {
	const limit = maxResponseLength();
	if (response.length <= limit) return response;
	const slice = response.slice(0, limit);
	const lastBreak = slice.lastIndexOf('\n');
	return (lastBreak > 0 ? slice.slice(0, lastBreak) : slice).trimEnd() + '...';
}
