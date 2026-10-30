/**
 * Sarashina API (SB Intuitions) provider for pi.
 *
 * Sarashina exposes an OpenAI-compatible Chat Completions endpoint at
 * https://api.sarashina.ai/v1, so the built-in "openai-completions" API
 * implementation is used as-is; no custom streaming is needed.
 *
 * Compat notes (verified against pi-ai's openai-completions implementation):
 * - Auto-detected defaults for an unknown provider would send `store`,
 *   `stream_options`, `strict` on tools, the `developer` role for reasoning
 *   models, and prompt-cache fields. Sarashina ignores undocumented params,
 *   but we disable them explicitly to keep the wire format minimal.
 * - `reasoning_effort` is only sent for the thinking model, and only when a
 *   thinking level other than off is selected (Sarashina returns 400 if it is
 *   sent to a non-thinking model; pi already gates it on `model.reasoning`).
 * - The thinking model's encrypted `reasoning` field is captured as a thinking
 *   block whose signature is "reasoning", and replayed verbatim on subsequent
 *   requests, preserving thinking context across turns.
 * - Sarashina only accepts message `content` as a plain string; the OpenAI-style
 *   array-of-parts form (which pi emits for user messages) returns
 *   400 "Invalid JSON". An `onPayload` rewrite inside streamSarashina flattens
 *   text parts back into a string before the request is sent.
 * - `sarashina3-guard` is a moderation-only model: the API documents `tools`
 *   and `tool_choice` as unsupported for it (verified: 400 "Bad Request"). pi
 *   attaches `tools` whenever the agent has tools (and `tools: []` once
 *   history has tool calls), so the same rewrite strips both fields for that
 *   model only.
 * - The thinking model's encrypted `reasoning` would render in the TUI as an
 *   unreadable base64 "thinking" block; a markdown transformer replaces the
 *   display with a placeholder while leaving the stored content (and thus
 *   replay) untouched.
 *
 * Usage:
 *   SARASHINA_API_KEY=... pi -e ./packages/pi-sarashina --model sarashina/sarashina3-nano
 *   pi install ./packages/pi-sarashina   # persistent install
 */

import { openAICompletionsApi } from "@earendil-works/pi-ai";
import type {
	Api,
	AssistantMessageEventStream,
	Context,
	Model,
	SimpleStreamOptions,
} from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext, ProviderModelConfig } from "@earendil-works/pi-coding-agent";

// Compat flags shared by all Sarashina models: don't send params the API does
// not document. maxTokensField defaults to "max_completion_tokens", which is
// what Sarashina expects (range 1-8000).
const SARASHINA_COMPAT: ProviderModelConfig["compat"] = {
	supportsStore: false,
	supportsUsageInStreaming: false,
	supportsStrictMode: false,
	supportsDeveloperRole: false,
	requiresToolResultName: false,
	supportsLongCacheRetention: false,
};

const FREE_COST = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };

const openaiCompletions = openAICompletionsApi();

// Sarashina-specific wire fixes, applied inside streamSarashina's onPayload
// so they hold for every caller of the provider stream — not only the paths
// that emit before_provider_request. (In pi 0.85.1 the agent streamFn injects
// onPayload into summarization calls too, but any path that invokes the
// provider stream directly would otherwise bypass the rewrite.)
// - Sarashina rejects OpenAI-style content part arrays with 400 "Invalid
//   JSON"; flatten text parts back to a plain string.
// - sarashina3-guard is moderation-only: the API documents tools/tool_choice
//   as unsupported for it (verified: 400 "Bad Request"), and pi attaches
//   `tools` whenever the agent has tools (plus `tools: []` once history has
//   tool calls), so strip both fields for that model.
function rewriteSarashinaPayload(payload: unknown, modelId: string): unknown {
	const p = payload as
		| { messages?: Array<{ content?: unknown }>; tools?: unknown; tool_choice?: unknown }
		| undefined;
	if (!p) return payload;
	if (modelId === "sarashina3-guard") {
		delete p.tools;
		delete p.tool_choice;
	}
	if (!Array.isArray(p.messages)) return p;
	for (const message of p.messages) {
		if (Array.isArray(message.content)) {
			message.content = (message.content as Array<{ type?: string; text?: string }>)
				.filter((part) => part?.type === "text" && typeof part.text === "string")
				.map((part) => part.text)
				.join("\n");
		}
	}
	return p;
}

