# Chat Example

Simple chat demonstrating:
- WebSocket subscription via `protomux.subscribe` to topic `chat:room:<room>`
- Publishing events from WebSocket RPC (SendMessage) and external HTTP POST
- React client subscribing and rendering messages

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

## Protocol (temporary JSON)
The RPC `examples.chat.SendMessageRequest` currently expects JSON payload (proto codegen TBD).
Server publishes `chat.message` push events with JSON body matching MessageEvent.

