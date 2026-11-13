type Turn = { role: 'user' | 'assistant'; text: string };

let base = '';
let facility = '';
let turns: Turn[] = [];

self.onmessage = async (e: MessageEvent) => {
	const { type } = e.data;

	if (type === 'init') {
		base = e.data.base ?? '';
		facility = e.data.facility ?? '';
		try {
			const res = await fetch(`${base}/api/chat/health`);
			const data = await res.json();
			self.postMessage({ type: 'version', version: data.version ?? '' });
		} catch {
			self.postMessage({ type: 'version', version: '' });
		}
		return;
	}

	if (type === 'facility') {
		facility = e.data.facility;
		turns = [];
		return;
	}

	if (type === 'send') {
		const message: string = e.data.message;
		try {
			const res = await fetch(`${base}/api/chat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message, facility, history: turns })
			});

			const data = await res.json();

			if (!res.ok) {
				self.postMessage({ type: 'error', error: data.error ?? 'Something went wrong' });
				return;
			}

			turns.push({ role: 'user', text: message }, { role: 'assistant', text: data.response });
			self.postMessage({ type: 'response', data });
		} catch {
			self.postMessage({ type: 'error', error: 'Unable to reach chat service' });
		}
	}
};
