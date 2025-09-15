# Chat Example

Demonstrates a realtime chat using Protomux:
- WebSocket RPCs (`SendMessage`, `JoinRoom`) registered with `RegisterProtoTyped`
- Topic publishing of `MessageEvent` and `PresenceEvent`
- React client subscribing to `chat:room:<room>`
- External HTTP endpoint for posting messages

## Run server
```
cd examples/chat/server
go run .
```
Server listens on :8085

### HTTP send message
```
curl -X POST http://localhost:8085/rooms/general/messages \
  -H 'Content-Type: application/json' \
  -d '{"user":"bob","text":"hello from curl"}'
```

## Run React client
```
cd examples/chat/client-react
npm install
npm run dev
```
Open http://localhost:5174

Change room / user fields, messages appear in list. Multiple browser tabs emulate different users.

## Protobuf
Definition: `examples/chat/proto/chat.proto`.

Generate Go types (from repo root, ensure protoc plugins installed):
```bash
protoc \
  --go_out=paths=source_relative:examples/chat/server/generated \
  --go-grpc_out=paths=source_relative:examples/chat/server/generated \
  examples/chat/proto/chat.proto
```

Register handlers with typed wrapper:
```go
app.RegisterProtoTyped(&chatpb.SendMessageRequest{}, &chatpb.SendMessageResponse{}, func(c *protomux.Ctx, r *chatpb.SendMessageRequest) (*chatpb.SendMessageResponse, error) { /* ... */ })
```

## Events
Published type names correspond to fully qualified proto messages, e.g. `examples.chat.MessageEvent`.

## Next Steps
- Persist recent history and send on `JoinRoom`
- Add authentication layer (see JWT example)
- Implement presence counts broadcast

