# Examples

This repository currently includes two kinds of examples demonstrating protomux usage.

## 1. Book Service (Full Stack)
Path: `examples/basic`
- Go server with BookService (ListBooks, CreateBook)
- Manual TypeScript protobuf codecs + WebSocket client
- Shows envelope framing, request/response, in-memory domain model

See `examples/basic/README.md` for:
- Protoc Go generation commands
- Manual TS codec explanation
- How to run server & client

## 2. Minimal Item Service (Server Only)
Path: `protomux/protomux/examples/basic`
- Tiny in-repo module (`module basic`)
- Single proto (`item_service.proto`) -> generated Go in `generated/`
- Focus: smallest registration + handler flow

See `protomux/protomux/examples/basic/README.md` for generation & run steps.

## Generation Summary
Both examples use direct `protoc` invocation (no buf):
```
protoc --go_out=paths=source_relative:OUTPUT --go-grpc_out=paths=source_relative:OUTPUT FILE.proto
```
TypeScript in the Book example is hand-written with `protobufjs/minimal`.

## Choosing An Example
- Start with Book Service to understand end-to-end cross-language flow.
- Use Minimal Item Service to experiment quickly with handler logic inside the repo.

## Future Ideas
- Add streaming / server push example (cid=0 frames)
- Provide protoc TS plugin example alongside manual codecs
- Show JWT auth + rate limiting middleware usage in an example
