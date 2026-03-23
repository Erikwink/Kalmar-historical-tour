// DEV ONLY — remove when real client exists
import { useEffect, useRef, useState } from "react";
import {
  join,
  leave,
  heartbeat,
  connect,
  removeAllRooms,
} from "../../saas-adapter/src/index";

export default function JoinMock({ sessionId, headsets }) {
/*   const counter = useRef(1);
  const statusRef = useRef("online");
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      statusRef.current = statusRef.current === "online" ? "offline" : "online";
      heartbeat(sessionId, "mock-headset-1", statusRef.current);
    }, 5000);
    return () => clearInterval(interval);
  }, [timerActive, sessionId]);

  async function addHeadset() {
    try {
      await connect(sessionId);
      await join(sessionId, `mock-headset-1`, `Mock Headset`);
      setTimerActive(true);
    } catch (e) {
      console.error("Error adding headset:", e.message);
    }
  } */

  async function removeAll() {
    setTimerActive(false);
    const mocks = headsets.filter((h) => h.id?.startsWith("mock"));
    for (const h of mocks) {
      await leave(sessionId, h.id);
    }
    counter.current = 1;
  }

  async function handleRemoveAllRooms() {
    await removeAllRooms();
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: "25%",
        display: "flex",
        alignContent: "center",
        gap: 8,
        zIndex: 9999,
      }}
    >
      <button className="efab efab--outline" onClick={removeAll} style={{ width: 'auto', padding: '0 16px', height: '48px' }}>
        Clear headsets
      </button>
      <button className="efab efab--danger" onClick={handleRemoveAllRooms} style={{ width: 'auto', padding: '0 16px', height: '48px' }}>
        Remove rooms
      </button>
    </div>
  );
}
