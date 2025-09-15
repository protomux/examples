# JWT Example

Secure a Protomux websocket with JWT authentication.

## Features
- WebSocket endpoint requiring `Authorization: Bearer <token>`
- `app.UseUpgrade(protomux.JWTAuth(secret))` middleware
- Simple status RPC + Node client example
- Token generation helper utility

## Run Server
```bash
cd examples/jwt/server
go run .
```
Default websocket endpoint: `ws://localhost:3000/ws` (subprotocol `protomux.v1`).

## Generate Token
One-off (long expiry):
```bash
go run github.com/golang-jwt/jwt/v5/cmd/jwt --sign dev-secret-change --claims '{"sub":"demo","exp":4102444800}'
```
Or use the helper tool in repo:
```bash
go run ./protomux/tools/jwt-generate
```

Export for Node client:
```bash
export JWT_TOKEN=$(go run github.com/golang-jwt/jwt/v5/cmd/jwt --sign dev-secret-change --claims '{"sub":"demo","exp":4102444800}')
```

## Run Node Client
```bash
cd examples/jwt/client-node
npm install
npm run dev
```
You should see `status response: ok`.

## Handler Registration
Status handler pattern (typed):
```go
app.Register("status", "status", func(c *protomux.Ctx, payload any) (any, error) {
    return []byte("ok"), nil
})
```

## Custom Claims
Implement your own middleware if you need custom claim extraction or revocation checks.

## Production Notes
- Rotate JWT secret periodically
- Use short-lived tokens + refresh flow outside websocket
- Consider rate limiting per connection (library provides token bucket fields)
