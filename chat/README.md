# Chat Example

Demonstrates a real-time chat application using Protomux's pub/sub features. This example shows how to build interactive, multi-user applications with server-side event broadcasting.

## Overview

This example implements a real-time chat system with multiple rooms. It demonstrates:
- WebSocket RPCs (`SendMessage`, `JoinRoom`) registered with `RegisterProto`
- Topic-based pub/sub publishing of `MessageEvent` and `PresenceEvent`
- React client subscribing to `chat:room:<room>`
- External HTTP API for posting messages via REST

## Features

- **Real-time Messaging**: Messages are broadcast to all subscribers in a room
- **Presence Events**: JOIN/LEAVE events when users connect/disconnect
- **Room Isolation**: Each room has its own topic for independent message streams
- **External HTTP API**: Post messages from outside WebSocket (e.g., bots, webhooks)
- **Topic-based Subscriptions**: Clients subscribe to specific room topics

## Protobuf Definitions

Definition: `proto/chat.proto`

### Generating Go Types

From repo root (ensure protoc plugins installed):
```bash
protoc \
  --go_out=paths=source_relative:examples/chat/server/generated \
  --go-grpc_out=paths=source_relative:examples/chat/server/generated \
  examples/chat/proto/chat.proto
```

### Generating TypeScript Types

From `examples/chat/client-react`:

```bash
npm run codegen
```

### Handler Registration

Register handlers using `RegisterProto`:

```go
app.RegisterProto(&chatpb.SendMessageRequest{}, &chatpb.SendMessageResponse{}, 
  func(c *protomux.Ctx, msg proto.Message) (proto.Message, error) {
    r := msg.(*chatpb.SendMessageRequest)
    event := &chatpb.MessageEvent{
      Room: r.GetRoom(), 
      User: r.GetUser(), 
      Text: r.GetText(), 
      TsUnixMs: time.Now().UnixMilli(),
    }
    app.Publish(topicForRoom(r.GetRoom()), "examples.chat.MessageEvent", event)
    return &chatpb.SendMessageResponse{Status: "ok"}, nil
  })
```

### Event Publishing

Published events use fully qualified proto message names as type names. Subscribers receive them as server push messages (correlation ID = 0).

**Event types:**
- `examples.chat.MessageEvent` – sent when a message is posted
- `examples.chat.PresenceEvent` – sent when users join/leave rooms

**Topic pattern:** `chat:room:<room_name>`

## Run Server

```bash
cd examples/chat/server
go run .
```

**WebSocket endpoint:** `ws://localhost:8085/ws`  
**HTTP API:** `http://localhost:8085/api/rooms/{id}`  
**Subprotocol:** `protomux.v1`

### HTTP Send Message (External API)

You can post messages to a room via HTTP (useful for bots or integrations):

```bash
curl -X POST http://localhost:8085/api/rooms/general \
  -H 'Content-Type: application/json' \
  -d '{"user":"bot","text":"hello from curl"}'
```

## Run React Client

```bash
cd examples/chat/client-react
npm install   # first time only
npm run dev
```

**Open:** http://localhost:5174

Change room/user fields in the UI to join different rooms. Messages appear in real-time. Open multiple browser tabs to simulate different users chatting.

## How It Works

### Topic Subscriptions

Clients subscribe to room-specific topics when joining:

```typescript
// Client subscribes to a room topic
ws.send(envelope({ 
  correlationId: 1, 
  topic: 'chat:room:general' 
}));
```

### Server-Side Publishing

When a message is sent, the server publishes events to all subscribers:

```go
// Publish message event to all subscribers of the topic
app.Publish(
  topicForRoom(room),  // "chat:room:general"
  "examples.chat.MessageEvent", 
  messageEvent
)
```

### Client Event Handling

Clients receive events as server push messages (correlation ID = 0):

```typescript
// Handle incoming events
if (msg.correlationId === 0) {
  // Server push event
  if (msg.typeName === 'examples.chat.MessageEvent') {
    const event = MessageEvent.decode(msg.payload);
    // Update UI with new message
  }
}
```

## Next Steps

- Add user authentication (see [JWT example](../jwt/README.md))
- Implement message persistence with a database
- Add private messaging between users
- Implement typing indicators using presence events
- Add rate limiting for message sending (see `middleware/ratelimit`)
- Add message history retrieval

## Related Documentation

- [Main Protomux README](../../protomux/README.md) - Framework documentation
- [Pub/Sub Features](../../protomux/README.md#pubsub) - Pub/sub pattern details
- [Examples Overview](../README.md) - All available examples
