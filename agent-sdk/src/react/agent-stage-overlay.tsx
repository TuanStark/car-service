"use client";

import React, { useEffect, useState } from "react";
import type {
  ChoreographerState,
  WorkflowExecutionMode,
} from "../core/contracts";

export interface AgentStageOverlayProps {
  readonly state: ChoreographerState;
  readonly onPause: () => void;
  readonly onResume: () => void;
  readonly onNextStep: () => void;
  readonly onModeChange: (mode: WorkflowExecutionMode) => void;
  readonly onStop: () => void;
}

export function AgentStageOverlay({
  state,
  onPause,
  onResume,
  onNextStep,
  onModeChange,
  onStop,
}: AgentStageOverlayProps) {
  const [viewport, setViewport] = useState({ width: 1280, height: 800 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (state.status === "idle" || typeof window === "undefined") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onStop();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.status, onStop]);

  if (state.status === "idle" || !state.plan) {
    return null;
  }

  const totalSteps = state.plan.steps.length;
  const stepNumber = Math.min(state.currentStepIndex + 1, totalSteps);
  const isConfirmHandoff = state.status === "awaiting_user_confirm";
  const ringColorClass = isConfirmHandoff
    ? "border-[#E85A24] bg-[#E85A24]/10 shadow-[0_0_0_4px_rgba(232,90,36,0.22)]"
    : "border-[#0056B3] bg-[#0056B3]/5 shadow-[0_0_0_4px_rgba(0,86,179,0.2)]";

  const rect = state.spotlightRect;
  const tooltipWidth = Math.min(340, Math.max(240, viewport.width - 24));
  const showAbove = rect ? rect.top > 160 : false;
  const tooltipTop = rect
    ? showAbove
      ? Math.max(12, rect.top - 96)
      : Math.min(viewport.height - 150, rect.top + rect.height + 14)
    : 20;
  const tooltipLeft = rect
    ? Math.min(
        Math.max(12, rect.left + rect.width / 2 - tooltipWidth / 2),
        Math.max(12, viewport.width - tooltipWidth - 12)
      )
    : 12;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-0 z-[60]"
    >
      {/* Spotlight Target Ring */}
      {rect && (
        <div
          className={`fixed rounded-xl border-2 transition-all duration-300 ${ringColorClass} ${
            isConfirmHandoff ? "animate-pulse" : ""
          }`}
          style={{
            top: Math.max(4, rect.top - 6),
            left: Math.max(4, rect.left - 6),
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      )}

      {/* Step Narration Tooltip */}
      {rect && state.currentStep && (
        <div
          className="fixed rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-slate-900 shadow-2xl backdrop-blur-md transition-all duration-300"
          style={{
            top: tooltipTop,
            left: tooltipLeft,
            width: tooltipWidth,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isConfirmHandoff
                  ? "bg-[#FFF1EB] text-[#E85A24]"
                  : "bg-[#EBF4FF] text-[#0056B3]"
              }`}
            >
              {isConfirmHandoff
                ? "Bàn giao cho bạn"
                : `Bước ${stepNumber}/${totalSteps}`}
            </span>
            <span className="text-[10px] font-medium text-slate-400">
              AI Co-Browsing
            </span>
          </div>
          <p className="mt-1.5 text-xs sm:text-sm font-semibold leading-snug text-slate-800">
            {state.currentStep.narration}
          </p>
        </div>
      )}

      {/* Animated Virtual AI Cursor */}
      {state.cursorPos && (
        <div
          className="fixed left-0 top-0 transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            transform: `translate3d(${state.cursorPos.x}px, ${state.cursorPos.y}px, 0)`,
          }}
        >
          {state.isClicking && (
            <span className="absolute -left-4 -top-4 h-8 w-8 animate-ping rounded-full bg-[#0056B3]/45" />
          )}
          <svg
            className="h-7 w-7 -translate-x-1 -translate-y-1 drop-shadow-lg"
            viewBox="0 0 24 24"
            fill={isConfirmHandoff ? "#E85A24" : "#0056B3"}
            stroke="#FFFFFF"
            strokeWidth="1.75"
            aria-hidden="true"
          >
            <path d="M4 3l7.2 17 2.6-6.2L20 11.2 4 3z" />
          </svg>
          <span
            className={`ml-4 -mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-md ${
              isConfirmHandoff ? "bg-[#E85A24]" : "bg-[#0056B3]"
            }`}
          >
            AI AUTORA
          </span>
        </div>
      )}

      {/* Human-in-the-Loop Floating Control Bar */}
      <div className="pointer-events-auto fixed bottom-20 left-1/2 z-[61] w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 lg:bottom-6">
        <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-slate-200 bg-slate-950/90 px-4 py-3 text-white shadow-2xl backdrop-blur-md">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <strong className="truncate text-xs font-semibold text-white">
                {state.plan.title}
              </strong>
              <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-blue-200">
                {stepNumber}/{totalSteps}
              </span>
            </div>
            {state.status === "error" && state.errorMessage && (
              <p className="mt-1 text-[11px] text-amber-300">
                {state.errorMessage}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Mode Switcher */}
            {state.status !== "awaiting_user_confirm" &&
              state.status !== "completed" && (
                <div className="flex items-center rounded-lg bg-white/10 p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => onModeChange("auto")}
                    className={`rounded-md px-2 py-1 font-semibold transition-colors cursor-pointer ${
                      state.mode === "auto"
                        ? "bg-[#0056B3] text-white"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    Tự chạy
                  </button>
                  <button
                    type="button"
                    onClick={() => onModeChange("step")}
                    className={`rounded-md px-2 py-1 font-semibold transition-colors cursor-pointer ${
                      state.mode === "step"
                        ? "bg-[#0056B3] text-white"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    Từng bước
                  </button>
                </div>
              )}

            {state.status === "running" && (
              <button
                type="button"
                onClick={onPause}
                className="rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/25 cursor-pointer"
              >
                Tạm dừng
              </button>
            )}

            {state.status === "paused" && (
              <button
                type="button"
                onClick={onResume}
                className="rounded-lg bg-[#0056B3] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#004494] cursor-pointer"
              >
                Tiếp tục
              </button>
            )}

            {state.status === "awaiting_next_step" && (
              <button
                type="button"
                onClick={onNextStep}
                className="rounded-lg bg-[#E85A24] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#D04917] cursor-pointer"
              >
                Bước tiếp →
              </button>
            )}

            {state.status === "awaiting_user_confirm" && (
              <span className="rounded-lg bg-[#E85A24]/20 border border-[#E85A24]/50 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                Hãy kiểm tra & tự bấm nút đang sáng
              </span>
            )}

            <button
              type="button"
              onClick={onStop}
              className="rounded-lg border border-white/20 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/15 hover:text-white cursor-pointer"
            >
              {state.status === "awaiting_user_confirm" ||
              state.status === "completed"
                ? "Đóng"
                : "Dừng (Esc)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

