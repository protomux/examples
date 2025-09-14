import { useEffect, useRef, useState, useCallback } from 'react';
import { ProtomuxClient } from '@protomux/client';
import { MessageEvent as ChatMessageEvent, PresenceEvent, SendMessageRequest, JoinRoomRequest } from './gen/proto/chat';

export interface UseChatResult {
  messages: ChatMessageEvent[];
  presence: PresenceEvent[];
  send: (text: string) => void;
}

export function useChat(room: string, user: string): UseChatResult {
  let client: ProtomuxClient | undefined = undefined;
  const [messages, setMessages] = useState<ChatMessageEvent[]>([]);
  const [presence, setPresence] = useState<PresenceEvent[]>([]);

  const connect = useCallback(() => {
    client?.close();
    client = new ProtomuxClient('ws://localhost:8085/ws');
    (async () => {
      await client.subscribe(topic(room));
      client.on('examples.chat.MessageEvent', (bytes) => {
        const msg = ChatMessageEvent.decode(bytes);
        setMessages(m => [...m, msg]);
      });
      client.on('examples.chat.PresenceEvent', (bytes) => {
        const evt = PresenceEvent.decode(bytes);
        setPresence(p => [...p, evt]);
      });
      const joinRoom: JoinRoomRequest = { room, user };
      const joinRoomBytes = JoinRoomRequest.encode(joinRoom).finish();
      await client.rawSend('examples.chat.JoinRoomRequest', joinRoomBytes);
    })();
  }, [room, user]);

  useEffect(() => {
    connect();
    return () => {
        client?.close();
    };
  }, [connect]);

  const send = useCallback((text: string) => {
    const msg: SendMessageRequest = { room, user, text };
    const msgBytes = SendMessageRequest.encode(msg).finish();
    client?.rawSend('examples.chat.SendMessageRequest', msgBytes);
  }, [room, user]);

  return { messages, presence, send };
}

function topic(r: string) { 
    return 'chat:room:' + r; 
}
