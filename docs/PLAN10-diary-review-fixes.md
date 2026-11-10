# M17-001 review fixes

## Objective and approach

Resolve dashboard FAB gesture and viewport bugs, modal keyboard/short-screen access, and calendar indicator screen-reader access without changing the existing visual data. A viewport-clamped FAB must preserve the existing start position when space permits, including bottom navigation clearance; when the viewport is too small to fit both the button and navigation, keep the button on screen as far as possible. Use localized descriptive labels that include the day and distinguish taken, missed, unfilled, event, period, and illness indicators. Preserve focus restoration while trapping both directions of Tab.

## TODO

- [x] Add failing tests for diagonal drags, viewport/resize limits, modal keyboard focus, and weekly/monthly indicator descriptions.
- [x] Implement clamped FAB motion and resize, modal focus containment and scrolling, and localized indicator descriptions.
- [x] Extract and compile catalogs; run unit, lint, build and E2E regressions; inspect the diff and commit.

## Human testing

On a mobile device, drag the FAB to each edge and rotate; verify it remains reachable above the bottom navigation. Open each modal, cycle Tab and Shift+Tab, close it, and verify focus returns to its trigger. On a short viewport scroll the monthly modal. With a screen reader, inspect weekly and monthly days in all three languages.
