# Complete multi-day itinerary generation

## Goal

Ensure a seven-day request receives meaningful verified-place content on all seven days whenever the service returns enough suitable places, without duplicating activities or changing the interface.

## Changes

- Keep the existing request, date validation, preferences, budget, destination verification, starting-location, and transportation behavior unchanged.
- Fix the response scheduling step so verified activities are distributed across the full requested date range instead of exhausting them in the first few days.
- Preserve activity order and details, never clone a place, and retain genuinely empty days only when fewer suitable verified places exist than requested days.
- Recalculate each affected day's cost, distance, and travel-time totals from its assigned activities.
- Verify the live seven-day Jaipur flow contains real places on Days 1–7, then confirm the project build is clean.
- When redistributing verified activities across the requested dates, preserve all existing activity constraints, ordering, time requirements, and compatibility rules. DO NOT blindly spread activities just to populate every day. Only rebalance activities that are valid for the target day.

## Technical details

The deployed service currently returns seven day records but greedily packs all verified Jaipur places into Days 1–4. The client normalization layer will rebalance only this sparse response case, using the service-returned verified activities and existing day records; it will not generate or duplicate place data.