import { check } from "no-nepali-profanity";

export const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The spans to mark in the text, with overlapping matches (like "muji" inside "muji jasto") merged. */
export function flaggedRanges(text: string): [number, number][] {
  const ranges: [number, number][] = [];
  for (const m of check(text).matches) {
    const last = ranges[ranges.length - 1];
    if (last && m.start < last[1]) last[1] = Math.max(last[1], m.end);
    else ranges.push([m.start, m.end]);
  }
  return ranges;
}

/**
 * Keeps the highlight layer behind a textarea in sync with its text. `onChange` gets the number of flagged spans
 * after every change. Returns a function that re-renders, for when the text is set from code.
 */
export function attachHighlighter(
  textarea: HTMLTextAreaElement,
  backdrop: HTMLElement,
  onChange?: (flagged: number) => void
): () => void {
  const layer = backdrop.firstElementChild as HTMLElement;

  const render = () => {
    const text = textarea.value;
    const ranges = flaggedRanges(text);
    let html = "";
    let at = 0;
    for (const [start, end] of ranges) {
      html += escapeHtml(text.slice(at, start)) + `<mark>${escapeHtml(text.slice(start, end))}</mark>`;
      at = end;
    }
    // A trailing newline needs a character after it, or the backdrop comes out one line short.
    layer.innerHTML = html + escapeHtml(text.slice(at)) + "\n ";
    onChange?.(ranges.length);
  };

  textarea.addEventListener("input", render);
  textarea.addEventListener("scroll", () => (backdrop.scrollTop = textarea.scrollTop));
  render();
  return render;
}

const ERROR_ICON =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" /><path d="M8 4.5v4M8 11h.01" /></svg>';

export function showError(el: HTMLElement, message: string) {
  el.innerHTML = `${ERROR_ICON}<span>${escapeHtml(message)}</span>`;
  el.classList.add("is-visible");
}

export function hideError(el: HTMLElement) {
  el.classList.remove("is-visible");
}

export function shake(el: Element) {
  el.classList.remove("is-shaking");
  void (el as HTMLElement).offsetWidth; // restart the animation
  el.classList.add("is-shaking");
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function showToast(toast: HTMLElement, message: string) {
  (toast.querySelector("[data-message]") as HTMLElement).textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1900);
}

export async function withSpinner(button: HTMLButtonElement, ms: number) {
  button.classList.add("is-loading");
  button.disabled = true;
  await new Promise((resolve) => setTimeout(resolve, ms));
  button.classList.remove("is-loading");
  button.disabled = false;
}
