import { describe, it, expect, vi } from "vitest";
import { ActionDispatcher } from "../src/core/action-dispatcher";
import type { NavigationAdapter } from "../src/core/contracts";

describe("ActionDispatcher", () => {
  it("executes allowed actions advertised by Host Website capabilities", async () => {
    const navigateSpy = vi.fn(async () => {});
    const adapter: NavigationAdapter = {
      navigate: navigateSpy,
      getCurrentContext: () => ({ current_page: "/" }),
      getCapabilities: () => ["garage.search", "booking.fill_draft"],
    };

    const dispatcher = new ActionDispatcher(adapter);
    const res = await dispatcher.dispatch({
      type: "navigate",
      target: "garage.search",
      label: "Tìm gara Quận 7",
      params: { city: "hcm", q: "Quận 7" },
    });

    expect(res.executed).toBe(true);
    expect(navigateSpy).toHaveBeenCalledTimes(1);
  });

  it("blocks actions not advertised in Host Website capabilities", async () => {
    const navigateSpy = vi.fn(async () => {});
    const adapter: NavigationAdapter = {
      navigate: navigateSpy,
      getCurrentContext: () => ({ current_page: "/" }),
      getCapabilities: () => ["garage.search"],
    };

    const dispatcher = new ActionDispatcher(adapter);
    const res = await dispatcher.dispatch({
      type: "prefill",
      target: "booking.fill_draft",
      label: "Điền lịch hẹn",
      requiresConfirmation: true,
      params: { garageId: "grg-1" },
    });

    expect(res.executed).toBe(false);
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});

