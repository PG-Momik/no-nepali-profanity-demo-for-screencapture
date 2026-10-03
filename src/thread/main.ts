import { check } from "no-nepali-profanity";
import { createCamera } from "../shared/camera";
import { createDirector, setUpPlayback, sleep } from "../shared/director";
import { attachHighlighter, escapeHtml, shake, showToast, withSpinner } from "../shared/field";
import "../shared/base.css";
import "./style.css";

/* Threaded replies. A reply with profanity still posts, with the flagged words masked. */

const $ = <T extends Element>(selector: string) => document.querySelector(selector) as T;

const template = $<HTMLTemplateElement>("#composer-template");
const toast = $<HTMLDivElement>("#toast");
const thread = $<HTMLElement>(".thread");

const EYE_OFF =
  '<svg class="note-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2l12 12M6.6 3.7A6.5 6.5 0 0 1 8 3.5c3.5 0 6 4.5 6 4.5a11 11 0 0 1-1.7 2.2M4.2 5.2A11 11 0 0 0 2 8s2.5 4.5 6 4.5a5.9 5.9 0 0 0 2.5-.6" /></svg>';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// Graphemes, so a Devanagari word gets one mask character per visible letter.
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
const maskOf = (s: string) =>
  [...segmenter.segment(s)].map(({ segment }) => (/^\s+$/.test(segment) ? segment : "•")).join("");

// The censored reply as HTML, with each masked run wrapped so it can be styled as a redaction.
function censoredHtml(text: string) {
  const OPEN = "";
  const CLOSE = "";
  const censored = check(text).censor({ replace: (m) => OPEN + maskOf(m.text) + CLOSE });
  return escapeHtml(censored).replace(//g, '<span class="masked">').replace(//g, "</span>");
}

let openComposer: { form: HTMLFormElement; button: HTMLButtonElement } | undefined;

function closeComposer(animate = true): Promise<void> {
  const current = openComposer;
  if (!current) return Promise.resolve();
  openComposer = undefined;
  current.button.classList.remove("is-active");
  if (!animate) {
    current.form.remove();
    return Promise.resolve();
  }
  current.form.classList.add("is-leaving");
  return sleep(250).then(() => current.form.remove());
}

function openComposerFor(button: HTMLButtonElement) {
  if (openComposer?.button === button) return openComposer.form;
  closeComposer(false);

  const form = (template.content.firstElementChild as HTMLFormElement).cloneNode(true) as HTMLFormElement;
  const author = button.dataset.author ?? "";
  (form.querySelector("[data-author]") as HTMLElement).textContent = author;

  const textarea = form.querySelector("textarea") as HTMLTextAreaElement;
  const note = form.querySelector("[data-note]") as HTMLElement;
  const noteText = form.querySelector("[data-note-text]") as HTMLElement;
  const submit = form.querySelector("[data-submit]") as HTMLButtonElement;

  attachHighlighter(textarea, form.querySelector(".field-backdrop") as HTMLElement, (flagged) => {
    note.classList.toggle("is-visible", flagged > 0);
    if (flagged > 0) noteText.textContent = `${plural(flagged, "word")} will be hidden when you post`;
  });

  form.querySelector("[data-cancel]")!.addEventListener("click", () => closeComposer());
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = textarea.value.trim();
    if (!text) {
      shake(form.querySelector(".field")!);
      return;
    }
    await withSpinner(submit, 600);
    const hidden = check(text).matches.length > 0 ? countHidden(text) : 0;
    addReply(button, text, hidden);
    await closeComposer();
    showToast(toast, hidden ? `Reply posted · ${plural(hidden, "word")} hidden` : "Reply posted");
  });

  const replies = button.closest(".comment-main")!.querySelector(":scope > .replies") as HTMLElement;
  replies.prepend(form);
  button.classList.add("is-active");
  openComposer = { form, button };
  textarea.focus();
  return form;
}

