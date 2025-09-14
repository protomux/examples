# JWT Node Client Example

Connects to the JWT-protected Protomux server (`examples/jwt/server`).

## Install deps

```bash
npm install
```

## Generate a token
Use the same secret as the server (`dev-secret-change`). Example (long-lived exp):
```bash
go run github.com/golang-jwt/jwt/v5/cmd/jwt --sign dev-secret-change --claims '{"sub":"demo","exp":4102444800}'
```
Export it:
```bash
export JWT_TOKEN=$(go run github.com/golang-jwt/jwt/v5/cmd/jwt --sign dev-secret-change --claims '{"sub":"demo","exp":4102444800}')
```

## Run (dev)
```bash
npm run dev
```

## Build & run
```bash
npm run build
npm start
```

The client passes the JWT using the `headers` option of `ProtomuxClient`:

```ts
const client = new ProtomuxClient('ws://localhost:3000/ws', {
	WebSocketImpl: (globalThis as any).WebSocket || (await import('ws')).default,
	headers: { Authorization: `Bearer ${process.env.JWT_TOKEN}` }
});
```

When run, you should see:

```
status response: ok
```
