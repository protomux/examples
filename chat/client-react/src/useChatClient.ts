import { useEffect, useRef, useState, useCallback } from "react";
import { ProtomuxClient, ProtomuxError } from "@protomux/client";
import {
  MessageEvent as ChatMessageEvent,
  PresenceEvent,
  SendMessageRequest,
  JoinRoomRequest,
  JoinRoomResponse,
  SendMessageResponse,
} from "./gen/proto/chat";

export interface UseChatResult {
  messages: ChatMessageEvent[];
  presence: PresenceEvent[];
  errors: { ts: number; code?: number; message: string }[];
  send: (text: string) => void;
  clearErrors: () => void;
}

export function useChat(room: string, user: string): UseChatResult {
  const clientRef = useRef<ProtomuxClient | null>(null);
  const [messages, setMessages] = useState<ChatMessageEvent[]>([]);
  const [presence, setPresence] = useState<PresenceEvent[]>([]);
  const [errors, setErrors] = useState<
    { ts: number; code?: number; message: string }[]
  >([]);

  const connect = useCallback(() => {
    // Close previous if exists
    if (clientRef.current) {
      try {
        clientRef.current.close();
      } catch {}
      clientRef.current = null;
    }
    const client = new ProtomuxClient("ws://localhost:8085/ws", {
      onError: (err) => handleError(err),
      onClose: (info: { code: number; reason: string; wasClean: boolean }) => {
        const msg = `connection closed${
          info.code ? " (" + info.code + ")" : ""
        }${info.reason ? ": " + info.reason : ""}`;
        handleError(new Error(msg));
      },
    });
    clientRef.current = client;
    (async () => {
      try {
        await client.subscribe(topic(room));
        client.onMessage(
          "examples.chat.MessageEvent",
          ChatMessageEvent,
          (e) => {
            setMessages((events) => [...events, e]);
          }
        );
        client.onMessage("examples.chat.PresenceEvent", PresenceEvent, (e) => {
          setPresence((events) => [...events, e]);
        });
        await client.send(
          "examples.chat.JoinRoomRequest",
          { room, user } as JoinRoomRequest,
          JoinRoomRequest,
          JoinRoomResponse
        );
      } catch (e) {
        handleError(e);
      }
    })();
  }, [room, user]);

  useEffect(() => {
    connect();
    return () => {
      clientRef.current?.close();
    };
  }, [connect]);

  const send = useCallback(
    (text: string) => {
      if (!text) return;
      const client = clientRef.current;
      if (!client || client.readyState !== 1) {
        // 1 = OPEN
        handleError(new Error("connection not open"));
        return;
      }
      try {
        client.send(
          "examples.chat.SendMessageRequest",
          { room, user, text } as SendMessageRequest,
          SendMessageRequest,
          SendMessageResponse
        );
      } catch (e) {
        handleError(e);
      }
    },
    [room, user]
  );

  const clearErrors = useCallback(() => setErrors([]), []);

  const handleError = (e: unknown) => {
    if (e instanceof ProtomuxError) {
      setErrors((curr) => [
        ...curr,
        { ts: Date.now(), code: e.code, message: e.message },
      ]);
    } else if (e instanceof Error) {
      setErrors((curr) => [...curr, { ts: Date.now(), message: e.message }]);
    } else if (typeof e === "string") {
      setErrors((curr) => [...curr, { ts: Date.now(), message: e }]);
    } else {
      setErrors((curr) => [
        ...curr,
        { ts: Date.now(), message: "Unknown error" },
      ]);
    }
  };

  return { messages, presence, errors, send, clearErrors };
}

function topic(r: string) {
  return "chat:room:" + r;
}
