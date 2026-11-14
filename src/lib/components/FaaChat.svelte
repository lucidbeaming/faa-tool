<script lang="ts">
	import { tick } from 'svelte';
	import { marked } from 'marked';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import { facilities, defaultFacility } from '$lib/facilities';

	let { customIntro = '' }: { customIntro?: string } = $props();

	let messages: Array<{ role: 'user' | 'assistant'; text: string }> = $state([]);
	let input = $state('');
	let loading = $state(false);
	let facilityId = $state(defaultFacility.id);
	let chatWindow: HTMLDivElement;
	let worker: Worker | undefined;

	const facility = $derived(facilities.find((f) => f.id === facilityId) ?? defaultFacility);

	$effect(() => {
		if (!browser) return;
		const w = new Worker(new URL('$lib/workers/chat.worker.ts', import.meta.url), {
			type: 'module'
		});
		worker = w;
		w.postMessage({ type: 'init', base, facility: defaultFacility.id });
		w.onmessage = (e) => {
			const { type, data, error } = e.data;
			if (type === 'response') {
				messages.push({ role: 'assistant', text: data.response ?? '' });
				loading = false;
				tick().then(scrollToBottom);
			} else if (type === 'error') {
				messages.push({ role: 'assistant', text: error });
				loading = false;
				tick().then(scrollToBottom);
			}
		};
		return () => w.terminate();
	});

	function changeFacility() {
		messages = [];
		loading = false;
		worker?.postMessage({ type: 'facility', facility: facilityId });
	}

	function scrollToBottom() {
		if (chatWindow) {
			chatWindow.scrollTop = chatWindow.scrollHeight;
		}
	}

	async function send() {
		const text = input.trim();
		if (!text || loading) return;

		messages.push({ role: 'user', text });
		input = '';
		loading = true;

		await tick();
		scrollToBottom();

		worker?.postMessage({ type: 'send', message: text });
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}

	marked.setOptions({ breaks: true, gfm: true });

	function renderMarkdown(text: string): string {
		return marked.parse(text) as string;
	}
</script>

