import { check } from "no-nepali-profanity";
import { createCamera } from "../shared/camera";
import { createDirector, setUpPlayback, sleep } from "../shared/director";
import { attachHighlighter, escapeHtml, hideError, shake, showError, showToast, withSpinner } from "../shared/field";
import "../shared/base.css";
import "./style.css";

/* Course-review form. It blocks a review until the flagged words are edited out. */

const $ = <T extends Element>(selector: string) => document.querySelector(selector) as T;

const form = $<HTMLFormElement>("#compose");
const field = $<HTMLDivElement>("#field");
const textarea = $<HTMLTextAreaElement>("#review");
const error = $<HTMLParagraphElement>("#review-error");
const counter = $<HTMLSpanElement>("#counter");
const post = $<HTMLButtonElement>("#post");
const stars = [...document.querySelectorAll<HTMLButtonElement>("#stars button")];
const reviews = $<HTMLUListElement>("#reviews");
const toast = $<HTMLDivElement>("#toast");

let rating = 0;

function setRating(value: number) {
  rating = value;
  stars.forEach((star, i) => {
    star.classList.toggle("is-on", i < value);
    star.setAttribute("aria-checked", String(i + 1 === value));
  });
  const picked = stars[value - 1];
  if (picked) {
    picked.classList.add("is-pop");
    setTimeout(() => picked.classList.remove("is-pop"), 160);
  }
}
stars.forEach((star, i) => star.addEventListener("click", () => setRating(i + 1)));

const render = attachHighlighter(textarea, $("#backdrop"), (flagged) => {
  counter.textContent = `${textarea.value.length} / 500`;
  if (flagged === 0) {
    hideError(error);
    field.classList.remove("has-issues");
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = textarea.value.trim();

  if (!text) {
    showError(error, "Write a few words first.");
    shake(field);
    return;
  }

  if (check(text).hasProfanity) {
    field.classList.add("has-issues");
    showError(error, "Your review has language that isn't allowed. Edit the highlighted words to post it.");
    shake(field);
    shake(post);
    return;
  }

  await withSpinner(post, 700);
  addReview(text, rating || 5);
  textarea.value = "";
  render();
  setRating(0);
  textarea.blur();
  showToast(toast, "Review posted");
});

function addReview(text: string, stars: number) {
  const item = document.createElement("li");
  item.className = "review is-new";
  item.dataset.new = "true";
  item.innerHTML = `
    <span class="person" style="--hue: 28">DU</span>
    <div>
      <p class="review-head"><strong>Demo User</strong><span>Just now</span></p>
      <p class="review-stars" aria-label="${stars} stars">${"★".repeat(stars)}<span class="dim">${"★".repeat(5 - stars)}</span></p>
      <p class="review-body">${escapeHtml(text)}</p>
    </div>`;
  reviews.prepend(item);
}

/* ---------- Scripted demo, for recording ---------- */

const camera = createCamera();
const director = createDirector($("#cursor"), camera.toLocal.bind(camera));

const BLOCKED_REVIEW = "Muji. lecturer kam xaina.";

// Where the caret would sit after the first `chars` characters, measured in the textarea's own font.
function textPoint(chars: number) {
  const style = getComputedStyle(textarea);
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const width = ctx.measureText(textarea.value.slice(0, chars)).width;
  const r = textarea.getBoundingClientRect();
  const zoom = r.width / textarea.offsetWidth; // the camera's current scale
  return [
    r.left + (parseFloat(style.paddingLeft) + width + 2) * zoom,
    r.top + (parseFloat(style.paddingTop) + 12) * zoom,
  ] as const;
}

function restingPoint() {
  const r = form.getBoundingClientRect();
  return [r.right - 60, r.bottom + 70] as const;
}

// Puts the page back exactly how it started, so the recording loops without a visible jump.
async function resetScene() {
  const added = [...reviews.querySelectorAll<HTMLLIElement>("[data-new]")];
  added.forEach((el) => el.classList.add("is-leaving"));
  await sleep(450);
  added.forEach((el) => el.remove());
  textarea.value = "";
  render();
  setRating(0);
  textarea.blur();
}

async function loop() {
  director.reseed();
  await sleep(900); // wide shot: the whole app and its address

  // Zoom in on the form as the cursor heads for the stars
  await Promise.all([camera.focus(form), director.moveToElement(stars[1])]);
  await director.click(() => setRating(2));
  await sleep(250);

  await director.moveToElement(textarea, 0.3, 0.35);
  await director.click(() => director.caretToEnd(textarea));
  await sleep(250);
  void director.moveToElement(textarea, 0.92, 0.85); // out of the way of the text
  await director.type(textarea, BLOCKED_REVIEW);
  await sleep(700);

  // Blocked
  await director.moveToElement(post);
  await director.click(() => form.requestSubmit(), post);
  await sleep(1600);

  // Fix it: click just after "Muji. l", backspace over it, and capitalise the "L"
  const fixAt = "Muji. l".length;
  await director.moveTo(...textPoint(fixAt));
  await director.click(() => {
    textarea.focus();
    textarea.setSelectionRange(fixAt, fixAt);
  });
  await sleep(200);
  void director.moveToElement(textarea, 0.92, 0.85); // out of the way of the text
  await director.eraseBefore(textarea, fixAt, fixAt);
  await sleep(250);
  await director.typeAt(textarea, 0, "L");
  await sleep(900);

  // Posted, then pull back to show it land in the list
  await director.moveToElement(post);
  await director.click(() => form.requestSubmit(), post);
  await sleep(900);
  await camera.reset();
  await sleep(1800);

  await Promise.all([director.moveTo(...restingPoint()), resetScene()]);
  await sleep(500);
}

setUpPlayback(loop, () => {
  if (!new URLSearchParams(location.search).has("nozoom")) camera.mount();
  director.place(...restingPoint());
});
