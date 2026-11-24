"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { AgentClient } from "../core/agent-client";
import { ActionDispatcher } from "../core/action-dispatcher";
import type {
  ActorRole,
  AgentAction,
  NavigationAdapter,
  UiCard,
} from "../core/contracts";

export interface AgentWidgetProps {
  readonly apiBaseUrl: string;
  readonly tenantId: string;
  readonly actorRole?: ActorRole;
  readonly actorUserId?: string;
  readonly navigationAdapter: NavigationAdapter;
  readonly brandTitle?: string;
  readonly quickPrompts?: readonly string[];
  readonly autoNavigate?: boolean;
}

interface ChatEntry {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly text: string;
  readonly cards?: readonly UiCard[];
  readonly actions?: readonly AgentAction[];
  readonly isError?: boolean;
}

const DEFAULT_PROMPTS = [
  "Tìm garage thay dầu uy tín Quận 7",
  "Xe Mazda CX-5 đi 20.000km cần làm gì?",
  "Đặt lịch thay dầu nhớt sáng mai",
] as const;

export function AgentWidget({
  apiBaseUrl,
  tenantId,
  actorRole = "guest",
  actorUserId,
  navigationAdapter,
  brandTitle = "Cố vấn Dịch vụ AI AUTORA",
  quickPrompts = DEFAULT_PROMPTS,
  autoNavigate = true,
}: AgentWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Xin chào! Tôi là Cố vấn Dịch vụ Số của AUTORA. Bạn cần tư vấn bảo dưỡng, tìm gara gần nhà hay chuẩn bị lịch hẹn cho xe?",
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const clientRef = useRef<AgentClient | null>(null);
  const dispatcherRef = useRef<ActionDispatcher | null>(null);

  useEffect(() => {
    clientRef.current = new AgentClient({
      baseUrl: apiBaseUrl,
      tenantId,
      actorRole,
      actorUserId,
    });
    dispatcherRef.current = new ActionDispatcher(navigationAdapter);
  }, [apiBaseUrl, tenantId, actorRole, actorUserId, navigationAdapter]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, toolStatus, isOpen]);

  const sendMessage = useCallback(
    async (textToSend: string) => {
      const trimmed = textToSend.trim();
      if (!trimmed || isLoading || !clientRef.current) return;

      const userEntryId = `u_${Date.now()}`;
      const assistantEntryId = `a_${Date.now() + 1}`;

      setMessages((prev) => [
        ...prev,
        { id: userEntryId, role: "user", text: trimmed },
      ]);
      setInput("");
      setIsLoading(true);
      setToolStatus("Đang kết nối cố vấn AI...");

      try {
        let activeSessionId = sessionId;
        if (!activeSessionId) {
          const created = await clientRef.current.createSession();
          activeSessionId = created.sessionId;
          setSessionId(activeSessionId);
        }

        const context = navigationAdapter.getCurrentContext();
        let streamedText = "";
        let streamedCards: readonly UiCard[] = [];
        let streamedActions: readonly AgentAction[] = [];

        setMessages((prev) => [
          ...prev,
          { id: assistantEntryId, role: "assistant", text: "..." },
        ]);

        await clientRef.current.sendMessageStream({
          sessionId: activeSessionId,
          message: trimmed,
          context: {
            ...context,
            capabilities: navigationAdapter.getCapabilities(),
          },
          onEvent: (evt) => {
            if (evt.type === "tool.status") {
              setToolStatus(evt.message);
            } else if (evt.type === "message.delta") {
              streamedText = evt.delta;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantEntryId ? { ...m, text: streamedText } : m
                )
              );
            } else if (evt.type === "ui.cards") {
              streamedCards = evt.cards;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantEntryId ? { ...m, cards: streamedCards } : m
                )
              );
            } else if (evt.type === "action.proposed") {
              streamedActions = evt.actions;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantEntryId
                    ? { ...m, actions: streamedActions }
                    : m
                )
              );
              if (autoNavigate && dispatcherRef.current) {
                const safeAutoAction = streamedActions.find(
                  (act) => !act.requiresConfirmation
                );
                if (safeAutoAction) {
                  void dispatcherRef.current.dispatch(safeAutoAction);
                }
              }
            }
          },
        });
      } catch {
        setMessages((prev) => {
          const withoutPlaceholder = prev.filter(
            (m) => m.id !== assistantEntryId
          );
          return [
            ...withoutPlaceholder,
            {
              id: `err_${Date.now()}`,
              role: "assistant",
              isError: true,
              text: "Trợ lý AI hiện đang tạm ngoại tuyến. Bạn vẫn có thể sử dụng thanh tìm kiếm, bộ lọc gara và đặt lịch trực tiếp trên website bình thường.",
            },
          ];
        });
      } finally {
        setIsLoading(false);
        setToolStatus(null);
      }
    },
    [isLoading, sessionId, navigationAdapter, autoNavigate]
  );

  // Listen for external trigger events from Homepage Advisor Bar
  useEffect(() => {
    const handler = (event: Event) => {
      const customEvt = event as CustomEvent<{ prompt?: string }>;
      setIsOpen(true);
      if (customEvt.detail?.prompt) {
        void sendMessage(customEvt.detail.prompt);
      }
    };
    window.addEventListener("autora-agent:ask", handler);
    return () => window.removeEventListener("autora-agent:ask", handler);
  }, [sendMessage]);

  const handleActionClick = async (action: AgentAction) => {
    if (!dispatcherRef.current) return;
    await dispatcherRef.current.dispatch(action);
  };

  return (
    <>
      {/* Floating Launcher Button (Respects Mobile Bottom Dock) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Mở Cố vấn Dịch vụ AI"
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 flex items-center gap-2.5 rounded-full bg-[#0056B3] pl-2.5 pr-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xl ring-1 ring-white/20 hover:bg-[#004494] transition-all cursor-pointer"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-amber-300">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3Z" />
            </svg>
          </span>
          <span>Cố vấn AI</span>
        </button>
      )}

      {/* Chat Drawer Panel */}
      {isOpen && (
        <aside
          aria-label={brandTitle}
          className="fixed bottom-20 right-3 left-3 sm:left-auto sm:right-6 lg:bottom-6 z-50 flex h-[540px] max-h-[78dvh] sm:w-[410px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl ring-1 ring-slate-900/5"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-[#0056B3] px-4 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-amber-300">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3Z" />
                </svg>
              </span>
              <div>
                <strong className="block text-sm font-semibold leading-tight">
                  {brandTitle}
                </strong>
                <span className="block text-[11px] text-blue-100 mt-0.5">
                  Tư vấn • Tìm gara • Đặt lịch
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Thu gọn trợ lý"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/85 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {/* Message Feed */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto space-y-3 bg-slate-50 p-4"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={
                  msg.role === "user"
                    ? "flex justify-end"
                    : "flex flex-col items-start gap-2"
                }
              >
                <div
                  className={
                    msg.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-[#0056B3] px-3.5 py-2.5 text-xs sm:text-sm text-white shadow-xs leading-relaxed"
                      : msg.isError
                      ? "max-w-[92%] rounded-2xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs text-slate-800 leading-relaxed"
                      : "max-w-[92%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 shadow-xs leading-relaxed"
                  }
                >
                  {msg.text}
                </div>

                {/* UI Cards rendered by Agent */}
                {msg.cards && msg.cards.length > 0 && (
                  <div className="w-full space-y-2">
                    {msg.cards.map((card) => (
                      <div
                        key={card.id}
                        className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0056B3]">
                              {card.kind === "garage" ? "Gara" : "Gói dịch vụ"}
                            </span>
                            <strong className="block text-xs sm:text-sm font-semibold text-slate-900 mt-0.5">
                              {card.title}
                            </strong>
                            <span className="block text-[11px] text-slate-500 mt-0.5">
                              {card.subtitle}
                            </span>
                          </div>
                          {card.priceLabel && (
                            <strong className="shrink-0 text-xs font-bold text-[#E85A24] tabular-nums">
                              {card.priceLabel}
                            </strong>
                          )}
                        </div>
                        {card.action && (
                          <button
                            type="button"
                            onClick={() => void handleActionClick(card.action!)}
                            className="mt-2.5 w-full rounded-lg bg-slate-100 py-2 text-[11px] font-semibold text-[#0056B3] hover:bg-[#EBF4FF] transition-colors cursor-pointer"
                          >
                            {card.action.label} →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Navigation / Prefill Actions */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.actions.map((act, idx) => (
                      <button
                        key={`${act.target}-${idx}`}
                        type="button"
                        onClick={() => void handleActionClick(act)}
                        className={
                          act.requiresConfirmation
                            ? "rounded-xl bg-[#E85A24] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#D04917] transition-colors cursor-pointer"
                            : "rounded-xl border border-[#0056B3]/25 bg-[#EBF4FF] px-3 py-1.5 text-xs font-semibold text-[#0056B3] hover:bg-[#0056B3] hover:text-white transition-colors cursor-pointer"
                        }
                      >
                        {act.label} ↗
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {toolStatus && (
              <div className="text-[11px] font-medium text-[#0056B3] animate-pulse">
                {toolStatus}
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          {messages.length <= 2 && (
            <div className="flex gap-1.5 overflow-x-auto border-t border-slate-100 bg-white px-3 py-2.5">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => void sendMessage(p)}
                  className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700 hover:border-[#0056B3] hover:text-[#0056B3] transition-colors cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
            className="flex items-center gap-2 border-t border-slate-200 bg-white p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi về bảo dưỡng, giá hoặc tìm gara..."
              disabled={isLoading}
              className="h-10 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0056B3] focus:bg-white focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Gửi tin nhắn"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0056B3] text-white hover:bg-[#004494] disabled:opacity-50 transition-colors cursor-pointer"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </form>
        </aside>
      )}
    </>
  );
}

