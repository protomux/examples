import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
  useSearchParams,
  Link,
} from "react-router-dom";
import { useChat } from "./useChatClient";
import { PresenceEvent } from "./gen/proto/chat";

function ChatRoom() {
  const { room = "general" } = useParams();
  const [search] = useSearchParams();
  const user = search.get("user") || "anonymous";

  const { messages, presence, errors, send, clearErrors } = useChat(room, user);
  const [draft, setDraft] = useState("");

  return (
    <div style={{ fontFamily: "sans-serif", padding: 16 }}>
      <h1>Room: {room}</h1>
      <div style={{ marginBottom: 8 }}>
        <Link to="/" style={{ marginRight: 12 }}>
          &larr; Rooms
        </Link>
        <span>User: {user}</span>
      </div>
      <div style={{ marginBottom: 12 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="message"
          style={{ width: 300 }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              send(draft);
              setDraft("");
            }
          }}
        />
        <button
          onClick={() => {
            send(draft);
            setDraft("");
          }}
        >
          Send
        </button>
      </div>
      <h3>Messages</h3>
      <ul>
        {messages.map((m, i) => (
          <li key={i}>
            <strong>{m.user}</strong>: {m.text}{" "}
            <em style={{ color: "#666" }}>
              {new Date(Number(m.tsUnixMs)).toLocaleTimeString()}
            </em>
          </li>
        ))}
      </ul>
      {errors.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3>Errors <button onClick={clearErrors} style={{ marginLeft: 8 }}>clear</button></h3>
          <ul>
            {errors.map((e, i) => (
              <li key={i} style={{ color: '#b00020' }}>
                [{new Date(e.ts).toLocaleTimeString()}] {e.code !== undefined ? `code ${e.code}: ` : ''}{e.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      <h3>Presence</h3>
      <ul>
        {presence.map((p: PresenceEvent, i) => (
          <li key={i}>
            {p.user} {p.action === 1 ? "joined" : p.action === 2 ? "left" : ""}{" "}
            <em style={{ color: "#666" }}>
              {new Date(Number(p.tsUnixMs)).toLocaleTimeString()}
            </em>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoomSelect() {
  const [room, setRoom] = useState("general");
  const [user, setUser] = useState("alice");
  const navigate = useNavigate();

  const enter = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/room/${encodeURIComponent(room)}?user=${encodeURIComponent(user)}`);
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: 16 }}>
      <h1>Select Room</h1>
      <form onSubmit={enter}>
        <div style={{ marginBottom: 8 }}>
          <label>
            Room:{" "}
            <input value={room} onChange={(e) => setRoom(e.target.value)} />
          </label>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>
            User:{" "}
            <input value={user} onChange={(e) => setUser(e.target.value)} />
          </label>
        </div>
        <button type="submit">Enter</button>
      </form>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoomSelect />} />
        <Route path="/room/:room" element={<ChatRoom />} />
      </Routes>
    </BrowserRouter>
  );
}
