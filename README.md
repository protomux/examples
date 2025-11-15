# Protomux Examples

This directory contains complete example applications demonstrating different features of the Protomux framework.

## Available Examples

### 1. [Basic Service](./basic/README.md)
**Path:** `examples/basic/`

A simple Book CRUD service demonstrating core protomux functionality:
- Protobuf request/response handlers (`ListBooks`, `CreateBook`)
- TypeScript clients (Node.js and React)

**Run:** `cd basic/server && go run .`  
**Clients:** Node.js (`client-node/`) and React (`client-react/`)

### 2. [Chat Application](./chat/README.md)
**Path:** `examples/chat/`

Real-time chat application showcasing pub/sub features:
- Topic-based subscriptions (`chat:room:<room>`)
- Server-side event publishing (`MessageEvent`, `PresenceEvent`)
- React client with live updates
- External HTTP API for message posting

**Run:** `cd chat/server && go run .`  
**Client:** React app on http://localhost:5174

### 3. [JWT Authentication](./jwt/README.md)
**Path:** `examples/jwt/`

Secure WebSocket with JWT authentication:
- JWT upgrade middleware (`jwt.New`)
- Protected handlers with custom authorization
- Node.js client with Bearer tokens

**Run:** `cd jwt/server && go run .`  
**Client:** Node.js client with JWT token

### 4. [Thundering Herd Protection](./thunderingherd/README.md)
**Path:** `examples/thunderingherd/`

Connection admission control to prevent server overload:
- Rate limiting (`MaxUpgradesPerSec`) for controlled connection acceptance
- Connection caps (`MaxConnections`) to prevent resource exhaustion
- Proper HTTP status codes (429, 503) with Retry-After headers
- Comprehensive tests demonstrating protection behavior

**Run:** `cd thunderingherd/server && go run .`  
**Test:** `cd thunderingherd/server && go test -v`

## Next Steps

See the [main protomux README](https://github.com/protomux/protomux) for complete framework documentation.
