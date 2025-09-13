import React, { useCallback, useEffect, useRef, useState } from "react";
import { ProtomuxClient, encodeMessage, decodeMessage } from "@protomux/client";
import {
  ListBooksRequest,
  ListBooksResponse,
  CreateBookRequest,
} from "./gen/proto/book_service";

const TYPE_LIST_BOOKS_REQ = "examples.book.ListBooksRequest";
const TYPE_CREATE_BOOK_REQ = "examples.book.CreateBookRequest";

// encodeMessage / decodeMessage now provided by @protomux/client

export const App: React.FC = () => {
  const [books, setBooks] = useState<{ id: number; title: string }[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);
  const clientRef = useRef<ProtomuxClient | null>(null);

  const listBooks = useCallback(async (client?: ProtomuxClient) => {
    const c = client || clientRef.current;
    if (!c) return;
    try {
      setLoading(true);
      const reqBytes = encodeMessage({}, ListBooksRequest);
      const resBytes = await c.request(TYPE_LIST_BOOKS_REQ, reqBytes);
      const res = decodeMessage<ListBooksResponse>(resBytes, ListBooksResponse);
      setBooks(res.books as any);
      setError(null);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // init client once AFTER listBooks is defined (with basic reconnect)
  useEffect(() => {
    let attempt = 0;
    let stopped = false;

    const connect = () => {
      attempt++;
      const client = new ProtomuxClient("ws://localhost:3000/ws");
      clientRef.current = client;
      const ws: any = (client as any).ws;
      if (ws) {
        ws.addEventListener("open", () => {
          console.log("[ws] open (attempt", attempt, ")");
          listBooks(client).catch((err) =>
            setError(err.message || String(err))
          );
        });
        ws.addEventListener("close", (ev: CloseEvent) => {
          console.log("[ws] close", ev.code, ev.reason);
          if (!stopped && ev.code !== 1000) {
            setTimeout(connect, Math.min(5000, 500 * attempt));
          }
        });
        ws.addEventListener("error", (ev: Event) => {
          console.log("[ws] error", ev);
        });
      }
    };
    connect();
    return () => {
      stopped = true;
      clientRef.current?.close();
    };
  }, [listBooks]);

  const onAdd = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;
      const c = clientRef.current;
      if (!c) return;
      try {
        const reqBytes = encodeMessage(
          { title } as CreateBookRequest,
          CreateBookRequest
        );
        await c.request(TYPE_CREATE_BOOK_REQ, reqBytes);
        setTitle("");
        listBooks();
      } catch (e: any) {
        setError(e.message || String(e));
      }
    },
    [title, listBooks]
  );

  const onPing = useCallback(async () => {
    const c = clientRef.current;
    if (!c) return;
    try {
      setPingResult("...");
      const res = await c.request("ping", new Uint8Array());
      setPingResult(new TextDecoder().decode(res));
    } catch (e: any) {
      setPingResult("error");
      setError(e.message || String(e));
    }
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", margin: "2rem", maxWidth: 600 }}>
      <h1>Books</h1>
      <div
        style={{ fontSize: "0.8rem", color: "#666", marginBottom: "0.5rem" }}
      >
        WS state:{" "}
        {(() => {
          const rs = clientRef.current?.readyState;
          return rs === undefined
            ? "N/A"
            : `${rs} (${
                rs === 0
                  ? "CONNECTING"
                  : rs === 1
                  ? "OPEN"
                  : rs === 2
                  ? "CLOSING"
                  : "CLOSED"
              })`;
        })()}
      </div>
      {error && (
        <div style={{ color: "red", marginBottom: "0.5rem" }}>
          Error: {error}
        </div>
      )}
      {loading && <div style={{ marginBottom: "0.5rem" }}>Loading...</div>}
      <div style={{ marginBottom: "0.75rem" }}>
        <button
          type="button"
          onClick={onPing}
          style={{ marginRight: "0.5rem" }}
        >
          Ping
        </button>
        {pingResult && <span>pong: {pingResult}</span>}
      </div>
      <form onSubmit={onAdd} style={{ marginBottom: "1rem" }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
        />
        <button type="submit">Add</button>
      </form>
      <button onClick={() => listBooks()} style={{ marginBottom: "1rem" }}>
        Refresh
      </button>
      <ul>
        {books.map((b) => (
          <li key={b.id}>
            {b.id}: {b.title}
          </li>
        ))}
      </ul>
    </div>
  );
};