function countHidden(text: string) {
  let count = 0;
  check(text).censor({ replace: (m) => (count++, m.text) });
  return count;
}

function addReply(button: HTMLButtonElement, text: string, hidden: number) {
  const reply = document.createElement("div");
  reply.className = "comment is-new";
  reply.dataset.new = "true";
  reply.innerHTML = `
    <span class="person person-sm" style="--hue: 28">DU</span>
    <div class="comment-main">
      <p class="comment-head"><strong>Demo User</strong><span>Just now</span></p>
      <p class="comment-body">${censoredHtml(text)}</p>
      <div class="comment-actions">
        <button type="button" class="like"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 16.5s-6-3.6-6-8A3.3 3.3 0 0 1 10 6.3a3.3 3.3 0 0 1 6 2.2c0 4.4-6 8-6 8z" /></svg><span>0</span></button>
        <button type="button" class="reply-btn" data-author="Demo User">Reply</button>
        ${hidden ? `<span class="filtered-tag">${EYE_OFF}${plural(hidden, "word")} hidden</span>` : ""}
      </div>
      <div class="replies"></div>
    </div>`;
  const replies = button.closest(".comment-main")!.querySelector(":scope > .replies") as HTMLElement;
  replies.append(reply);
}

// Reply and like buttons, including ones on replies added later.
thread.addEventListener("click", (event) => {
  const target = event.target as Element;
  const replyButton = target.closest<HTMLButtonElement>(".reply-btn");
  if (replyButton) openComposerFor(replyButton);
  const like = target.closest<HTMLButtonElement>(".like");
  if (like) {
    const count = like.querySelector("span")!;
    const liked = like.classList.toggle("is-liked");
    count.textContent = String(Number(count.textContent) + (liked ? 1 : -1));
  }
});

/* ---------- Scripted demo, for recording ---------- */

const camera = createCamera();
const director = createDirector($("#cursor"), camera.toLocal.bind(camera));
const replyToAshesh = $<HTMLButtonElement>("#reply-ashesh");
const ashesh = $<HTMLElement>("#ashesh");

function restingPoint() {
  const r = thread.getBoundingClientRect();
  return [r.right - 70, r.bottom + 40] as const;
}

// Puts the page back exactly how it started, so the recording loops without a visible jump.
async function resetScene() {
  const added = [...thread.querySelectorAll<HTMLElement>("[data-new]")];
  added.forEach((el) => el.classList.add("is-leaving"));
  await Promise.all([sleep(400), closeComposer()]);
  added.forEach((el) => el.remove());
}

async function loop() {
  director.reseed();
  await sleep(900); // wide shot: the whole thread and its address

  // Zoom in on the reply being replied to, as the cursor heads for its Reply button
  await Promise.all([camera.focus(ashesh), director.moveToElement(replyToAshesh)]);
  await director.click(() => openComposerFor(replyToAshesh), replyToAshesh);
  await sleep(300);
  // Re-frame now that the reply box has opened under it
  void camera.focus(ashesh);

  const form = openComposer!.form;
  const textarea = form.querySelector("textarea")!;
  const submit = form.querySelector<HTMLButtonElement>("[data-submit]")!;

  await director.moveToElement(textarea, 0.3, 0.4);
  await director.click(() => director.caretToEnd(textarea));
  await sleep(200);
  void director.moveToElement(textarea, 0.92, 0.85); // out of the way of the text
  await director.type(textarea, "के भनेको मुजी, तेरो बाउ overrated।");
  await sleep(1000);

  // Posted, with the word masked. Hold on it, then pull back.
  await director.moveToElement(submit);
  await director.click(() => form.requestSubmit(), submit);
  await camera.reset();
  await sleep(2400);

  await Promise.all([director.moveTo(...restingPoint()), resetScene()]);
  await sleep(500);
}

setUpPlayback(loop, () => {
  if (!new URLSearchParams(location.search).has("nozoom")) camera.mount();
  director.place(...restingPoint());
});
