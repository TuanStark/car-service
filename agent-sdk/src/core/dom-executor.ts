const TARGET_ID_REGEX = /^[a-zA-Z0-9._:-]+$/;

export function matchTargetPattern(pattern: string, targetId: string): boolean {
  if (!TARGET_ID_REGEX.test(targetId)) {
    return false;
  }
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, "[a-zA-Z0-9_:-]+");
  return new RegExp(`^${escaped}$`).test(targetId);
}

export function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function escapeAttrValue(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/(["\\])/g, "\\$1");
}

function isElementVisible(el: HTMLElement): boolean {
  if (typeof window === "undefined") return false;
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/**
 * Sets value on a React-controlled HTMLInputElement / HTMLTextAreaElement / HTMLSelectElement
 * using the native prototype setter so React's internal value tracker detects the change.
 */
export function setReactControlledValue(
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string
): void {
  const proto =
    el instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;

  const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
  if (descriptor?.set) {
    descriptor.set.call(el, value);
  } else {
    el.value = value;
  }

  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

export interface DomExecutor {
  findVisibleTarget(targetId: string): HTMLElement | null;
  waitForTarget(
    targetId: string,
    timeoutMs?: number,
    signal?: AbortSignal
  ): Promise<HTMLElement | null>;
  scrollToElement(el: HTMLElement, signal?: AbortSignal): Promise<void>;
  measureRect(el: HTMLElement): {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  simulateClick(el: HTMLElement): void;
  simulateTyping(
    el: HTMLInputElement | HTMLTextAreaElement,
    text: string,
    signal?: AbortSignal
  ): Promise<void>;
  simulateSelect(el: HTMLSelectElement, value: string): void;
}

export class BrowserDomExecutor implements DomExecutor {
  findVisibleTarget(targetId: string): HTMLElement | null {
    if (typeof document === "undefined") return null;
    const selector = `[data-agent-target="${escapeAttrValue(targetId)}"]`;
    const candidates = Array.from(document.querySelectorAll<HTMLElement>(selector));
    return candidates.find(isElementVisible) ?? null;
  }

  async waitForTarget(
    targetId: string,
    timeoutMs = 4500,
    signal?: AbortSignal
  ): Promise<HTMLElement | null> {
    if (typeof document === "undefined") return null;
    const immediate = this.findVisibleTarget(targetId);
    if (immediate) return immediate;

    return new Promise((resolve) => {
      if (signal?.aborted) {
        resolve(null);
        return;
      }

      let settled = false;
      let observer: MutationObserver | null = null;
      let intervalId: ReturnType<typeof setInterval> | null = null;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const finish = (found: HTMLElement | null) => {
        if (settled) return;
        settled = true;
        observer?.disconnect();
        if (intervalId) clearInterval(intervalId);
        if (timeoutId) clearTimeout(timeoutId);
        signal?.removeEventListener("abort", onAbort);
        resolve(found);
      };

      const check = () => {
        const el = this.findVisibleTarget(targetId);
        if (el) finish(el);
      };

      const onAbort = () => finish(null);

      signal?.addEventListener("abort", onAbort, { once: true });
      if (typeof MutationObserver !== "undefined" && document.body) {
        observer = new MutationObserver(check);
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
        });
      }
      intervalId = setInterval(check, 120);
      timeoutId = setTimeout(() => finish(null), timeoutMs);
    });
  }

  async scrollToElement(el: HTMLElement, signal?: AbortSignal): Promise<void> {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (typeof el.scrollIntoView === "function") {
      el.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "center",
        inline: "nearest",
      });
    }
    await abortableSleep(prefersReducedMotion ? 50 : 320, signal);
  }

  measureRect(el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
  }

  simulateClick(el: HTMLElement): void {
    el.focus({ preventScroll: true });
    el.click();
  }

  async simulateTyping(
    el: HTMLInputElement | HTMLTextAreaElement,
    text: string,
    signal?: AbortSignal
  ): Promise<void> {
    el.focus({ preventScroll: true });

    // Date inputs require full YYYY-MM-DD value rather than incremental characters
    if (el instanceof HTMLInputElement && el.type === "date") {
      setReactControlledValue(el, text);
      return;
    }

    setReactControlledValue(el, "");
    let current = "";
    for (const ch of text) {
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      current += ch;
      setReactControlledValue(el, current);
      await abortableSleep(38, signal);
    }
  }

  simulateSelect(el: HTMLSelectElement, value: string): void {
    el.focus({ preventScroll: true });
    setReactControlledValue(el, value);
  }
}

