import type { PageContext } from "../contracts/agent.contract";
export declare function stripSensitiveFields<T>(input: T): T;
export declare function maskPhoneNumber(phone: string): string;
export declare function formatUntrustedContextBlock(context?: PageContext): string;
