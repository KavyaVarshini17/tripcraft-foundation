# TripCraft Foundation

Build the foundation of a premium AI-powered personalized tourism itinerary web app called “TripCraft.” This is the first development step only. Create a clean, functional frontend architecture and polished responsive UI. Do NOT build AI itinerary generation, maps, external APIs, authentication, a database, fake API calls, or random tourist places.

Create:
1) Home: modern travel-tech landing page with a visually strong travel hero image, clear personalized-itinerary headline, brief supporting copy, primary “Plan My Trip” CTA navigating to planner, premium uncluttered responsive aesthetic.

2) Trip Planner: a six-step form with persistent frontend state, preserving all values through Back/Next navigation and when navigating to the itinerary page. Include visible progress and Back/Next controls; validate required fields before continuing.
- Step 1 Destination: destination, starting location, start date, end date.
- Step 2 Travelers & Budget: number of travelers; traveling with (Solo, Couple, Family, Friends, Other); total budget; currency default INR.
- Step 3 Interests: multi-select History, Culture, Nature, Beaches, Adventure, Food, Shopping, Spiritual, Art, Nightlife, Photography, Family.
- Step 4 Travel Style: Relaxed, Balanced, Packed; transportation: Walking, Public Transport, Taxi/Cab, Own Vehicle, Rental Two-Wheeler, Combination.
- Step 5 Daily Preferences: preferred start time, preferred end time, meal preferences, optional accessibility/preferences field.
- Step 6 Must Visit: add/remove multiple must-visit places and optional additional notes.

3) Itinerary page: separate destination page that reads the stored planner data and shows destination, dates, travelers, budget, an empty-state message, and “Generate My Itinerary” button. Button must remain a UI placeholder only, with no fake implementation.

Architecture: Keep structured planner data/state separate from UI components. Use reusable UI/form components. Keep itinerary display separate from future itinerary-generation logic. Design the data model so it can later pass cleanly to Supabase, maps/routing/places services, and AI backend.

Design: premium modern travel-tech style, travel imagery, rounded cards, subtle shadows, refined typography, tasteful animations. Ensure desktop and mobile layouts work. Make every described interaction functional.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7aebc943-132d-4108-94ea-118f8e1c1b26).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
