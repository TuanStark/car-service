import type {
  ChoreographerState,
  NavigationAdapter,
  UiWorkflowPlan,
  UiWorkflowStep,
  WorkflowExecutionMode,
} from "./contracts";
import {
  abortableSleep,
  BrowserDomExecutor,
  type DomExecutor,
  matchTargetPattern,
} from "./dom-executor";

export interface UiChoreographerConfig {
  readonly adapter: NavigationAdapter;
  readonly executor?: DomExecutor;
  readonly allowedTargetPatterns?: readonly string[];
  readonly confirmOnlyTargetPatterns?: readonly string[];
  readonly onStateChange: (state: ChoreographerState) => void;
  readonly cursorGlideMs?: number;
}

const INITIAL_STATE: ChoreographerState = {
  status: "idle",
  mode: "auto",
  plan: null,
  currentStepIndex: -1,
  currentStep: null,
  cursorPos: null,
  spotlightRect: null,
  isClicking: false,
};

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}

/**
 * Orchestrates visual, step-by-step Co-Browsing execution over semantic DOM targets,
 * supporting pause/resume, teaching step-by-step mode, and strict confirm_only blocking.
 */
export class UiChoreographer {
  private readonly executor: DomExecutor;
  private readonly cursorGlideMs: number;
  private state: ChoreographerState = INITIAL_STATE;
  private abortController: AbortController | null = null;
  private stepGateResolve: (() => void) | null = null;
  private resumeGateResolve: (() => void) | null = null;

  constructor(private config: UiChoreographerConfig) {
    this.executor = config.executor ?? new BrowserDomExecutor();
    this.cursorGlideMs = config.cursorGlideMs ?? 420;
  }

  updateConfig(config: UiChoreographerConfig): void {
    this.config = config;
  }

  getState(): ChoreographerState {
    return this.state;
  }

  private emit(patch: Partial<ChoreographerState>): void {
    this.state = { ...this.state, ...patch };
    this.config.onStateChange(this.state);
  }

  private isAllowedTarget(targetId: string): boolean {
    const patterns =
      this.config.allowedTargetPatterns ??
      this.config.adapter.getAllowedUiTargetPatterns?.() ??
      [];
    if (patterns.length === 0) return true;
    return patterns.some((p) => matchTargetPattern(p, targetId));
  }

  private isConfirmOnlyTarget(targetId: string): boolean {
    const patterns = this.config.confirmOnlyTargetPatterns ?? [];
    return patterns.some((p) => matchTargetPattern(p, targetId));
  }

