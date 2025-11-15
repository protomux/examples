import React, { useCallback, useEffect, useRef, useState } from "react";
import { ProtomuxClient } from "@protomux/client";
import {
  ListBooksRequest,
  ListBooksResponse,
  CreateBookRequest,
  CreateBookResponse,
} from "./gen/proto/book_service";

interface AddBookFormProps {
  client: ProtomuxClient | null;
  onBookAdded: () => void;
  onError: (error: string) => void;
}

function AddBookForm({ client, onBookAdded, onError }: AddBookFormProps) {
  const [title, setTitle] = useState("");

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!client || !title.trim()) return;
      try {
        await client.send(
          "examples.book.CreateBookRequest",
          { title } as CreateBookRequest,
          CreateBookRequest,
          CreateBookResponse
        );
        setTitle("");
        onBookAdded();
      } catch (e: any) {
        onError(e.message || String(e));
      }
    },
    [title, client, onBookAdded, onError]
  );

  return (
    <form onSubmit={onSubmit} style={{ marginBottom: "1rem" }}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
      />
      <button type="submit">Add</button>
    </form>
  );
};

export function App() {
  const [books, setBooks] = useState<{ id: number; title: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);
  const clientRef = useRef<ProtomuxClient | null>(null);

  const listBooks = useCallback(async (client?: ProtomuxClient) => {
    const c = client || clientRef.current;
    if (!c) return;
    try {
      setLoading(true);
      const res = await c.send(
        "examples.book.ListBooksRequest",
        {},
        ListBooksRequest,
        ListBooksResponse
      );
      setBooks(res.books as any);
      setError(null);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const onPing = useCallback(async () => {
    const c = clientRef.current;
    if (!c) return;
    try {
      setPingResult("...");
      // For non-protobuf endpoints, use sendRaw
      const res = await c.sendRaw("status", new Uint8Array());
      setPingResult(new TextDecoder().decode(res));
    } catch (e: any) {
      setPingResult("error");
      setError(e.message || String(e));
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

      client.onOpen(() => {
        console.log("[ws] open (attempt", attempt, ")");
        listBooks(client).catch((err) => setError(err.message || String(err)));
      });

      client.onClose((info) => {
        console.log("[ws] close", info.code, info.reason);
        if (!stopped && info.code !== 1000) {
          setTimeout(connect, Math.min(5000, 500 * attempt));
        }
      });

      client.onError((ev) => {
        console.log("[ws] error", ev);
      });
    };
    connect();
    return () => {
      stopped = true;
      clientRef.current?.close();
    };
  }, [listBooks]);

  const getReadyStateDisplay = () => {
    const rs = clientRef.current?.readyState;
    if (rs === undefined) return "N/A";
    
    const stateLabels = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    const stateLabel = stateLabels[rs] ?? "UNKNOWN";
    
    return `${rs} (${stateLabel})`;
  };

  return (
    <div style={{ fontFamily: "sans-serif", margin: "2rem", maxWidth: 600 }}>
      <h1>Books</h1>
      <div
        style={{ fontSize: "0.8rem", color: "#666", marginBottom: "0.5rem" }}
      >
        WS state: {getReadyStateDisplay()}
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
        {pingResult && <span>status: {pingResult}</span>}
      </div>
      <AddBookForm
        client={clientRef.current}
        onBookAdded={listBooks}
        onError={setError}
      />
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
}
