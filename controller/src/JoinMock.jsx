// DEV ONLY — remove when real client exists
import { useEffect, useRef, useState } from "react";
import {
  join,
  leave,
  heartbeat,
  removeAllRooms,
} from "../../saas-adapter/src/index";

export default function JoinMock({ sessionId, headsets }) {
  const counter = useRef(1);
  // const statusRef = useRef("online");
  // const [timerActive, setTimerActive] = useState(false);

  // useEffect(() => {
  //   if (!timerActive) return;
  //   const interval = setInterval(() => {
  //     statusRef.current = statusRef.current === "online" ? "offline" : "online";
  //     heartbeat(sessionId, "mock-headset-1", statusRef.current);
  //   }, 5000);
  //   return () => clearInterval(interval);
  // }, [timerActive, sessionId]);

  // async function addHeadset() {
  //   const n = counter.current++;
  //   await join(sessionId, `mock-headset-${n}`, `Headset ${n}`);
  // }

  async function removeAll() {
    const mocks = headsets.filter((h) => h.id?.startsWith(""));
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
        right: 16,
        display: "flex",
        gap: 8,
        zIndex: 9999,
      }}
    >
      <button className="efab" onClick={removeAll}>
        Clear headsets
      </button>
      <button className="efab" onClick={handleRemoveAllRooms}>
        remove rooms
      </button>
    </div>
  );
}
