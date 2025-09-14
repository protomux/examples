# Basic Example Server (Dual Transport)

This example now exposes the same book operations over two transports:

- Protomux (websocket) at `ws://localhost:3000/ws`
- gRPC at `localhost:4000` (BookService)

## Services

Book operations:
- ListBooks
- CreateBook

Health & reflection are enabled on the gRPC server (dev only).

## Run

```bash
go run .
```

Then connect:

### Protomux (existing JS clients)
Browser / React client already points at `ws://localhost:3000/ws`.

### gRPC (e.g. evans or grpcurl)
```bash
grpcurl -plaintext localhost:4000 list
grpcurl -plaintext -d '{}' localhost:4000 examples.book.BookService/ListBooks
grpcurl -plaintext -d '{"title":"New Book"}' localhost:4000 examples.book.BookService/CreateBook
```

## Shutdown
Ctrl+C triggers graceful stop of both servers.

