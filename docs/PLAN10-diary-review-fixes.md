# M17-001 review fixes

## Objective and approach

Resolve dashboard FAB gesture and viewport bugs, modal keyboard/short-screen access, and calendar indicator screen-reader access without changing the existing visual data. A viewport-clamped FAB must preserve the existing start position when space permits, including bottom navigation clearance; when the viewport is too small to fit both the button and navigation, keep the button on screen as far as possible. Use localized descriptive labels that include the day and distinguish taken, missed, unfilled, event, period, and illness indicators. Preserve focus restoration while trapping both directions of Tab.

## TODO

- [x] Add failing tests for diagonal drags, viewport/resize limits, modal keyboard focus, and weekly/monthly indicator descriptions.
- [x] Implement clamped FAB motion and resize, modal focus containment and scrolling, and localized indicator descriptions.
- [x] Extract and compile catalogs; run unit, lint, build and E2E regressions; inspect the diff and commit.

## Human testing

On a mobile device, drag the FAB to each edge and rotate; verify it remains reachable above the bottom navigation. Open each modal, cycle Tab and Shift+Tab, close it, and verify focus returns to its trigger. On a short viewport scroll the monthly modal. With a screen reader, inspect weekly and monthly days in all three languages.

# M17-002 event log focus review fix

## Objective and approach

Provide a clearly visible keyboard focus ring on both event-log text controls. The current CSS suppresses the browser outline without replacement. Restore an explicit, high-contrast outline for keyboard focus; using only a subtle border change risks insufficient visibility. Keep styling scoped to the event-log page and preserve mouse and form behavior.

## TODO

- [x] Add a real-browser keyboard regression for both controls and observe it fail before the fix.
- [x] Add the focus ring and verify the regression passes.
- [x] Run unit, lint, build and E2E regressions; inspect and commit the change.

## Human testing

Navigate to the event log, use Tab to reach the date/time and notes fields, and confirm a clear focus ring is visible around each at mobile and desktop widths.

# M17-003 emergency contact review fixes

## Objective and approach

Use the active Lingui locale for the prefilled emergency SMS and WhatsApp text, and keep the link helper pure by passing it the translated message. Reject inputs with no ASCII digits after normalization rather than creating invalid links. Keep contact input, custom aura text, investigation selection, and tag selections intact when the locale changes; React keys must remain stable. URI-encode the message and digit-normalize the number as before. A full phone validation system is outside this review's scope and could reject legitimate international numbers.

## TODO

- [x] Add failing tests for digitless numbers, exact emergency messages in all three locales, and dynamic field preservation across locale switches.
- [x] Pass the translated message to contact links, normalize before checking for an empty number, and update/compile the catalogs.
- [x] Run unit, lint, build and E2E regressions; inspect and commit the change.

## Human testing

Enter a contact number and custom aura, add an investigation and change its type. Switch between Traditional Chinese, Simplified Chinese and English; check entered values remain and inspect the SMS and WhatsApp drafts in each language. Enter only a plus sign or whitespace and verify the three links no longer point to an invalid phone URI.
