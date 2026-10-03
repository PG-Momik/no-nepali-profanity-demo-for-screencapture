/*
 * A camera for the scripted demos: zooms the whole page (browser frame and cursor included) in on what matters, so
 * the action is readable when the recording is shown small. Everything except the toast and the hint is moved into
 * a "stage" element, which is scaled and panned with a CSS transform.
 */

export const CAMERA_MS = 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function createCamera() {
  let stage: HTMLElement | undefined;

  const matrix = () => {
    const t = stage ? getComputedStyle(stage).transform : "none";
    return t === "none" ? new DOMMatrix() : new DOMMatrix(t);
  };

  const set = (scale: number, x: number, y: number) => {
    stage!.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    return sleep(CAMERA_MS);
  };

  return {
    /** Wraps the page in the stage. Safe to call more than once. */
    mount() {
      if (stage) return;
      stage = document.createElement("div");
      stage.className = "stage";
      const keepOutside = (n: Node) =>
        n instanceof Element && (n.matches(".toast, .hint, script, template") || n === stage);
      for (const node of [...document.body.childNodes]) if (!keepOutside(node)) stage.append(node);
      document.body.prepend(stage);
      document.body.classList.add("is-staged");
    },

    /**
     * Converts a point on screen (like getBoundingClientRect gives) to a point on the stage, which is where the
     * cursor lives. It uses the transform as it is right now, so it's correct even while the camera is moving.
     */
    toLocal(x: number, y: number): [number, number] {
      if (!stage) return [x, y];
      const p = matrix().inverse().transformPoint(new DOMPoint(x, y));
      return [p.x, p.y];
    },

    /** Zooms so `el` fills most of the screen (up to `maxScale`), centred, without showing past the page's edges. */
    focus(el: Element, { maxScale = 1.9, fill = 0.88, offsetY = 0 } = {}) {
      if (!stage) return sleep(0);
      const r = el.getBoundingClientRect();
      const [x1, y1] = this.toLocal(r.left, r.top);
      const [x2, y2] = this.toLocal(r.right, r.bottom);
      const vw = innerWidth;
      const vh = innerHeight;
      const scale = Math.min(maxScale, (vw * fill) / (x2 - x1), (vh * fill) / (y2 - y1));
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2 + offsetY;
      const x = clamp(vw / 2 - cx * scale, vw * (1 - scale), 0);
      const y = clamp(vh / 2 - cy * scale, vh * (1 - scale), 0);
      return set(scale, x, y);
    },

    /** Back to the wide shot. */
    reset() {
      if (!stage) return sleep(0);
      return set(1, 0, 0);
    },
  };
}

export type Camera = ReturnType<typeof createCamera>;
