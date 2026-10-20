// Metadata only: never send prompts, responses, audio, or provider errors to this ledger.
const INSERT_TIMEOUT_MS = 1500;

export function usageFromAnthropic(response) {
  const usage = response?.usage;
  return {
    input_tokens: usage?.input_tokens ?? null,
    output_tokens: usage?.output_tokens ?? null,
    // Anthropic's output total can include thinking; do not infer a separate count.
    thinking_tokens: usage?.thinking_tokens ?? usage?.output_tokens_details?.thinking_tokens ?? null,
  };
}

export function usageFromOpenAI(response) {
  const usage = response?.usage;
  return {
    input_tokens: usage?.input_tokens ?? usage?.prompt_tokens ?? null,
    output_tokens: usage?.output_tokens ?? usage?.completion_tokens ?? null,
    thinking_tokens: usage?.output_tokens_details?.reasoning_tokens
      ?? usage?.completion_tokens_details?.reasoning_tokens ?? usage?.reasoning_tokens ?? null,
  };
}

/** Best-effort service-role insert, bounded even if a client ignores abort. */
export async function recordAiUsage(db, row) {
  let timer;
  const controller = new AbortController();
  try {
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error('AI usage insert timed out'));
        controller.abort();
      }, INSERT_TIMEOUT_MS);
    });
    const insert = Promise.resolve().then(() => {
      // Explicit allowlist keeps personal data and content out of the table.
      const query = db.from('ai_usage').insert({
        user_id: row.user_id ?? null,
        anon: row.user_id == null,
        feature: row.feature,
        provider: row.provider ?? null,
        model: row.model ?? null,
        input_tokens: row.input_tokens ?? null,
        output_tokens: row.output_tokens ?? null,
        thinking_tokens: row.thinking_tokens ?? null,
        audio_seconds: row.audio_seconds ?? null,
        retries: row.retries ?? 0,
        failed: row.failed ?? false,
      });
      return typeof query?.abortSignal === 'function' ? query.abortSignal(controller.signal) : query;
    });
    const result = await Promise.race([insert, timeout]);
    if (result?.error) throw new Error('AI usage insert rejected');
  } catch {
    // Fixed single line: database errors can contain row values or credentials.
    console.error('[ai-usage] insert failed or timed out');
  } finally {
    clearTimeout(timer);
  }
}
