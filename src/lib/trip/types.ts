/**
 * Structured trip-planning data model.
 *
 * This module is intentionally UI-free so the same shapes can later be
 * persisted to a database, sent to maps/places/routing services, or passed
 * to an AI itinerary backend without refactoring components.
 */

export type CompanionType = "solo" | "couple" | "family" | "friends" | "other";

export type TravelPace = "relaxed" | "balanced" | "packed";

export type TransportMode =
  | "walking"
  | "public_transport"
  | "taxi"
  | "own_vehicle"
  | "rental_two_wheeler"
  | "combination";

export type InterestTag =
  | "history"
  | "culture"
  | "nature"
  | "beaches"
  | "adventure"
  | "food"
  | "shopping"
  | "spiritual"
  | "art"
  | "nightlife"
  | "photography"
  | "family";

export type MealPreference =
  | "vegetarian"
  | "vegan"
  | "non_vegetarian"
  | "jain"
  | "halal"
  | "no_preference";

export interface MustVisitPlace {
  id: string;
  name: string;
}

export interface DestinationDetails {
  destination: string;
  startingLocation: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string; // ISO yyyy-mm-dd
}

export interface TravelersAndBudget {
  travelers: number;
  companionType: CompanionType | "";
  totalBudget: string; // kept as string for controlled input; parse at use-site
  currency: string;
}

export interface TravelStyle {
  pace: TravelPace | "";
  transport: TransportMode[];
}

export interface DailyPreferences {
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  mealPreferences: MealPreference[];
  accessibilityNotes: string;
}

export interface MustVisitSection {
  places: MustVisitPlace[];
  additionalNotes: string;
}

export interface TripPlan {
  destinationDetails: DestinationDetails;
  travelersAndBudget: TravelersAndBudget;
  interests: InterestTag[];
  travelStyle: TravelStyle;
  dailyPreferences: DailyPreferences;
  mustVisit: MustVisitSection;
}

export const createEmptyTripPlan = (): TripPlan => ({
  destinationDetails: {
    destination: "",
    startingLocation: "",
    startDate: "",
    endDate: "",
  },
  travelersAndBudget: {
    travelers: 2,
    companionType: "",
    totalBudget: "",
    currency: "INR",
  },
  interests: [],
  travelStyle: { pace: "", transport: [] },
  dailyPreferences: {
    startTime: "09:00",
    endTime: "21:00",
    mealPreferences: [],
    accessibilityNotes: "",
  },
  mustVisit: { places: [], additionalNotes: "" },
});

export const INTEREST_OPTIONS: { value: InterestTag; label: string }[] = [
  { value: "history", label: "History" },
  { value: "culture", label: "Culture" },
  { value: "nature", label: "Nature" },
  { value: "beaches", label: "Beaches" },
  { value: "adventure", label: "Adventure" },
  { value: "food", label: "Food" },
  { value: "shopping", label: "Shopping" },
  { value: "spiritual", label: "Spiritual" },
  { value: "art", label: "Art" },
  { value: "nightlife", label: "Nightlife" },
  { value: "photography", label: "Photography" },
  { value: "family", label: "Family" },
];

export const COMPANION_OPTIONS: { value: CompanionType; label: string }[] = [
  { value: "solo", label: "Solo" },
  { value: "couple", label: "Couple" },
  { value: "family", label: "Family" },
  { value: "friends", label: "Friends" },
  { value: "other", label: "Other" },
];

export const PACE_OPTIONS: { value: TravelPace; label: string; hint: string }[] = [
  { value: "relaxed", label: "Relaxed", hint: "Fewer stops, more breathing room" },
  { value: "balanced", label: "Balanced", hint: "A steady mix of sights and rest" },
  { value: "packed", label: "Packed", hint: "See as much as possible each day" },
];

export const TRANSPORT_OPTIONS: { value: TransportMode; label: string }[] = [
  { value: "walking", label: "Walking" },
  { value: "public_transport", label: "Public Transport" },
  { value: "taxi", label: "Taxi / Cab" },
  { value: "own_vehicle", label: "Own Vehicle" },
  { value: "rental_two_wheeler", label: "Rental Two-Wheeler" },
  { value: "combination", label: "Combination" },
];

export const MEAL_OPTIONS: { value: MealPreference; label: string }[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "non_vegetarian", label: "Non-Vegetarian" },
  { value: "jain", label: "Jain" },
  { value: "halal", label: "Halal" },
  { value: "no_preference", label: "No Preference" },
];

export const CURRENCY_OPTIONS = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "JPY", "AUD"];