// Provider-level retries honoring Retry-After, scoped to sarashina only.
// Rationale: Sarashina rate-limits per fixed 60-second window. pi's agent-level
// retry (on by default) ignores Retry-After and waits 2s/4s/8s, so it can burn
// all attempts inside a single window; pi's provider-level retry waits exactly
// Retry-After but ships disabled (retry.provider.maxRetries = 0, a global
// setting). We turn it on here unless the caller already configured it, so a
// 429 waits out the window instead of failing fast. Losing the race still
// falls back to the agent-level retry.
function streamSarashina(
	model: Model<Api>,
	context: Context,
	options?: SimpleStreamOptions,
): AssistantMessageEventStream {
	const callerOnPayload = options?.onPayload;
	return openaiCompletions.streamSimple(model, context, {
		...options,
		maxRetries: options?.maxRetries || 3,
		// Compose after any caller-supplied onPayload (which is what carries
		// before_provider_request emissions) so the sarashina rewrite always
		// runs last and cannot be bypassed.
		onPayload: async (payload, m) =>
			rewriteSarashinaPayload((await callerOnPayload?.(payload, m)) ?? payload, model.id),
	});
}

const MODELS: ProviderModelConfig[] = [
	{
		id: "sarashina3.2-mini-thinking",
		name: "Sarashina 3.2 mini (thinking)",
		reasoning: true,
		// Sarashina only accepts low/medium/high. Unsupported levels are hidden
		// (clamped to the nearest supported one); "off" stays selectable and
		// sends no reasoning_effort at all.
		thinkingLevelMap: {
			minimal: null,
			low: "low",
			medium: "medium",
			high: "high",
		},
		input: ["text"],
		cost: FREE_COST,
		contextWindow: 128000,
		maxTokens: 8000,
		compat: { ...SARASHINA_COMPAT, supportsReasoningEffort: true },
	},
	{
		id: "sarashina3-mini",
		name: "Sarashina 3 mini",
		reasoning: false,
		input: ["text"],
		cost: FREE_COST,
		contextWindow: 128000,
		maxTokens: 8000,
		compat: { ...SARASHINA_COMPAT, supportsReasoningEffort: false },
	},
	{
		id: "sarashina3-nano",
		name: "Sarashina 3 nano",
		reasoning: false,
		input: ["text"],
		cost: FREE_COST,
		contextWindow: 128000,
		maxTokens: 8000,
		compat: { ...SARASHINA_COMPAT, supportsReasoningEffort: false },
	},
	{
		// Moderation model: returns e.g. "安全" or a harmful-category verdict.
		// No tools, no thinking.
		id: "sarashina3-guard",
		name: "Sarashina 3 guard",
		reasoning: false,
		input: ["text"],
		cost: FREE_COST,
		contextWindow: 64000,
		maxTokens: 8000,
		compat: { ...SARASHINA_COMPAT, supportsReasoningEffort: false },
	},
];

export default function (pi: ExtensionAPI) {
	pi.registerProvider("sarashina", {
		name: "Sarashina",
		// SARASHINA_BASE_URL can point at a local logging proxy for tracing;
		// unset it talks to the real endpoint.
		baseUrl: process.env.SARASHINA_BASE_URL ?? "https://api.sarashina.ai/v1",
		// Resolved per request from process.env only - pi does not read .env files.
		apiKey: "$SARASHINA_API_KEY",
		authHeader: true, // Authorization: Bearer <key>
		api: "openai-completions",
		models: MODELS,
		// Invoked because model.api matches the provider's api value; delegates
		// to the stock openai-completions stream with sarashina-scoped retry.
		streamSimple: streamSarashina,
	});

	// The thinking model's `reasoning` is an opaque encrypted blob; rendering it
	// as "thinking" text is unreadable. The transformer below swaps the displayed
	// markdown for a placeholder — display-only, the stored thinking content is
	// untouched so replay still sends the base64 verbatim. While a sarashina
	// model is selected we also relabel collapsed thinking blocks, restoring
	// pi's default when another provider's model is selected.
	let sarashinaActive = false;
	const applyThinkingUI = (active: boolean, ctx: ExtensionContext) => {
		sarashinaActive = active;
		if (active) {
			ctx.ui.setHiddenThinkingLabel("(encrypted reasoning)");
		} else {
			ctx.ui.setHiddenThinkingLabel();
		}
	};
	pi.on("session_start", (_event, ctx) => applyThinkingUI(ctx.model?.provider === "sarashina", ctx));
	pi.on("model_select", (event, ctx) => applyThinkingUI(event.model.provider === "sarashina", ctx));

	// Base64 blob heuristic: long, base64-charset-only thinking markdown.
	// Keeps a hypothetical future plaintext-reasoning sarashina model readable.
	const ENCRYPTED_REASONING_MD = /^[A-Za-z0-9+/=\s]+$/;
	pi.registerMarkdownTransformer((markdown, { messageType }) => {
		if (messageType !== "assistant-thinking" || !sarashinaActive) return markdown;
		const text = markdown.trim();
		if (text.length < 64 || !ENCRYPTED_REASONING_MD.test(text)) return markdown;
		return "*(encrypted reasoning — replayed verbatim on subsequent turns)*";
	});
}
