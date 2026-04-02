import { tours } from "../../tours/index";

export const DEFAULT_TOUR_ID = "kalmar-medeltid";

/**
 * Resolves a requested tour ID against the shared tours registry.
 * Falls back to the development default when the session has not written tourId yet.
 */
export function resolveTour(rawTourId) {
  const requestedTourId = typeof rawTourId === "string" ? rawTourId.trim() : "";
  const directMatch = tours.find((tour) => tour.id === requestedTourId);
  if (directMatch) {
    return {
      requestedTourId,
      resolvedTourId: directMatch.id,
      tour: directMatch,
      usedFallback: false,
    };
  }

  const fallbackTour = tours.find((tour) => tour.id === DEFAULT_TOUR_ID) ?? tours[0] ?? null;
  return {
    requestedTourId,
    resolvedTourId: fallbackTour?.id ?? DEFAULT_TOUR_ID,
    tour: fallbackTour,
    usedFallback: true,
  };
}