<div class="faa-wrapper w-full">
	<div class="faa-card">
		<!-- Header -->
		<div class="faa-header">
			<div class="faa-header-left">
				<span class="faa-avatar">{facility.id}</span>
				<div>
					<span class="faa-title">{facility.name}</span>
					<span class="faa-status">
						<span class="faa-status-dot"></span>
						{facility.kind} · LINE OPEN
					</span>
				</div>
			</div>
			<label class="faa-facility">
				<span class="sr-only">Remote facility</span>
				<select bind:value={facilityId} onchange={changeFacility} class="faa-select">
					{#each facilities as f (f.id)}
						<option value={f.id}>{f.id} · {f.kind}</option>
					{/each}
				</select>
			</label>
		</div>

		<!-- Chat messages -->
		<div bind:this={chatWindow} class="faa-messages" aria-live="polite">
			<div class="faa-bubble faa-bubble-assistant faa-intro">
				{#if customIntro}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html customIntro}
				{:else}
					<p class="faa-greeting">{facility.id} CAVE ON LINE</p>
					<p>UGH. YOU TALK. ME LISTEN.</p>
				{/if}
			</div>
			{#if messages.length === 0}
				<div class="faa-examples">
					<span class="faa-examples-label">Try sending</span>
					{#each ['WHY ARE THE FLIGHTS GROUNDED?', 'APREQ UAL123 KSFO-KJFK, REQ FL370', 'WHAT ARE YOU LANDING?'] as q (q)}
						<button
							class="faa-example-chip"
							onclick={() => {
								input = q;
								send();
							}}
						>
							{q}
						</button>
					{/each}
				</div>
			{/if}
			{#each messages as msg, i (i)}
				<div
					class="faa-bubble faa-bubble-{msg.role === 'assistant'
						? 'assistant'
						: 'user'} faa-msg-enter"
				>
					<span class="faa-from">{msg.role === 'assistant' ? facility.id : 'YOU'}</span>
					{#if msg.role === 'assistant'}
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						<span class="chat-prose">{@html renderMarkdown(msg.text)}</span>
					{:else}
						<span>{msg.text}</span>
					{/if}
				</div>
			{/each}
			{#if loading}
				<div class="faa-bubble faa-bubble-assistant faa-msg-enter">
					<span class="faa-typing" aria-label="{facility.id} is typing">
						<span></span><span></span><span></span>
					</span>
				</div>
			{/if}
		</div>

		<!-- Input -->
		<div class="faa-input-bar">
			<input
				type="text"
				bind:value={input}
				onkeydown={handleKeydown}
				placeholder="Message {facility.id}..."
				aria-label="Message {facility.name}"
				disabled={loading}
				maxlength="500"
				class="faa-input"
			/>
			<button
				onclick={send}
				disabled={loading || !input.trim()}
				class="faa-send"
				aria-label="Send message"
			>
				TALK
			</button>
		</div>
	</div>
</div>

<style>
	/* Card */
	.faa-card {
		width: 100%;
		display: flex;
		flex-direction: column;
		border-radius: 10px;
		background: #fff;
		border: 3px solid var(--bbt-gold-dark);
		box-shadow: 0 10px 30px rgba(9, 31, 98, 0.25);
		overflow: hidden;
		font-family: var(--bbt-font);
	}

	/* Header */
	.faa-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: var(--bbt-navy);
		border-bottom: 3px solid var(--bbt-gold);
	}
	.faa-header-left {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		min-width: 0;
	}
	.faa-avatar {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		border: 2px solid var(--bbt-gold);
		background: var(--bbt-green);
		color: #fff;
		font-weight: 700;
		font-size: 0.7rem;
		letter-spacing: 0.04em;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.faa-title {
		display: block;
		font-weight: 700;
		font-size: 0.9rem;
		color: #fff;
		line-height: 1.2;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.faa-status {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.7rem;
		color: var(--bbt-gold);
		line-height: 1;
		letter-spacing: 0.06em;
	}
	.faa-status-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #5be37f;
		display: inline-block;
		animation: pulse-dot 2.4s ease-in-out infinite;
	}
	.faa-select {
		background: #fff;
		color: var(--bbt-navy);
		border: 2px solid var(--bbt-gold);
		border-radius: 6px;
		padding: 0.3rem 0.5rem;
		font-family: inherit;
		font-size: 0.75rem;
		font-weight: 600;
	}
	.faa-select:focus-visible {
		outline: 2px solid #fff;
		outline-offset: 2px;
	}

	/* Messages */
	.faa-messages {
		height: 16rem;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		scroll-behavior: smooth;
		background: var(--bbt-paper);
	}
	.faa-messages::-webkit-scrollbar {
		width: 4px;
	}
	.faa-messages::-webkit-scrollbar-thumb {
		background: var(--bbt-line);
		border-radius: 4px;
	}

	/* Bubbles */
	.faa-bubble {
		max-width: 88%;
		padding: 0.5rem 0.8rem;
		border-radius: 12px;
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--bbt-ink);
		word-break: break-word;
	}
	.faa-bubble-assistant {
		align-self: flex-start;
		background: #fff;
		border: 1px solid var(--bbt-line);
		border-left: 4px solid var(--bbt-green);
		border-bottom-left-radius: 4px;
	}
	.faa-bubble-user {
		align-self: flex-end;
		background: var(--bbt-navy);
		color: #fff;
		border-bottom-right-radius: 4px;
	}
	.faa-from {
		display: block;
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: var(--bbt-green);
		margin-bottom: 0.125rem;
	}
	.faa-bubble-user .faa-from {
		color: var(--bbt-gold);
	}

	/* Intro */
	.faa-intro {
		animation: fade-up 0.4s ease-out both;
	}
	.faa-greeting {
		font-weight: 700;
		color: var(--bbt-navy);
		letter-spacing: 0.04em;
		margin-bottom: 0.25rem;
	}
	.faa-intro p {
		margin: 0;
	}

	/* Example messages */
	.faa-examples {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		margin-top: 0.25rem;
	}
	.faa-examples-label {
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--bbt-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	.faa-example-chip {
		align-self: flex-start;
		background: #fff;
		border: 2px solid var(--bbt-navy);
		border-radius: 999px;
		padding: 0.3rem 0.75rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--bbt-navy);
		cursor: pointer;
		font-family: inherit;
		text-align: left;
		transition:
			background 0.15s,
			color 0.15s;
		line-height: 1.4;
	}
	.faa-example-chip:hover,
	.faa-example-chip:focus-visible {
		background: var(--bbt-navy);
		color: #fff;
	}

	/* Message enter */
	.faa-msg-enter {
		animation: fade-up 0.25s ease-out both;
	}

	/* Typing indicator */
	.faa-typing {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 0.125rem 0.25rem;
	}
	.faa-typing span {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--bbt-green);
		opacity: 0.5;
		animation: typing-bounce 1.2s ease-in-out infinite;
	}
	.faa-typing span:nth-child(2) {
		animation-delay: 0.15s;
	}
	.faa-typing span:nth-child(3) {
		animation-delay: 0.3s;
	}

	/* Input bar */
	.faa-input-bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 0.75rem;
		border-top: 1px solid var(--bbt-line);
		background: #fff;
	}
	.faa-input {
		flex: 1;
		min-width: 0;
		border: 2px solid var(--bbt-line);
		border-radius: 8px;
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		font-family: inherit;
		color: var(--bbt-ink);
		background: #fff;
		outline: none;
		transition: border-color 0.15s;
	}
	.faa-input::placeholder {
		color: var(--bbt-muted);
	}
	.faa-input:focus {
		border-color: var(--bbt-navy);
		box-shadow: 0 0 0 3px rgba(9, 31, 98, 0.15);
	}
	.faa-input:disabled {
		opacity: 0.5;
	}
	.faa-send {
		height: 2.4rem;
		padding: 0 1rem;
		border-radius: 8px;
		border: 2px solid var(--bbt-gold);
		background: var(--bbt-navy);
		color: #fff;
		font-family: inherit;
		font-weight: 700;
		font-size: 0.8rem;
		letter-spacing: 0.08em;
		cursor: pointer;
		flex-shrink: 0;
		transition: background 0.15s;
	}
	.faa-send:hover:not(:disabled) {
		background: var(--bbt-green);
	}
	.faa-send:focus-visible {
		outline: 3px solid var(--bbt-orange);
		outline-offset: 2px;
	}
	.faa-send:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	/* Prose inside bubbles */
	.chat-prose :global(p) {
		margin: 0.25em 0;
	}
	.chat-prose :global(p:first-child) {
		margin-top: 0;
	}
	.chat-prose :global(ul),
	.chat-prose :global(ol) {
		margin: 0.25em 0;
		padding-left: 1.25em;
	}
	.chat-prose :global(strong) {
		font-weight: 700;
	}
	.chat-prose :global(a) {
		color: var(--bbt-navy);
		font-weight: 700;
		text-decoration: underline;
		text-decoration-color: var(--bbt-orange);
		text-decoration-thickness: 2px;
		text-underline-offset: 3px;
	}

	/* Keyframes */
	@keyframes fade-up {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	@keyframes pulse-dot {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
	}
	@keyframes typing-bounce {
		0%,
		60%,
		100% {
			transform: translateY(0);
			opacity: 0.4;
		}
		30% {
			transform: translateY(-4px);
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.faa-intro,
		.faa-msg-enter,
		.faa-status-dot,
		.faa-typing span {
			animation: none;
		}
		.faa-messages {
			scroll-behavior: auto;
		}
	}
</style>
