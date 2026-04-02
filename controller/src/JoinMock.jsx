// DEV ONLY — remove when real client exists
import {
  leave,
  removeAllRooms,
} from "../../saas-adapter/src/index";

export default function JoinMock({ sessionId, headsets }) {

  async function removeAll() {
    const mocks = headsets.filter((h) => h.id?.startsWith(""));
    for (const h of mocks) {
      await leave(sessionId, h.id);
    }
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
      <button className="" onClick={removeAll} >
        Clear headsets
      </button>
      <button className="" onClick={handleRemoveAllRooms}>
        Remove rooms
      </button>
    </div>
  );
}
