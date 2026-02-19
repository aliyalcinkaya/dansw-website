const REQUEST_TIMEOUT_MS = 10_000;

export type FormForwardKind = 'general' | 'speaker' | 'member' | 'sponsor' | 'job';

interface FormForwardResult {
  ok: boolean;
  skipped?: boolean;
  message?: string;
}

function toTrimmed(value: string | undefined | null) {
  return value?.trim() ?? '';
}

function getForwarderConfig() {
  const supabaseUrl = toTrimmed(import.meta.env.VITE_SUPABASE_URL).replace(/\/$/, '');
  const anonKey = toTrimmed(import.meta.env.VITE_SUPABASE_ANON_KEY);
  const functionName = toTrimmed(import.meta.env.VITE_SUPABASE_FORM_FORWARDER_FUNCTION) || 'form-forwarder';
  const functionUrlOverride = toTrimmed(import.meta.env.VITE_SUPABASE_FORM_FORWARDER_FUNCTION_URL);

  if (!supabaseUrl || !anonKey) {
    return null;
  }

  const endpoint = functionUrlOverride || `${supabaseUrl}/functions/v1/${encodeURIComponent(functionName)}`;

  return {
    endpoint,
    anonKey,
  };
}

export async function forwardFormByEmail(
  formKind: FormForwardKind,
  submission: Record<string, unknown>
): Promise<FormForwardResult> {
  const config = getForwarderConfig();
  if (!config) {
    return {
      ok: false,
      message: 'Supabase configuration is missing.',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
      body: JSON.stringify({
        form_kind: formKind,
        submission,
      }),
      signal: controller.signal,
    });

    let payload: { ok?: unknown; skipped?: unknown; message?: unknown } | null = null;
    const responseText = await response.text();

    if (responseText) {
      try {
        payload = JSON.parse(responseText) as { ok?: unknown; skipped?: unknown; message?: unknown };
      } catch {
        payload = null;
      }
    }

    if (!response.ok || payload?.ok === false) {
      return {
        ok: false,
        message:
          typeof payload?.message === 'string' && payload.message.trim()
            ? payload.message
            : `Form forwarding failed with status ${response.status}.`,
      };
    }

    return {
      ok: true,
      skipped: Boolean(payload?.skipped),
      message: typeof payload?.message === 'string' ? payload.message : undefined,
    };
  } catch (error) {
    const timeoutError = error instanceof DOMException && error.name === 'AbortError';
    return {
      ok: false,
      message: timeoutError ? 'Form forwarding timed out.' : 'Form forwarding network request failed.',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
