import type { PageContext } from "../contracts/agent.contract";

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /apiKey/i,
  /creditCard/i,
  /cccd/i,
  /cmnd/i,
];

/**
 * Strips potentially sensitive keys from any object before passing it to LLM context.
 */
export function stripSensitiveFields<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => stripSensitiveFields(item)) as unknown as T;
  }
  if (input && typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERNS.some((rx) => rx.test(key))) {
        continue;
      }
      out[key] = stripSensitiveFields(val);
    }
    return out as T;
  }
  return input;
}

/**
 * Masks Vietnamese phone numbers when surfacing logs (e.g. 0909688912 -> 0909***912).
 */
export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\s+/g, "");
  if (digits.length < 7) return "***";
  return `${digits.slice(0, 4)}***${digits.slice(-3)}`;
}

/**
 * Wraps untrusted user/host context so the LLM treats it strictly as data,
 * mitigating prompt injection attempts embedded in page URLs or vehicle strings.
 */
export function formatUntrustedContextBlock(context?: PageContext): string {
  if (!context) return "<untrusted_host_context>{}</untrusted_host_context>";
  const safePayload = {
    current_page: context.current_page,
    city: context.city,
    vehicle: context.vehicle,
    capabilities: context.capabilities,
  };
  return `<untrusted_host_context>\n${JSON.stringify(safePayload)}\n</untrusted_host_context>`;
}

