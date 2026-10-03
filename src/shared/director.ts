import { mountBrowserFrame } from "./frame";

/*
 * Drives the scripted demos: a drawn cursor that moves and clicks, and typing with a human rhythm. The rhythm comes
 * from a seeded random number generator, so every loop plays back exactly the same.
 */

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * `toLocal` converts screen coordinates to the cursor's own, for when the camera has zoomed the page (see
 * camera.ts). All coordinates passed in here are screen coordinates, like getBoundingClientRect gives.
 */
export function createDirector(cursor: HTMLElement, toLocal: (x: number, y: number) => [number, number] = (x, y) => [x, y]) {
  let random = seeded(7);

  const moveTo = (x: number, y: number) => {
    const [lx, ly] = toLocal(x, y);
    cursor.style.transform = `translate(${lx}px, ${ly}px)`;
    return sleep(750);
  };

  const caretToEnd = (textarea: HTMLTextAreaElement) => {
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  };

  return {
    /** Restarts the typing rhythm, so each loop matches the last. */
    reseed: () => (random = seeded(7)),

    moveTo,

    moveToElement(el: Element, fx = 0.5, fy = 0.5) {
      const r = el.getBoundingClientRect();
      return moveTo(r.left + r.width * fx, r.top + r.height * fy);
    },

    /** Moves the cursor without animating, e.g. to its resting point before the first loop. */
    place(x: number, y: number) {
      const [lx, ly] = toLocal(x, y);
      cursor.style.transition = "none";
      cursor.style.transform = `translate(${lx}px, ${ly}px)`;
      void cursor.offsetWidth;
      cursor.style.transition = "";
    },

    async click(action: () => void, pressed?: Element) {
      cursor.classList.add("is-pressing");
      pressed?.classList.add("is-pressed");
      await sleep(110);
      cursor.classList.remove("is-pressing");
      pressed?.classList.remove("is-pressed");
      action();
    },

    caretToEnd,

    async type(textarea: HTMLTextAreaElement, text: string) {
      for (const ch of text) {
        textarea.value += ch;
        caretToEnd(textarea);
        textarea.dispatchEvent(new Event("input"));
        // A little slower after a space, and now and then a longer pause.
        let delay = 55 + random() * 70;
        if (ch === " ") delay += 60;
        if (random() < 0.06) delay += 180;
        await sleep(delay);
      }
    },

    /** Deletes `count` characters before position `at`, one at a time, like holding backspace. */
    async eraseBefore(textarea: HTMLTextAreaElement, at: number, count: number) {
      textarea.focus();
      for (let i = 0; i < count; i++) {
        const pos = at - i;
        textarea.value = textarea.value.slice(0, pos - 1) + textarea.value.slice(pos);
        textarea.setSelectionRange(pos - 1, pos - 1);
        textarea.dispatchEvent(new Event("input"));
        await sleep(i === 0 ? 260 : 60);
      }
    },

    /** Types `text` at position `at`, leaving the caret after it. */
    async typeAt(textarea: HTMLTextAreaElement, at: number, text: string) {
      textarea.focus();
      let pos = at;
      for (const ch of text) {
        textarea.value = textarea.value.slice(0, pos) + ch + textarea.value.slice(pos);
        pos += ch.length;
        textarea.setSelectionRange(pos, pos);
        textarea.dispatchEvent(new Event("input"));
        await sleep(55 + random() * 70);
      }
    },

    async erase(textarea: HTMLTextAreaElement, count: number) {
      for (let i = 0; i < count; i++) {
        textarea.value = textarea.value.slice(0, -1);
        caretToEnd(textarea);
        textarea.dispatchEvent(new Event("input"));
        await sleep(i === 0 ? 260 : 38);
      }
    },
  };
}

/**
 * Wires up the recording controls: ?autoplay starts the script, ?clean hides the hint, ?frame draws a browser
 * window with a made-up address, P plays and R reloads.
 * `loop` plays one full loop and must leave the page as it found it.
 */
export function setUpPlayback(loop: () => Promise<void>, beforeFirstLoop: () => void, ignore?: Element) {
  let playing = false;

  const play = async () => {
    if (playing) return;
    playing = true;
    document.body.classList.add("is-playing");
    beforeFirstLoop();
    await document.fonts.ready;
    while (playing) await loop();
  };

  document.addEventListener("keydown", (event) => {
    if (ignore && event.target === ignore) return;
    if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return;
    if (event.key === "p" || event.key === "P") play();
    if (event.key === "r" || event.key === "R") location.reload();
  });

  const params = new URLSearchParams(location.search);
  if (params.has("clean")) document.body.classList.add("is-clean");
  if (params.has("frame")) mountBrowserFrame();
  if (params.has("autoplay")) play();
}
