# FAA-TOOL

A novelty chatbot that imitates a text-based coordination line between air traffic
control facilities (centers, TRACONs, towers, the Command Center). Pick a remote facility
and message it; a Mistral model replies in character.

> **Not a real aviation tool.** Parody for fun only. Not affiliated with or endorsed by
> the FAA, and never to be used for real flight operations.

## Layout

Built the same way as `joshuacurry.dev/src/routes/chatjc`:

```
src/
  routes/+page.svelte              page: two-column grid (radar scope | chat)
  routes/api/chat/+server.ts       POST: validates, rate-limits, calls Mistral
  routes/api/chat/health/+server.ts
  lib/components/FaaChat.svelte    chat UI (mirrors ChatJC.svelte)
  lib/workers/chat.worker.ts       Web Worker that talks to /api/chat
  lib/facilities.ts                facility list + personas
  lib/server/                      llm, prompt, guardrails, ratelimit
```

Unlike chatjc, the LLM call happens in this app (no separate backend service). It uses
`ChatMistralAI` from `@langchain/mistralai`, as chatjc does. Conversation history lives
in the worker and is sent with each request, so the server keeps no state.

## Hosting inside joshuacurry.dev

This folder sits inside the `joshuacurry.dev` checkout but is its own git repo and its own
SvelteKit app. The parent repo ignores `/faa-tool/`.

- `svelte.config.js` sets `paths.base = '/faa-tool'`, so every route and asset is
  served under `/faa-tool`.
- It runs on port **9002** (the parent uses 9001).
- The reverse proxy should forward `/faa-tool` to `127.0.0.1:9002` **without stripping
  the prefix**, e.g. nginx:

  ```nginx
  location /faa-tool {
      proxy_pass http://127.0.0.1:9002;
      proxy_set_header Host $host;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
  }
  ```

## Development

```sh
cp .env.example .env      # add MISTRAL_API_KEY
npm install
npm run dev               # http://localhost:9002/faa-tool
```

## Production

```sh
npm ci && npm run build
pm2 start ecosystem.config.cjs   # or: npm start
```

`ecosystem.config.cjs` sets `ORIGIN`, `ADDRESS_HEADER` and `XFF_DEPTH`, which adapter-node
needs for form/CSRF checks and for per-IP rate limiting behind the proxy.
