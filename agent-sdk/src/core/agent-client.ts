import type {
  ActorRole,
  AgentAction,
  PageContext,
  SseEventPayload,
  UiCard,
} from "./contracts";

export interface AgentClientConfig {
  readonly baseUrl: string;
  readonly tenantId: string;
  readonly actorRole?: ActorRole;
  readonly actorUserId?: string;
}

export interface CreateSessionResponse {
  readonly sessionId: string;
  readonly tenantId: string;
  readonly actorRole: ActorRole;
  readonly expiresAt: string;
}

export interface TurnResult {
  readonly messageId: string;
  readonly message: string;
  readonly cards: readonly UiCard[];
  readonly actions: readonly AgentAction[];
  readonly provider: string;
  readonly latencyMs: number;
}

export class AgentClient {
  constructor(private readonly config: AgentClientConfig) {}

  async createSession(): Promise<CreateSessionResponse> {
    const res = await fetch(`${this.config.baseUrl}/v1/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: this.config.tenantId,
        actorRole: this.config.actorRole ?? "guest",
        actorUserId: this.config.actorUserId,
      }),
    });

    if (!res.ok) {
      throw new Error(`Không thể khởi tạo phiên AI Agent (HTTP ${res.status})`);
    }
    return (await res.json()) as CreateSessionResponse;
  }

  async sendMessageStream(params: {
    sessionId: string;
    message: string;
    context?: PageContext;
    onEvent: (evt: SseEventPayload) => void;
  }): Promise<void> {
    const res = await fetch(
      `${this.config.baseUrl}/v1/sessions/${params.sessionId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          message: params.message,
          context: params.context,
        }),
      }
    );

    if (!res.ok || !res.body) {
      throw new Error(`Agent API tạm gián đoạn (HTTP ${res.status})`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        const dataLine = frame
          .split("\n")
          .find((line) => line.startsWith("data:"));
        if (!dataLine) continue;
        const jsonStr = dataLine.slice(5).trim();
        if (!jsonStr) continue;
        try {
          const parsed = JSON.parse(jsonStr) as SseEventPayload;
          params.onEvent(parsed);
        } catch {
          // Ignore malformed chunk
        }
      }
    }
  }
}

