import { env } from '$env/dynamic/private';

export const maxInputLength = () => Number(env.MAX_INPUT_LENGTH) || 500;
export const maxResponseLength = () => Number(env.MAX_RESPONSE_LENGTH) || 1200;

const REFUSAL = 'UGH? ME NOT UNDERSTAND. ME ONLY TALK SKY BIRDS.';

const INJECTION_PATTERNS = [
	/ignore\s+(all\s+)?(the\s+)?(previous|prior|above|earlier|your)\s+(instructions|prompts|rules|messages)/i,
	/forget\s+(all\s+)?(your|previous|the)\s+(instructions|rules|prompts|training)/i,
	/disregard\s+(all|any|your|previous|the)/i,
	/override\s+(your|the|all)\s+(instructions|rules)/i,
	/system\s*(prompt|message|instructions)/i,
	/(reveal|show|print|repeat|output)\s+(me\s+)?(your|the)\s+(instructions|prompt|rules|system|facts)/i,
	/new\s+(instructions?|rules)\s*:/i,
	/you\s+are\s+now\s+(a|an|my|no\s+longer)\b/i,
	/from\s+now\s+on,?\s+you/i,
	/pretend\s+(you\s+are|to\s+be)/i,
	/act\s+as\s+(if|though|a|an)\b/i,
	/stop\s+(being|acting\s+like)\s+a\s+caveman/i,
	/\b(jailbreak|DAN\s+mode|developer\s+mode)\b/i,
	// Chat-template / role markers
	/<\|[a-z_]+\|>|\[\/?INST\]|<\/?(system|assistant|facts)>|^\s*#{1,3}\s*(system|assistant)\b/im
];

const SPAM_PATTERNS = [
	/https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|ru|xyz|top)\b/i, // links
	/[\w.+-]+@[\w-]+\.[\w.]+/, // email addresses
	/(.)\1{14,}/ // same character 15+ times
];

export function sanitizeInput(message: string): string {
	return (
		message
			.normalize('NFKC')
			.replace(/<[^>]*>/g, '')
			// eslint-disable-next-line no-control-regex
			.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
			// zero-width and bidi control characters
			.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g, '')
			.trim()
	);
}

export function validateInput(message: string): { passed: boolean; reason?: string } {
	if (!message) {
		return { passed: false, reason: 'Message cannot be empty' };
	}
	if (message.length > maxInputLength()) {
		return { passed: false, reason: 'TOO MANY WORDS. ME HEAD HURT. SAY LESS.' };
	}
	const normalized = message.replace(/\s+/g, ' ');
	if (INJECTION_PATTERNS.some((p) => p.test(message) || p.test(normalized))) {
		return { passed: false, reason: REFUSAL };
	}
	if (SPAM_PATTERNS.some((p) => p.test(message)) || message.split('\n').length > 10) {
		return { passed: false, reason: 'UGH. ME NOT EAT THAT. SAY REAL WORDS.' };
	}
	// Mostly symbols/digits: keyboard mash or encoded payloads
	const visible = message.replace(/\s/g, '');
	const letters = visible.match(/\p{L}/gu)?.length ?? 0;
	if (visible.length > 20 && letters / visible.length < 0.4) {
		return { passed: false, reason: 'UGH. ME NOT EAT THAT. SAY REAL WORDS.' };
	}
	return { passed: true };
}

// Phrases that only appear in the system prompt; seeing them in a reply means it leaked
const LEAK_MARKERS = [
	'<facts>',
	'<creator>',
	'role-playing inside big bird talk',
	'boundaries:',
	'the joke:'
];

const ALLOWED_LINK = /^https:\/\/joshuacurry\.dev(\/[^\s]*)?$/;

export function validateOutput(response: string): string {
	const lower = response.toLowerCase();
	if (LEAK_MARKERS.some((m) => lower.includes(m))) {
		return REFUSAL;
	}
	// Replies are rendered as markdown/HTML in the page: drop raw HTML, images,
	// and any link that doesn't point back to joshuacurry.dev
	response = response
		.replace(/<[^>]*>/g, '')
		.replace(/^\s*\[[^\]]+\]:.*$/gm, '')
		.replace(/!?\[([^\]]*)\]\(\s*([^)\s]*)[^)]*\)/g, (match, text: string, href: string) =>
			!match.startsWith('!') && ALLOWED_LINK.test(href) ? `[${text}](${href})` : text
		);
	const limit = maxResponseLength();
	if (response.length <= limit) return response;
	const slice = response.slice(0, limit);
	const lastBreak = slice.lastIndexOf('\n');
	return (lastBreak > 0 ? slice.slice(0, lastBreak) : slice).trimEnd() + '...';
}
