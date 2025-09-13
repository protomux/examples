# Book Service Example

This example shows a simple Book service over a single WebSocket using **protomux**. It demonstrates:

- Protobuf request/response handlers (ListBooks, CreateBook)
- In‑memory domain model decoupled from generated proto types
- Manual TypeScript codecs + WebSocket client speaking the binary envelope

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

Currently the Go code for BookService may still reference the older path (`server/gen/go/...`). You can standardize to `generated/` by adjusting the `go_package` option and re‑running generation (steps below).

## Protobuf Definitions
`proto/book_service.proto` (simplified excerpt):
```proto
syntax = "proto3";
package examples.book;
option go_package = "github.com/protomux/examples/basic/server/gen/go/proto;bookpb"; // adjust if relocating outputs

message ListBooksRequest {}
message Book { int32 id = 1; string title = 2; }
message ListBooksResponse { repeated Book books = 1; }
message CreateBookRequest { string title = 1; }
message CreateBookResponse { Book book = 1; }
```

## Generating Go Types (protoc direct)
From repo root (ensure `protoc`, `protoc-gen-go`, `protoc-gen-go-grpc` in PATH):
```bash
protoc \
  --go_out=paths=source_relative:examples/basic/server/gen/go/proto \
  --go-grpc_out=paths=source_relative:examples/basic/server/gen/go/proto \
  examples/basic/proto/book_service.proto
```
If you change `option go_package` to use a `generated` folder:
```bash
# Edit proto: option go_package = "github.com/protomux/examples/basic/generated;bookpb";
mkdir -p examples/basic/generated
protoc \
  --go_out=paths=source_relative:examples/basic/generated \
  --go-grpc_out=paths=source_relative:examples/basic/generated \
  examples/basic/proto/book_service.proto
```
Run `go mod tidy` inside `examples/basic/server` after relocating output paths.

## Manual TypeScript Types
Instead of a TS protoc plugin, the client uses a hand‑written minimal codec (`client/src/book_service.ts`) built on `protobufjs/minimal`.

Key exported constants map to fully‑qualified proto names used in routing:
```
TYPE_LIST_BOOKS_REQ  = examples.book.ListBooksRequest
TYPE_LIST_BOOKS_RESP = examples.book.ListBooksResponse
TYPE_CREATE_BOOK_REQ = examples.book.CreateBookRequest
TYPE_CREATE_BOOK_RESP= examples.book.CreateBookResponse
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

## Running the Go Server
Terminal 1:
```bash
cd examples/basic/server
go run .
```
(Default listens on :8080 and upgrades at /ws.)

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
