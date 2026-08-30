import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { createEmptyTripPlan, type TripPlan } from "./types";

const STORAGE_KEY = "tripcraft.plan.v1";

interface TripPlanContextValue {
  plan: TripPlan;
  hydrated: boolean;
  updatePlan: (patch: Partial<TripPlan>) => void;
  updateSection: <K extends keyof TripPlan>(key: K, patch: Partial<TripPlan[K]>) => void;
  resetPlan: () => void;
}

const TripPlanContext = createContext<TripPlanContextValue | null>(null);

export function TripPlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<TripPlan>(createEmptyTripPlan);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TripPlan>;
        setPlan((current) => {
          const merged = { ...current } as unknown as Record<string, unknown>;
          const currentRecord = current as unknown as Record<string, unknown>;
          for (const [key, value] of Object.entries(parsed)) {
            const base = currentRecord[key];
            merged[key] =
              value && typeof value === "object" && !Array.isArray(value) && base && typeof base === "object"
                ? { ...(base as object), ...(value as object) }
                : value;
          }
          return merged as unknown as TripPlan;
        });
      }
    } catch {
      // ignore corrupted local state
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    } catch {
      // storage unavailable — in-memory state still works
    }
  }, [plan, hydrated]);

  const updatePlan = useCallback((patch: Partial<TripPlan>) => {
    setPlan((current) => ({ ...current, ...patch }));
  }, []);

  const updateSection = useCallback(
    <K extends keyof TripPlan>(key: K, patch: Partial<TripPlan[K]>) => {
      setPlan((current) => ({
        ...current,
        [key]: { ...(current[key] as object), ...(patch as object) } as TripPlan[K],
      }));
    },
    [],
  );

  const resetPlan = useCallback(() => setPlan(createEmptyTripPlan()), []);

  const value = useMemo(
    () => ({ plan, hydrated, updatePlan, updateSection, resetPlan }),
    [plan, hydrated, updatePlan, updateSection, resetPlan],
  );

  return <TripPlanContext.Provider value={value}>{children}</TripPlanContext.Provider>;
}

export function useTripPlan() {
  const ctx = useContext(TripPlanContext);
  if (!ctx) throw new Error("useTripPlan must be used within a TripPlanProvider");
  return ctx;
}
