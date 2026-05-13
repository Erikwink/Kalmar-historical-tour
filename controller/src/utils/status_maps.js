/** Possible status values for a connected headset client. 
 *  Used in headsetList.jsx, HeadsetStatusBar.jsx, Settingspage.jsx
*/
export const HEADSET_STATUS = {
  ONLINE:      'online',
  NOT_READY:   'not-ready',
  CONNECTING:  'connecting',
  ERROR:       'error',
  OFFLINE:     'offline',
}

/** Possible connection states for the Firebase adapter. 
 *  Used in App.jsx
*/
export const FIREBASE_STATUS = {
  CONNECTED:  "connected",
  CONNECTING: "connecting",
  ERROR:      "error",
}
/** Maps control type strings to Material Symbols icon names.
 *  Used in SceneCard.jsx, ActiveSceneChip.jsx
 */
export const CONTROL_ICONS = {
  "360-photo":  "panorama",
  "360-video":  "panorama",
  "flat-video": "videocam",
  "audio":      "music_note",
  "narration":  "record_voice_over",
};

/** Maps HEADSET_STATUS values to i18n translation keys.
 *  Used in headsetList.jsx, HeadsetStatusBar.jsx
 */
export const STATUS_LABEL_KEY = {
  [HEADSET_STATUS.ONLINE]:     'overviewPage.headsetOnline',
  [HEADSET_STATUS.NOT_READY]:  'overviewPage.headsetNotReady',
  [HEADSET_STATUS.CONNECTING]: 'overviewPage.headsetConnecting',
  [HEADSET_STATUS.OFFLINE]:    'overviewPage.headsetOffline',
  [HEADSET_STATUS.ERROR]:      'overviewPage.headsetError',
}

/** Maps a headset's raw status to a display status.
 *  Used in headsetList.jsx, HeadsetStatusBar.jsx, Settingspage.jsx
 * @param {{ status: string }} headset
 * @returns {string} display status key from HEADSET_STATUS
 */
export function resolveStatus(headset) {
  if (headset.status === HEADSET_STATUS.OFFLINE) return HEADSET_STATUS.OFFLINE
  return headset.status
}