  private waitForGate(
    gateKind: "pause" | "step",
    signal: AbortSignal
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      const onAbort = () => {
        if (gateKind === "pause") this.resumeGateResolve = null;
        else this.stepGateResolve = null;
        reject(new DOMException("Aborted", "AbortError"));
      };
      const done = () => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      };
      signal.addEventListener("abort", onAbort, { once: true });
      if (gateKind === "pause") {
        this.resumeGateResolve = done;
      } else {
        this.stepGateResolve = done;
      }
    });
  }

  pause(): void {
    if (this.state.status === "running") {
      this.emit({ status: "paused" });
    }
  }

  resume(): void {
    if (this.state.status === "paused") {
      this.emit({ status: "running" });
      this.resumeGateResolve?.();
      this.resumeGateResolve = null;
    }
  }

  nextStep(): void {
    if (this.state.status === "awaiting_next_step") {
      this.emit({ status: "running" });
      this.stepGateResolve?.();
      this.stepGateResolve = null;
    }
  }

  setMode(mode: WorkflowExecutionMode): void {
    this.emit({ mode });
    if (mode === "auto" && this.state.status === "awaiting_next_step") {
      this.nextStep();
    }
  }

  stop(): void {
    this.abortController?.abort();
    this.abortController = null;
    this.resumeGateResolve = null;
    this.stepGateResolve = null;
    this.emit({
      ...INITIAL_STATE,
      mode: this.state.mode,
      status: "idle",
    });
  }

  private async ensureTargetElement(
    step: UiWorkflowStep,
    signal: AbortSignal
  ): Promise<HTMLElement | null> {
    let el = await this.executor.waitForTarget(step.targetId, 3200, signal);
    if (!el && step.fallbackRoute && this.config.adapter.navigateToRoute) {
      await this.config.adapter.navigateToRoute(step.fallbackRoute);
      el = await this.executor.waitForTarget(step.targetId, 4500, signal);
    }
    return el;
  }

  async run(
    plan: UiWorkflowPlan,
    mode: WorkflowExecutionMode = "auto"
  ): Promise<void> {
    this.stop();
    const controller = new AbortController();
    this.abortController = controller;
    const { signal } = controller;

    this.emit({
      status: "running",
      mode,
      plan,
      currentStepIndex: 0,
      currentStep: plan.steps[0] ?? null,
      cursorPos: null,
      spotlightRect: null,
      isClicking: false,
      errorMessage: undefined,
    });

    try {
      for (let i = 0; i < plan.steps.length; i++) {
        if (signal.aborted) break;

        if (this.state.status === "paused") {
          await this.waitForGate("pause", signal);
        }

        const step = plan.steps[i];
        this.emit({
          currentStepIndex: i,
          currentStep: step,
        });

        if (!this.isAllowedTarget(step.targetId)) {
          throw new Error(
            `Blocked disallowed UI target "${step.targetId}".`
          );
        }

        const mutatesTarget =
          step.action === "click" ||
          step.action === "type" ||
          step.action === "select";
        if (this.isConfirmOnlyTarget(step.targetId) && mutatesTarget) {
          throw new Error(
            `Blocked autonomous "${step.action}" on confirm-only target "${step.targetId}".`
          );
        }

        const el = await this.ensureTargetElement(step, signal);
        if (!el) {
          // If step navigated to fallbackRoute on its own (e.g. missing DOM trigger), continue safely
          if (step.fallbackRoute && this.config.adapter.navigateToRoute) {
            await this.config.adapter.navigateToRoute(step.fallbackRoute);
            await abortableSleep(350, signal);
            continue;
          }
          throw new Error(
            `Không tìm thấy phần tử giao diện "${step.targetId}".`
          );
        }

        await this.executor.scrollToElement(el, signal);
        const rect = this.executor.measureRect(el);
        this.emit({
          spotlightRect: rect,
          cursorPos: {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          },
        });

        await abortableSleep(this.cursorGlideMs, signal);

        if (this.state.status === "paused") {
          await this.waitForGate("pause", signal);
        }

        if (
          this.state.mode === "step" &&
          step.action !== "handoff_confirm"
        ) {
          this.emit({ status: "awaiting_next_step" });
          await this.waitForGate("step", signal);
        }

        if (step.action === "handoff_confirm") {
          this.emit({ status: "awaiting_user_confirm" });
          return;
        }

        if (step.action === "click") {
          this.emit({ isClicking: true });
          await abortableSleep(180, signal);
          this.executor.simulateClick(el);
          this.emit({ isClicking: false });
          await abortableSleep(step.delayMs ?? 550, signal);
        } else if (step.action === "type") {
          const isTextInput =
            typeof HTMLInputElement !== "undefined"
              ? el instanceof HTMLInputElement ||
                el instanceof HTMLTextAreaElement
              : el.tagName === "INPUT" || el.tagName === "TEXTAREA";
          if (isTextInput) {
            await this.executor.simulateTyping(
              el as HTMLInputElement | HTMLTextAreaElement,
              step.value ?? "",
              signal
            );
          }
          await abortableSleep(step.delayMs ?? 450, signal);
        } else if (step.action === "select") {
          const isSelectEl =
            typeof HTMLSelectElement !== "undefined"
              ? el instanceof HTMLSelectElement
              : el.tagName === "SELECT";
          if (isSelectEl) {
            this.executor.simulateSelect(
              el as HTMLSelectElement,
              step.value ?? ""
            );
          }
          await abortableSleep(step.delayMs ?? 500, signal);
        } else if (step.action === "highlight") {
          await abortableSleep(step.delayMs ?? 850, signal);
        } else if (step.action === "wait_route") {
          await abortableSleep(step.delayMs ?? 400, signal);
        }
      }

      if (!signal.aborted) {
        this.emit({ status: "completed", isClicking: false });
        await abortableSleep(1200, signal);
        if (!signal.aborted && this.state.status === "completed") {
          this.stop();
        }
      }
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }
      this.emit({
        status: "error",
        isClicking: false,
        errorMessage:
          err instanceof Error ? err.message : "Không thể hoàn tất thao tác UI.",
      });
    }
  }
}
