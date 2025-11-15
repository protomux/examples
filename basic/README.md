# Basic Service Example

Demonstrates a simple Book service over a single WebSocket using **protomux**. This example shows the fundamentals of building a protobuf-based RPC service with TypeScript clients.

## Overview

This example implements a basic CRUD service for managing books. It demonstrates:
- Protobuf request/response handlers (`ListBooks`, `CreateBook`)
- In-memory store decoupled from generated proto types
- TypeScript clients (Node.js and React) with generated protobuf types
- WebSocket client speaking the binary envelope protocol

## Features

- **Request/Response RPC**: Simple protobuf-based RPC pattern
- **TypeScript Code Generation**: Automated type generation using ts-proto
- **Multiple Client Types**: Both CLI (Node.js) and web (React) clients
- **In-Memory Storage**: Simple book storage demonstrating data persistence patterns

## Layout
```
examples/basic/
  proto/                # .proto definitions
    book_service.proto
  server/               # Go server (handlers, db, main)
    db.go
    main.go
    generated/          # Generated Go protobuf types
  client-node/          # Node.js TypeScript client
    src/
      main.ts
      gen/proto/        # Generated TypeScript types
  client-react/         # React client
    src/
      App.tsx
      gen/proto/        # Generated TypeScript types
```

## Protobuf Definitions

`proto/book_service.proto` defines the service messages:

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

### Generating Go Types

From repo root (ensure `protoc`, `protoc-gen-go`, `protoc-gen-go-grpc` in PATH, see https://grpc.io/docs/languages/go/quickstart/):

```bash
protoc \
  --go_out=paths=source_relative:examples/basic/server/generated \
  --go-grpc_out=paths=source_relative:examples/basic/server/generated \
  examples/basic/proto/book_service.proto
```
Run `go mod tidy` inside `examples/basic/server` after generation.

### Generating TypeScript Types

Both clients generate TypeScript types using ts-proto. Output goes to `src/gen/proto/`.

**For Node client** (from `examples/basic/client-node` directory):

```bash
npm run codegen
```

**For React client** (from `examples/basic/client-react` directory):

```bash
npm run codegen
```

**Import example:**

```ts
import { ListBooksRequest, CreateBookRequest } from './gen/proto/book_service';
```

<details>
<summary>Underlying protoc command</summary>

```bash
protoc -I../proto \
  --plugin=./node_modules/.bin/protoc-gen-ts_proto \
  --ts_proto_out=src/gen \
  --ts_proto_opt=esModuleInterop=true,outputServices=none,useExactTypes=false \
  ../proto/book_service.proto
```
</details>

## Run Server

```bash
cd examples/basic/server
go run .
```

**WebSocket endpoint:** `ws://localhost:3000` (any path, commonly `/ws`)  
**Subprotocol:** `protomux.v1`

The server uses `SetOriginPatterns([]string{"localhost:*"})` to allow local client connections.

## Run Clients

### Node.js Client

```bash
cd examples/basic/client-node
npm install   # first time only
npm run dev
```

**Expected output:**

```
Listing books...
Books: []
Creating book...
Book created: { id: 1, title: 'Example Book' }
```

### React Client

```bash
cd examples/basic/client-react
npm install   # first time only
npm run dev
```

**Open:** http://localhost:5173

You can list books and create new ones via the UI.

## Troubleshooting

- **Unknown type error on server**: Ensure TypeScript client uses correct fully-qualified message names (e.g., `examples.book.ListBooksRequest`)
- **Client hangs on request**: Check that server is running and WebSocket URL is correct
- **Connection refused**: Verify server is listening on the expected port (`:3000` by default)
- **CORS errors**: The server uses `SetOriginPatterns([]string{"localhost:*"})` which should allow local development

## Next Steps

- Add authentication (see [JWT example](https://github.com/protomux/examples/tree/main/jwt))
- Implement server push notifications (correlation ID = 0)
- Add subscription/pub-sub features (see [Chat example](https://github.com/protomux/examples/tree/main/chat))
- Add error handling and retry logic in clients
- Implement admission control (see [Thundering Herd example](https://github.com/protomux/examples/tree/main/thunderingherd))

## Related Documentation

- [Main Protomux README](https://github.com/protomux/protomux) - Framework documentation
- [Examples Overview](https://github.com/protomux/examples) - All available examples
