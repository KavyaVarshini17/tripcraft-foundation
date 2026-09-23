# TripCraft UI update plan

## Changes
- Add one shared theme provider using the existing app wrapper, defaulting to light mode and persisting the selected mode in the browser.
- Add an icon theme toggle immediately before Planner in the existing header, with accessible translated labels and compact mobile behavior.
- Replace the teal design tokens with coordinated blue light/dark tokens while retaining current typography, spacing, borders, cards, and controls.
- Replace the two Step 1 location text fields with existing Select components and a shared Indian destination list. Goa will be the only enabled destination; Mumbai will be the only enabled starting location.
- Make all six existing progress labels interactive so users can jump directly between steps without validation or state loss; keep Back, Next, and final validation unchanged.

## Technical details
- Keep the existing `TripPlan` fields and values unchanged (`"Goa"` and `"Mumbai"`) so API payloads remain identical.
- Store only the theme preference in a new browser key; do not touch trip persistence, API calls, or generation code.
- Use semantic color tokens in the global stylesheet so existing components automatically inherit the blue palette in both themes.
- Verify desktop and mobile header, dropdown disabled states, direct step navigation, state retention, refresh persistence, and the current build status.

## Unchanged
All backend, data, API, generation, weather, routing, scoring, authentication, itinerary output, and planner validation logic remain untouched.
