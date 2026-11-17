# How to Add a Theme to Bitrequest

A theme is a single CSS file that restyles the app's colours and surfaces. You can write one by hand, or generate one with an AI assistant (Claude, ChatGPT, etc.) using the prompt below.

---

## How themes work

- `index.html` loads `assets/styles/themes/default.css` last, through `<link id="theme">`.
- Picking a theme in **Settings → Theme** swaps that link's `href`. A theme therefore **replaces** `default.css`; the two are never loaded together. Anything in `default.css` that your theme leaves out is simply gone.
- Because the theme loads after every base stylesheet, a rule with the same selector as a base rule wins. No `!important` needed.
- The theme picker lists the files in `glob_const.themes` and previews each one live as you select it. OK saves, Cancel restores the previous theme.
- The embedded checkout (iframe mode) always uses the default styling, so themes don't need to account for it.
- The service worker caches theme files the first time they load; no cache list to update.

---

## Rules

1. **Base the new theme on `default.css`** in `assets/styles/themes/`. Start from a copy of it.
2. **Only adjust the existing styles in `default.css`.** Keep its selectors; change their values and add properties to them (gradients, borders, shadows, `border-radius`, `backdrop-filter`, etc.).
3. **Don't add any IDs or classes** that aren't in `default.css`. Many of the app's IDs and classes drive behaviour, not just looks, and restyling them can break things.
4. **Keep every rule from `default.css`**, even the ones you don't change (see "How themes work").
5. **File name:** lowercase with underscores, e.g. `midnight_neon.css`. Update the header comment with the theme's name.

---

## Design notes

- **Dialogs and the payment card stay white** in every theme, because `default.css` doesn't style them. The link colour (the big selector group under `/* Link colors */`) is used both inside those white dialogs and on your page background, so it has to be readable on both.
- **`.button` text is white**, so the button background needs enough contrast with white.
- **`.requestlist>li .brstatuspanel`** slides over a request row to show its status. Keep it opaque, including the outgoing and local variants, or the row underneath shows through.
- **`.liwrap`** is the secondary text in lists; keep it readable against the background.
- **Motion:** animate only `transform` and `opacity`, keep it slow and subtle, and switch it off under `@media (prefers-reduced-motion: reduce)`. Bitrequest often runs on low-end POS tablets.
- **`backdrop-filter`:** also write `-webkit-backdrop-filter` for Safari, and avoid it on long scrolling lists (expensive to redraw).

---

## Adding the theme

### 1. Create the file

Copy `assets/styles/themes/default.css` to `assets/styles/themes/your_theme.css` and adjust it (by hand or with the prompt below).

### 2. Register it

**File:** `assets/js/lib/global_queries.js`

Add the file name to the `"themes"` array in `glob_const`:

```javascript
"themes": ["aurora.css", "forest_canopy.css", "malignant_glare.css", "oceanic_depth.css", "solar_flare.css", "terminal_entry.css", "twilight_grove.css", "your_theme.css"],
```

`default.css` isn't listed; it's the built-in default.

### 3. Test it

Open **Settings → Theme** and pick your theme. Check, at phone and desktop width:

- Home screen, Currencies, a coin page, Settings
- Requests, with incoming, outgoing and local requests, and a request showing its status panel
- A few dialogs (Theme, Local Fiat Currency, Add address) — link colours on white
- The payment card, front and back
- The PIN lock screen

### 4. Submit

A theme pull request touches exactly two files: the new `.css` file and `global_queries.js`.

---

## Generating a theme with AI

### Instructions

1. Copy the prompt below.
2. Replace `[THEME NAME]`, `[theme_name]` and `[DESCRIPTION]`. Describe the look you want in plain words: mood, colours, background, surfaces, motion. See "Example descriptions".
3. Paste the prompt into an AI assistant and attach `assets/styles/themes/default.css` (required). For better results also attach `assets/styles/styles.css` and `index.html`, so the AI knows what each selector is, and optionally an existing theme as a reference.
4. Review the output: it should only use selectors from `default.css`. Then add and test it as described above. AI output needs a human look, especially for contrast and for the request status panels.

---

### The Prompt

```
You are creating a theme for Bitrequest, an open-source crypto point-of-sale web app (PWA). A theme is a single CSS file in assets/styles/themes/ that replaces default.css when selected.

## The theme I want

Name: [THEME NAME]
File: [theme_name].css
Description: [DESCRIPTION]

## Rules

1. Base the theme on the attached default.css. Start from a copy of it and update the header comment with the theme's name.
2. Only adjust the existing styles in default.css: keep its selectors, change their values, and add properties to them (gradients, borders, shadows, border-radius, backdrop-filter, etc.).
3. Don't add any IDs or classes that aren't in default.css; many of them drive app behaviour, and restyling them can break things.
4. Keep every rule from default.css, even the ones you don't change. The theme replaces default.css instead of loading on top of it.
5. Don't use !important. The theme loads after all base stylesheets, so the same selector already wins.

## Design constraints

- Dialogs and the payment card stay white in every theme. The link colour (the selector group under "Link colors") is used on those white dialogs and on the page background, so it must be readable on both.
- .button text is white, so the button background needs enough contrast with white.
- .requestlist>li .brstatuspanel slides over a request row to show its status. Keep it opaque, including the outgoing and local variants, so the row underneath doesn't show through.
- Keep body text and .liwrap readable against the background.
- Animate only transform and opacity, keep motion slow and subtle, and disable it under @media (prefers-reduced-motion: reduce). The app often runs on low-end POS tablets.
- If you use backdrop-filter, also write -webkit-backdrop-filter for Safari, and don't put it on long scrolling lists.

## Output

Return only [theme_name].css, complete, with no explanation.
```

---

### Example descriptions

The description is where the theme comes from; the rest of the prompt keeps it within bounds. A few lines in plain words are enough:

> Can you add a glassy theme? Like the modern UIs you see today? Subtly warping backgrounds behind glassy panels?

> Warm and calm: a dusk gradient from deep plum to burnt orange, soft cream text, rounded panels with a faint inner glow, coral accent.

> High-contrast and minimal: near-black background, pure white text, a single electric-lime accent, sharp corners, no shadows, no motion.
