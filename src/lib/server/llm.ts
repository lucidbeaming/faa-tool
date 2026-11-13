import { ChatMistralAI } from '@langchain/mistralai';
import { env } from '$env/dynamic/private';

let chatModel: ChatMistralAI | undefined;

export function getChatModel(): ChatMistralAI | undefined {
	if (!env.MISTRAL_API_KEY) return undefined;
	if (!chatModel) {
		chatModel = new ChatMistralAI({
			model: env.MISTRAL_CHAT_MODEL || 'mistral-small-latest',
			apiKey: env.MISTRAL_API_KEY,
			// Higher than chatjc (0.3): this is role-play, not factual Q&A
			temperature: 0.7,
			maxTokens: Number(env.MAX_RESPONSE_TOKENS) || 300
		});
	}
	return chatModel;
}
