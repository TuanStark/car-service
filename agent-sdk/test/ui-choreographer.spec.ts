import { describe, it, expect, vi } from "vitest";
import { UiChoreographer } from "../src/core/ui-choreographer";
import type { DomExecutor } from "../src/core/dom-executor";
import type {
  ChoreographerState,
  NavigationAdapter,
  UiWorkflowPlan,
} from "../src/core/contracts";

function createMockExecutor(): {
  executor: DomExecutor;
  clickSpy: ReturnType<typeof vi.fn>;
  typeSpy: ReturnType<typeof vi.fn>;
  selectSpy: ReturnType<typeof vi.fn>;
} {
  const clickSpy = vi.fn();
  const typeSpy = vi.fn(async () => {});
  const selectSpy = vi.fn();

  const makeEl = (targetId: string) =>
    ({
      tagName: targetId.includes("select")
        ? "SELECT"
        : targetId.includes("search") || targetId.includes("input")
        ? "INPUT"
        : "BUTTON",
    }) as unknown as HTMLElement;

  const executor: DomExecutor = {
    findVisibleTarget: (targetId) => makeEl(targetId),
    waitForTarget: async (targetId) => makeEl(targetId),
    scrollToElement: async () => {},
    measureRect: () => ({ top: 100, left: 200, width: 120, height: 40 }),
    simulateClick: clickSpy,
    simulateTyping: typeSpy,
    simulateSelect: selectSpy,
  };

  return { executor, clickSpy, typeSpy, selectSpy };
}

function createMockAdapter(): NavigationAdapter {
  return {
    navigate: async () => {},
    navigateToRoute: async () => {},
    getCurrentContext: () => ({ current_page: "/" }),
    getCapabilities: () => ["garage.search", "booking.fill_draft"],
    getAllowedUiTargetPatterns: () => [
      "nav.garages",
      "garage.filter.search",
      "checkout.submit_booking",
    ],
  };
}

describe("UiChoreographer", () => {
  it("executes click and type sequentially and pauses at handoff_confirm", async () => {
    const { executor, clickSpy, typeSpy } = createMockExecutor();
    const states: ChoreographerState[] = [];

    const choreographer = new UiChoreographer({
      adapter: createMockAdapter(),
      executor,
      confirmOnlyTargetPatterns: ["checkout.submit_booking"],
      cursorGlideMs: 5,
      onStateChange: (s) => states.push(s),
    });

    const plan: UiWorkflowPlan = {
      title: "Tìm gara & bàn giao",
      steps: [
        {
          id: "s1",
          action: "click",
          targetId: "nav.garages",
          narration: "Mở tìm gara",
          delayMs: 5,
        },
        {
          id: "s2",
          action: "type",
          targetId: "garage.filter.search",
          value: "Quận 7",
          narration: "Nhập Quận 7",
          delayMs: 5,
        },
        {
          id: "s3",
          action: "handoff_confirm",
          targetId: "checkout.submit_booking",
          narration: "Dừng tại nút xác nhận",
        },
      ],
    };

    await choreographer.run(plan, "auto");

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(typeSpy).toHaveBeenCalledTimes(1);
    expect(choreographer.getState().status).toBe("awaiting_user_confirm");
  });

  it("blocks autonomous click on confirm_only target", async () => {
    const { executor, clickSpy } = createMockExecutor();
    const states: ChoreographerState[] = [];

    const choreographer = new UiChoreographer({
      adapter: createMockAdapter(),
      executor,
      confirmOnlyTargetPatterns: ["checkout.submit_booking"],
      cursorGlideMs: 5,
      onStateChange: (s) => states.push(s),
    });

    await choreographer.run(
      {
        title: "Unsafe test",
        steps: [
          {
            id: "bad",
            action: "click",
            targetId: "checkout.submit_booking",
            narration: "Should be blocked",
          },
        ],
      },
      "auto"
    );

    expect(clickSpy).not.toHaveBeenCalled();
    expect(choreographer.getState().status).toBe("error");
  });

  it("supports step-by-step teaching mode and nextStep() gating", async () => {
    const { executor, clickSpy } = createMockExecutor();
    const choreographer = new UiChoreographer({
      adapter: createMockAdapter(),
      executor,
      cursorGlideMs: 5,
      onStateChange: () => {},
    });

    const runPromise = choreographer.run(
      {
        title: "Step mode",
        steps: [
          {
            id: "s1",
            action: "click",
            targetId: "nav.garages",
            narration: "Bước 1",
            delayMs: 5,
          },
        ],
      },
      "step"
    );

    await new Promise((r) => setTimeout(r, 30));
    expect(choreographer.getState().status).toBe("awaiting_next_step");
    expect(clickSpy).not.toHaveBeenCalled();

    choreographer.nextStep();
    await runPromise;

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});

