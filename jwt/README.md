# JWT Example

Demonstrates how to secure a Protomux WebSocket connection with JWT authentication. This example shows token-based authentication and per-handler authorization.

## Overview

This example implements JWT-based authentication for WebSocket connections. It demonstrates:
- WebSocket endpoint with optional JWT authentication via `Authorization: Bearer <token>` header
- JWT upgrade middleware using `jwt.New(secret)` from `middleware/jwt`
- Per-handler authorization with custom claims inspection
- Simple status RPC demonstrating both public and protected handlers
- Node.js client example with Bearer token

## Features

- **JWT Authentication**: Token-based authentication using standard JWT tokens
- **Optional Auth**: Middleware validates tokens when present but allows unauthenticated connections
- **Custom Claims**: Access user identity and roles from JWT claims in handlers
- **Per-Handler Authorization**: Fine-grained access control for individual endpoints
- **Standard Bearer Tokens**: Uses industry-standard `Authorization: Bearer` header

## Run Server

```bash
cd examples/jwt/server
go run .
```

**WebSocket endpoint:** `ws://localhost:3000` (any path, commonly `/ws`)  
**Subprotocol:** `protomux.v1`

The server configures JWT middleware:

```go
import "github.com/protomux/protomux/middleware/jwt"

app.UseUpgrade(jwt.New([]byte("dev-secret-change")))
```

This middleware is **optional** – it allows connections without tokens but validates and attaches claims when a token is present.

## Generate Token

Use the helper tool in the protomux repo:

```bash
cd /path/to/protomux
go run ./protomux/tools/jwt-generate
```

This generates a token with the secret `dev-secret-change` and claims `{"sub":"demo","role":"admin"}`.

**For use in scripts**, export the token:

```bash
export JWT_TOKEN=$(go run ./protomux/tools/jwt-generate)
```

**Note:** The secret must match the one used in the server (`dev-secret-change` in this example).

## Run Node Client

```bash
cd examples/jwt/client-node
npm install   # first time only
JWT_TOKEN=<your-token> npm run dev
```

**Or with token generation:**

```bash
export JWT_TOKEN=$(go run ../../protomux/tools/jwt-generate)
npm run dev
```

**Expected output:**

```
Connected to WebSocket
Sending status request...
Status response: ok
Sending admin.echo request...
Admin echo response: hello admin
```

## Handler Registration

### Public Handler (No Auth Required)

```go
app.Register("status", "ok", func(c *protomux.Ctx, payload any) (any, error) {
    claims, _ := protomux.JWTClaimsFromContext(c.BaseContext())
    log.Printf("status claims: %+v", claims)  // nil if no token
    return []byte("ok"), nil
})
```

### Protected Handler (Auth Required)

```go
adminAuth := func(c *protomux.Ctx) error {
    claims, _ := protomux.JWTClaimsFromContext(c.BaseContext())
    if claims == nil {
        return errors.New("missing claims")
    }
    if v, ok := claims["role"]; !ok || v != "admin" {
        return errors.New("forbidden: admin role required")
    }
    return nil
}

app.RegisterWithAuth("admin.echo", "admin.ok", adminAuth, 
    func(c *protomux.Ctx, payload any) (any, error) {
        return payload, nil
    })
```

## Custom Claims

The JWT middleware attaches claims as `jwt.MapClaims` to the connection context. Access them in handlers:

```go
import "github.com/protomux/protomux"

claims, ok := protomux.JWTClaimsFromContext(c.BaseContext())
if !ok || claims == nil {
    return errors.New("unauthorized")
}

userID, _ := claims["sub"].(string)
role, _ := claims["role"].(string)
```

Implement custom middleware for:

- Token revocation checks (check against a database/cache)
- Custom claim validation
- Role-based access control (RBAC)
- Tenant isolation

## Production Notes

- **Rotate secrets**: Change JWT signing secret periodically
- **Short-lived tokens**: Use expiration times (`exp` claim) and implement refresh flow
- **HTTPS only**: Always use TLS in production
- **Rate limiting**: Combine with rate limit middleware (see `middleware/ratelimit`)
- **Secure secrets**: Store secrets in environment variables or secret management systems, never in code

## Next Steps

- Implement token refresh mechanism
- Add role-based access control (RBAC) for more granular permissions
- Integrate with OAuth2/OIDC providers
- Add token revocation list (blacklist) using Redis
- Implement rate limiting per user (see [Thundering Herd example](https://github.com/protomux/examples/tree/main/thunderingherd))

## Related Documentation

- [Main Protomux README](https://github.com/protomux/protomux) - Framework documentation
- [Middleware Documentation](https://github.com/protomux/protomux#middleware) - Available middleware
- [Examples Overview](https://github.com/protomux/examples) - All available examples
