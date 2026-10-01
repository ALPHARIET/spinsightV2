const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai';

const DEFAULTS = {
  baseUrl: GEMINI_URL,
  model: 'gemini-3.5-flash',
  geminiFallbacks: 'gemini-3.5-flash-lite,gemini-2.5-flash',
  timeoutMs: 90000,
};

const list = (s) => String(s || '').split(',').map((m) => m.trim()).filter(Boolean);

export function llmConfig(env = process.env) {
  const baseUrl = (env.LLM_BASE_URL || DEFAULTS.baseUrl).replace(/\/+$/, '');
  const gemini = baseUrl.includes('generativelanguage.googleapis.com');
  const model = env.LLM_MODEL || DEFAULTS.model;
  const fallbacks = list(env.LLM_FALLBACK_MODELS ?? (gemini ? DEFAULTS.geminiFallbacks : '')).filter((m) => m !== model);
  return {
    apiKey: env.LLM_API_KEY || env.GEMINI_API_KEY || '',
    baseUrl,
    gemini,
    model,
    models: [model, ...fallbacks],
    timeoutMs: Number(env.LLM_TIMEOUT_MS) || DEFAULTS.timeoutMs,
  };
}

export class LLMError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

export function parseJSON(text) {
  if (!text) throw new LLMError('Respons AI kosong.', 502);
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {}
    }
    throw new LLMError('Respons AI bukan JSON yang valid.', 502);
  }
}

const busy = (status) => status === 500 || status === 503;
const canFallback = (status) => status === 429 || status === 404 || busy(status);

function errorFor(status, detail, model) {
  if (status === 401 || status === 403) return new LLMError('API key ditolak oleh penyedia AI.', 502);
  if (status === 429 && /PerDay/i.test(detail)) {
    return new LLMError('Kuota harian gratis AI sudah habis. Coba lagi besok, atau pakai API key berbayar.', 429);
  }
  if (status === 429) return new LLMError('Terlalu banyak permintaan ke AI. Tunggu satu menit lalu coba lagi.', 429);
  if (busy(status)) return new LLMError('Server AI sedang sibuk. Coba lagi sebentar.', 502);
  if (status === 404) return new LLMError(`Model "${model}" tidak tersedia. Cek LLM_MODEL di .env.`, 502);
  return new LLMError(`Layanan AI error (${status}).`, 502);
}

export async function chatJSON({ system, user, temperature = 0.4, maxTokens = 4096, reasoningEffort }, env = process.env) {
  const cfg = llmConfig(env);
  if (!cfg.apiKey) throw new LLMError('LLM_API_KEY belum diatur di server.', 503);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
  const useReasoning = Boolean(reasoningEffort && cfg.gemini);
  const send = (model, reasoning = useReasoning) =>
    fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
      signal: ctrl.signal,
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        ...(reasoning ? { reasoning_effort: reasoningEffort } : {}),
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

  let res;
  try {
    for (const [i, model] of cfg.models.entries()) {
      let reasoning = useReasoning;
      res = await send(model, reasoning);
      if (res.status === 400 && reasoning) {
        await res.text().catch(() => '');
        reasoning = false;
        res = await send(model, reasoning);
      }
      if (busy(res.status)) {
        await res.text().catch(() => '');
        await new Promise((r) => setTimeout(r, 1500));
        res = await send(model, reasoning);
      }
      if (res.ok) break;
      const detail = await res.text().catch(() => '');
      console.error('[llm]', model, res.status, detail.slice(0, 300));
      const failure = errorFor(res.status, detail, model);
      if (!canFallback(res.status) || i === cfg.models.length - 1) throw failure;
      console.warn('[llm]', `${model} gagal (${res.status}), pindah ke ${cfg.models[i + 1]}`);
    }
  } catch (e) {
    if (e instanceof LLMError) throw e;
    throw new LLMError(e.name === 'AbortError' ? 'AI terlalu lama merespons.' : 'Tidak bisa menghubungi layanan AI.', 504);
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json();
  const choice = data?.choices?.[0];
  const content = choice?.message?.content;
  if (!content && choice?.finish_reason === 'length') {
    throw new LLMError('AI kehabisan token sebelum selesai menjawab. Coba lagi atau perpendek materinya.', 502);
  }
  const out = parseJSON(typeof content === 'string' ? content : content ? JSON.stringify(content) : '');
  if (!out || typeof out !== 'object') throw new LLMError('Respons AI bukan JSON yang valid.', 502);
  out._model = data?.model || cfg.model;
  return out;
}
