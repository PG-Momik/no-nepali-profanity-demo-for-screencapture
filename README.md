# no-nepali-profanity demos

Two fake apps, used to record the hero video on mukhxadnahunna.com. Both use the real `no-nepali-profanity`
package, linked from `../js`, so everything on screen is the library working.

| Demo | Page | What it shows |
|---|---|---|
| **Kakshya**, course reviews (LMS) | `/lms/` | Profanity is underlined as you type, and the review is **blocked** until it's fixed. |
| **Guff**, threaded replies | `/thread/` | Replying to a reply. The reply still posts, with the profanity **masked** (`के भनेको ••`). |

## Run it

```sh
# Rebuild the package first if you've changed it; the demos use ../js/dist.
(cd ../js && npm run build)

npm install
npm run dev          # http://localhost:5190
```

`http://localhost:5190/` links to both demos.

## The scripted demos

Add `?autoplay&clean` to a demo's address to play its recording script on a loop:

- **http://localhost:5190/lms/?autoplay&clean** (about 18 seconds a loop)
  1. A 2-star rating is picked, and "Muji. lecturer kam xaina." is typed. "Muji" is underlined as soon as it's
     typed.
  2. Post is clicked, and the review is blocked: the box shakes and turns red, and an error explains why.
  3. "Muji. " is deleted and the "l" is capitalised, leaving "Lecturer kam xaina.". The error clears: the criticism
     is fine, only the abuse was blocked.
  4. Post is clicked again. The review is posted, appears in the list, and a toast confirms it.
- **http://localhost:5190/thread/?autoplay&clean** (about 13 seconds a loop)
  1. Reply is clicked on Ashesh's reply, which is itself a reply to Yash's comment. A reply box opens, nested
     under it.
  2. "के भनेको मुजी, तेरो बाउ overrated।" is typed, in Devanagari. "मुजी" is underlined, and a note says one word
     will be hidden.
  3. Reply is clicked. The reply appears in the thread as "के भनेको ••, तेरो बाउ overrated।", tagged
     "1 word hidden", and a toast confirms it.

Each loop ends exactly where it started, so the video loops without a jump, and every loop is identical, including
the typing rhythm. A drawn cursor moves and clicks, and the real cursor is hidden while it plays.

- `?autoplay` starts the script on load. Or press <kbd>P</kbd> to start it.
- `?clean` hides the keyboard hint in the corner.
- `?nozoom` turns off the camera. By default the script zooms in on the form or reply while it types, and pulls
  back to show the result, so the recording stays readable when it's shown small.
- `?frame` draws a browser window at the top of the page, with a made-up address in its address bar (see below).
- <kbd>R</kbd> reloads the page.

Without `?autoplay`, the apps work normally, so you can type into them yourself.

## Recording

### With a made-up address in the address bar

A page can't change the domain shown in Chrome's real address bar, so with `?frame` the demo draws its own
browser window instead: a tab, back, forward and reload buttons, and an address bar showing
`nakkali-url.com.np/courses/cs101/reviews` (LMS) or `nakkali-url.com.np/c/kathmandu-foodies/best-momo-in-kathmandu`
(thread). Each page's address is set by `data-fake-url` on its `<body>`.

1. Open **http://localhost:5190/lms/?clean&frame** (or `/thread/?clean&frame`).
2. Put Chrome in full screen with its toolbar hidden: View → Enter Full Screen (<kbd>⌃⌘F</kbd>), then untick
   View → Always Show Toolbar in Full Screen.
3. Start a whole-screen recording (on macOS, <kbd>⇧⌘5</kbd> → Record Entire Screen).
4. Press <kbd>P</kbd> to start the scripted loop, and record at least two loops.
5. Trim to exactly one loop: from the first frame of a loop to the first frame of the next.

### Page area only

The hero frame on the site is **16:10**. To record just the page:

1. Open a demo in Chrome, and make the page area exactly 1440×900. The easiest way is DevTools → Toggle device
   toolbar → Responsive, set to 1440 × 900 and 100%, then close the DevTools panel with the toolbar kept. On a
   Retina screen, this records at 2880×1800.
2. Start the screen recording (on macOS, <kbd>⇧⌘5</kbd> → Record Selected Portion, and draw around the page).
3. Load the `?autoplay&clean` address, and record at least two full loops.
4. Trim to exactly one loop.

Then encode the video and add it to the site. The commands and the setting to change are in `site/README.md`,
under "Hero video".

## Code

- `src/shared/` has what both demos use: the highlighted text field (`field.ts`), the cursor and typing script
  (`director.ts`), the zooming camera (`camera.ts`), the drawn browser window (`frame.ts`) and the shared styles (`base.css`).
- `src/lms/` and `src/thread/` have each demo's own script and styles. Their pages are `lms/index.html` and
  `thread/index.html`.
