/**
 * Generates a 6-digit session ID and saves it to local storage.
 *
 * @returns {string} 6-digit session ID
 */
export default function generateSessionId() {
  const existing = localStorage.getItem("sessionId")
  if (existing) {
    return existing
  } else {
  const sessionId = Math.floor(100000 + Math.random() * 900000).toString()
  localStorage.setItem("sessionId", sessionId)
  return sessionId
  }
  //return "123456"
}