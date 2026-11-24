"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripSensitiveFields = stripSensitiveFields;
exports.maskPhoneNumber = maskPhoneNumber;
exports.formatUntrustedContextBlock = formatUntrustedContextBlock;
const SENSITIVE_KEY_PATTERNS = [
    /password/i,
    /secret/i,
    /token/i,
    /apiKey/i,
    /creditCard/i,
    /cccd/i,
    /cmnd/i,
];
function stripSensitiveFields(input) {
    if (Array.isArray(input)) {
        return input.map((item) => stripSensitiveFields(item));
    }
    if (input && typeof input === "object") {
        const out = {};
        for (const [key, val] of Object.entries(input)) {
            if (SENSITIVE_KEY_PATTERNS.some((rx) => rx.test(key))) {
                continue;
            }
            out[key] = stripSensitiveFields(val);
        }
        return out;
    }
    return input;
}
function maskPhoneNumber(phone) {
    const digits = phone.replace(/\s+/g, "");
    if (digits.length < 7)
        return "***";
    return `${digits.slice(0, 4)}***${digits.slice(-3)}`;
}
function formatUntrustedContextBlock(context) {
    if (!context)
        return "<untrusted_host_context>{}</untrusted_host_context>";
    const safePayload = {
        current_page: context.current_page,
        city: context.city,
        vehicle: context.vehicle,
        capabilities: context.capabilities,
    };
    return `<untrusted_host_context>\n${JSON.stringify(safePayload)}\n</untrusted_host_context>`;
}
//# sourceMappingURL=pii-sanitizer.js.map