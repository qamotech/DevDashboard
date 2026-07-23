# PromptN8R Improvement Loop

## 2026-07-22 06:51:19 -04:00

- **Problem:** The custom prompt dialog moved focus when opened but did not contain keyboard focus, allowing Tab navigation into controls behind the modal.
- **Change:** Added explicit `aria-hidden` state updates and a compact Tab/Shift+Tab focus loop while preserving Escape, backdrop close, and trigger focus restoration.
- **Validation:** Inline JavaScript syntax passed for all 3 scripts; Python HTML parsing and `git diff --check` passed. `npm run check`, `npm run check:links`, and `npm run build` remain blocked by 186 pre-existing broken references to four manifest-listed files missing from disk (`cyber-data-multi-team-logistics-engine.html`, `devdashboard-hub.html`, `devdashboard-home.html`, and `devdashboard-hub-index.html`).
- **Next candidate:** Cancel and reset the simulated execution timer when the dialog closes or a different prompt opens, preventing stale progress updates.

## 2026-07-22 07:09:41 -04:00

- **Problem:** Closing the prompt dialog during a simulated execution left its timeout chain running, so stale progress and completion notifications could appear after the dialog closed or a later prompt opened.
- **Change:** Centralized simulation reset state, tracked the active timeout, and cancel/reset it whenever the dialog closes or a prompt opens.
- **Validation:** Python HTML parsing, syntax compilation for both inline scripts, `git diff --check`, `npm run check`, `npm run check:links`, and `npm run build` all passed.
- **Next candidate:** Announce filtered result-count changes to screen-reader users without making every keystroke overly verbose.

## 2026-07-22 07:29:14 -04:00

- **Problem:** Filtered prompt totals updated only visually, so screen-reader users received no feedback after searching or changing categories.
- **Change:** Added a polite live region that announces category and clear-filter results promptly while debouncing search-input announcements until typing pauses.
- **Validation:** Python HTML parsing, syntax compilation for all 3 inline scripts, `git diff --check`, `npm run check`, `npm run check:links`, and `npm run build` all passed.
- **Next candidate:** Keep filter button selection state programmatically exposed with `aria-pressed` as categories change.

## 2026-07-22 07:49:28 -04:00

- **Problem:** Category filters showed their active state only through styling, and rerendering the filter row after selection discarded keyboard focus.
- **Change:** Added synchronized `aria-pressed` values to every filter button and restored focus to the newly selected filter after rerendering.
- **Validation:** Python HTML parsing, syntax compilation for all 3 inline scripts, `git diff --check`, `npm run check`, `npm run check:links`, and `npm run build` all passed.
- **Next candidate:** Expose each category filter's relationship to the prompt results with `aria-controls` and review whether the filter group needs a concise accessible label.

## 2026-07-22 08:09:04 -04:00

- **Problem:** Category filter buttons exposed their selected state but not the control set's purpose or the prompt region each button updates.
- **Change:** Marked the category row as a named control group and added `aria-controls="promptGrid"` to every generated filter button.
- **Validation:** Python HTML parsing, syntax compilation for all 3 inline scripts, `git diff --check`, `npm run check`, `npm run check:links`, and `npm run build` all passed.
- **Next candidate:** Ensure the prompt results region's accessible label reflects the current result count after filtering.
