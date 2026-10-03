/*
 * Draws a browser window (tab strip and address bar) at the top of the page, showing a made-up address. A page
 * can't change the real address bar's domain, so for a screen recording, put Chrome in full screen with its
 * toolbar hidden and turn this on with ?frame. The address comes from <body data-fake-url="host/path">.
 */

const ICONS = {
  back: '<path d="M12.5 4 6.5 10l6 6" />',
  forward: '<path d="M7.5 4l6 6-6 6" />',
  reload: '<path d="M15.5 10a5.5 5.5 0 1 1-1.6-3.9M15.5 4v3.5H12" />',
  tune: '<path d="M4 7h7M14 7h2M4 13h2M9 13h7" /><circle cx="12.5" cy="7" r="1.6" /><circle cx="7.5" cy="13" r="1.6" />',
  star: '<path d="m10 3.8 1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z" />',
  more: '<circle cx="10" cy="5" r="1.2" /><circle cx="10" cy="10" r="1.2" /><circle cx="10" cy="15" r="1.2" />',
};

const icon = (name: keyof typeof ICONS, cls = "") =>
  `<svg class="bf-icon ${cls}" viewBox="0 0 20 20" aria-hidden="true">${ICONS[name]}</svg>`;

export function mountBrowserFrame() {
  const url = document.body.dataset.fakeUrl ?? "nakkali-url.com.np";
  const slash = url.indexOf("/");
  const host = slash === -1 ? url : url.slice(0, slash);
  const path = slash === -1 ? "" : url.slice(slash);
  const mark = document.querySelector(".brand-mark")?.textContent ?? "";
  const title = document.title;

  const frame = document.createElement("div");
  frame.className = "browser-frame";
  frame.setAttribute("aria-hidden", "true");
  frame.innerHTML = `
    <div class="bf-tabs">
      <span class="bf-lights"><i></i><i></i><i></i></span>
      <div class="bf-tab">
        <span class="bf-favicon">${mark}</span>
        <span class="bf-title">${title}</span>
        <span class="bf-close">×</span>
      </div>
      <span class="bf-newtab">+</span>
    </div>
    <div class="bf-toolbar">
      ${icon("back")}${icon("forward", "is-dim")}${icon("reload")}
      <div class="bf-omnibox">
        ${icon("tune", "bf-tune")}
        <span class="bf-url"><span class="bf-host">${host}</span><span class="bf-path">${path}</span></span>
        ${icon("star", "bf-star")}
      </div>
      <span class="bf-profile">DU</span>
      ${icon("more")}
    </div>`;
  document.body.prepend(frame);
  document.body.classList.add("has-frame");
}
