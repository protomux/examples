# Basic Service Example

Demonstrates a simple Book service over a single WebSocket using **protomux** (and optionally gRPC if you wire it). It includes:

- Protobuf request/response handlers (`ListBooks`, `CreateBook`) registered with `app.RegisterProtoTyped`
- In‑memory store decoupled from generated proto types
- Manual TypeScript codecs + WebSocket client speaking the binary envelope
- (Optional) Dual transport: you can expose the same service via gRPC alongside the websocket

## Layout
```
examples/basic/
  proto/                # .proto definitions
  server/               # Go server (handlers, db, main)
    db.go
    main.go
  client/               # TypeScript demo client
    package.json
    src/
      protomux.ts       # Envelope + client
      book_service.ts   # Manual protobuf codecs
      main.ts           # Demo script
  generated/ (optional) # If you choose to place generated Go here (see notes)
```

Generated Go types are placed in `examples/basic/generated` (see `option go_package = "github.com/protomux/examples/basic/generated;bookpb"` in the proto).

## Protobuf Definitions
`proto/book_service.proto` (simplified excerpt):
```proto
syntax = "proto3";
package examples.book;
option go_package = "github.com/protomux/examples/basic/generated;bookpb";

message ListBooksRequest {}
message Book { int32 id = 1; string title = 2; }
message ListBooksResponse { repeated Book books = 1; }
message CreateBookRequest { string title = 1; }
message CreateBookResponse { Book book = 1; }
```

## Generating Go Types (protoc direct)
From repo root (ensure `protoc`, `protoc-gen-go`, `protoc-gen-go-grpc` in PATH):
```bash
mkdir -p examples/basic/generated
protoc \
  --go_out=paths=source_relative:examples/basic/generated \
  --go-grpc_out=paths=source_relative:examples/basic/generated \
  examples/basic/proto/book_service.proto
```
Run `go mod tidy` inside `examples/basic/server` after generation.

## TypeScript Types (Generated)
The Node client (`examples/basic/client-node`) generates TypeScript types with [ts-proto]. Output goes to `src/gen/proto`.

Generate (from `examples/basic/client-node` directory):
```bash
npm run gen:clean
```
Underlying command (for reference):
```bash
protoc -I.. \
  --ts_proto_out=src/gen \
  --ts_proto_opt=esModuleInterop=true,outputServices=none,useExactTypes=false \
  ../proto/book_service.proto
```
Import examples:
```ts
import { ListBooksRequest, CreateBookRequest } from './gen/proto/book_service';
```
Fully-qualified message names used on the wire:
```
examples.book.ListBooksRequest
examples.book.ListBooksResponse
examples.book.CreateBookRequest
examples.book.CreateBookResponse
```

## Envelope Format (Client & Server)
```
Byte 0:   Version (1)
Byte 1:   Flags (bitfield, 0 for now)
Varint:   Correlation ID (cid) (0 for push / unsolicited)
Varint:   Type name length (N)
N bytes:  UTF-8 type name
Varint:   Payload length (M)
M bytes:  Payload (protobuf binary)
```

## Registering Handlers (Go)
Example using the reflective typed registration helper:
```go
app.RegisterProtoTyped(&bookpb.ListBooksRequest{}, &bookpb.ListBooksResponse{}, func(c *protomux.Ctx, req *bookpb.ListBooksRequest) (*bookpb.ListBooksResponse, error) {
  books := db.List()
  out := make([]*bookpb.Book, 0, len(books))
  for _, b := range books { out = append(out, &bookpb.Book{Id: b.ID, Title: b.Title}) }
  return &bookpb.ListBooksResponse{Books: out}, nil
})
app.RegisterProtoTyped(&bookpb.CreateBookRequest{}, &bookpb.CreateBookResponse{}, func(c *protomux.Ctx, req *bookpb.CreateBookRequest) (*bookpb.CreateBookResponse, error) {
  b := db.Create(req.GetTitle())
  return &bookpb.CreateBookResponse{Book: &bookpb.Book{Id: b.ID, Title: b.Title}}, nil
})
```

## Running the Go Server
Terminal 1:
```bash
cd examples/basic/server
go run .
```
WebSocket endpoint: `ws://localhost:3000/ws` (if you set `HTTPAddr: ":3000"` in config) or `:8080` for the default.

## Running the TypeScript Client
Install deps & run (Terminal 2):
```bash
cd examples/basic/client
npm install   # only first time
npm run build && node dist/main.js
# or live:
npm run dev   # uses ts-node
```
Expected output:
```
books: []            # initial list
created: { id: 1, title: 'TS Client Book' }
books: [...]         # if you re-run list after creation
```

## Regenerating After Proto Changes
1. Re-run the protoc commands above for Go.
2. Update manual TS codecs if message schema changed (fields, numbers).
3. Rebuild TS client.

## Troubleshooting
- Error: unknown type on server → ensure type string constants exactly match proto fully-qualified names.
- Client hangs on request → check server running and WebSocket path (`/ws`).
- Module import errors in TS build → NodeNext + CommonJS interop handled via default import of `protobufjs/minimal.js`; keep that pattern.

## Next Steps
- Replace manual TS codecs with a protoc TS plugin (e.g., `protoc-gen-es`).
- Add push message example (cid=0) for server-initiated updates.
- Add error frame handling in client (currently ignored).
