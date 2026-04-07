/**
 * Session storage keys
 */
export const SESSION_STORAGE_KEY = "headset_client_id";
export const SESSION_ID_KEY = "headset_session_id";
export const ACTIVE_SESSION_KEY = "headset_active_session_id";
export const LABEL_KEY = "headset_label";
export const DEFAULT_SCENE_ID = "waiting";

/**
 * Normalizes session ID by removing non-digits and limiting to 6 characters.
 * @param {string} raw - The raw session ID
 * @returns {string} Normalized session ID
 */
export function normalizeSessionId(raw) {
  return (raw || "").replace(/\D/g, "").slice(0, 6);
}

/**
 * Returns a stable unique client ID for this headset.
 * Reuses the ID from sessionStorage if it exists, otherwise generates a new one.
 * @returns {string} A unique client ID.
 */
export function getOrCreateHeadsetId() {
  const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const newId = crypto.randomUUID();
  sessionStorage.setItem(SESSION_STORAGE_KEY, newId);
  return newId;
}
