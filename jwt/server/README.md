# JWT WebSocket Example

This example shows how to enable JWT-protected WebSocket connections with `protomux`.

## Run the server

```
go run ./examples/jwt/server
```

The server listens on `:3000` and exposes the websocket endpoint at `ws://localhost:3000/ws` using the subprotocol `protomux.v1`.

## JWT requirement

The server configures JWT auth via the `JWTAuth` upgrade middleware:

```go
app.UseUpgrade(protomux.JWTAuth([]byte("dev-secret-change")))
```

Every WebSocket upgrade must include a valid Authorization header:

```
Authorization: Bearer <token>
```

Tokens are validated using the symmetric secret `dev-secret-change` (HS256). Change this secret for production.

## Generate a token

You can generate a token with a quick Go one-liner:

```
go run github.com/golang-jwt/jwt/v5/cmd/jwt --sign dev-secret-change --claims '{"sub":"demo","exp":4102444800}'
```

Or write a minimal Go snippet; any HS256 token signed with the secret will work.

## Connect with a client (Go)

```go
ctx := context.Background()
h := http.Header{}
h.Set("Authorization", "Bearer "+token)
c, _, err := websocket.Dial(ctx, "ws://localhost:3000/ws", &websocket.DialOptions{HTTPHeader: h, Subprotocols: []string{"protomux.v1"}})
if err != nil { panic(err) }
```

If the header is missing or invalid, the server returns `401 Unauthorized` during the handshake.

## Status call

After connecting, send an envelope invoking the registered `status` handler to receive an `ok` payload (see other examples for envelope framing specifics).

