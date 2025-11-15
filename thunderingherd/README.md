# Thundering Herd Protection Example

Demonstrates Protomux's connection admission control features that protect against thundering herd problems. This example shows how to configure rate limiting and connection caps to ensure server stability during connection storms.

## Overview

A "thundering herd" occurs when many clients attempt to connect simultaneously—for example, after a server restart, network issue, or during a traffic spike. Without protection, this can overwhelm the server with:

- Excessive CPU usage from connection upgrades
- Memory exhaustion from too many concurrent connections
- Degraded performance for all clients

Protomux provides built-in admission control to handle these scenarios gracefully.

## Features

- **Rate Limiting**: Control new connections per second with `MaxUpgradesPerSec`
- **Connection Caps**: Hard limit on concurrent connections with `MaxConnections`
- **Proper HTTP Status Codes**: Returns `429 Too Many Requests` or `503 Service Unavailable` with `Retry-After` headers
- **Graceful Degradation**: Server remains stable during connection storms
- **Comprehensive Tests**: Includes tests demonstrating protection behavior

## Configuration

The server in `main.go` demonstrates key configuration options:

```go
app := protomux.New(&protomux.Config{
    HTTPAddr:          ":8080",
    Debug:             true,
    HeartbeatInterval: 30 * time.Second,

    // Connection admission control (thundering herd prevention)
    MaxConnections:    1000, // Maximum 1,000 concurrent connections
    MaxUpgradesPerSec: 10,   // Maximum 10 new connections per second

    // Related settings for connection health
    IdleTimeout: 1 * time.Minute, // Close idle connections
})
```

### Key Settings

- **`MaxConnections`**: Hard cap on concurrent WebSocket connections
  - When reached, new connections receive HTTP `503 Service Unavailable` with `Retry-After` header
  - Set to `0` for unlimited (not recommended in production)

- **`MaxUpgradesPerSec`**: Rate limit for new connection upgrades per second
  - Prevents CPU/memory spikes from simultaneous connection attempts
  - Excess connections receive HTTP `429 Too Many Requests` with `Retry-After` header
  - Set to `0` for unlimited (not recommended in production)

- **`IdleTimeout`**: Close connections that haven't sent messages
  - Frees up connection slots for active clients
  - Works with `HeartbeatInterval` to detect truly idle connections

### HTTP Status Codes

When admission control triggers, clients receive appropriate HTTP responses:

| Status | Code | Meaning | Client Action |
|--------|------|---------|---------------|
| `429 Too Many Requests` | Rate limit exceeded | Too many connection attempts per second | Retry with exponential backoff using `Retry-After` header |
| `503 Service Unavailable` | Connection limit reached | Server at maximum capacity | Retry later using `Retry-After` header |

Both responses include a `Retry-After` header (in seconds) indicating when to retry.

## Run Server

```bash
cd examples/thunderingherd/server
go run .
```

**WebSocket endpoint:** `ws://localhost:8080/ws`  
**Subprotocol:** `protomux.v1`

## Testing

The example includes comprehensive tests demonstrating admission control behavior:

```bash
cd examples/thunderingherd/server
go test -v
```

### Test Scenarios

1. **Simulated Connection Storm** (`TestThunderingHerdProtection`)
   - 100 clients attempt to connect simultaneously
   - Verifies rate limiting kicks in
   - Confirms proper HTTP status codes and headers
   - Demonstrates server remains stable

2. **Gradual Connection Acceptance**
   - Verifies rate limiting spreads connections over time
   - Shows not all connections are accepted immediately
   - Demonstrates controlled admission

3. **Retry Behavior Simulation**
   - Simulates clients with exponential backoff
   - Shows how proper retry logic works with rate limiting
   - Most clients eventually succeed with retries

4. **Stress Test Without Protection** (optional)
   - Run with `-short=false` to enable
   - Shows what happens without admission control
   - Demonstrates the importance of these limits

### Run Specific Tests

```bash
# Run all thundering herd tests
go test -v -run TestThunderingHerd

# Run without stress test
go test -v -short

# Run benchmark
go test -bench=BenchmarkConnectionStorm -benchmem
```

## Client Retry Strategy

When implementing clients, respect the server's admission control:

```typescript
async function connectWithRetry(url: string, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const ws = new WebSocket(url, ['protomux.v1']);
      return ws; // Success
    } catch (error) {
      if (error.response?.status === 429 || error.response?.status === 503) {
        // Read Retry-After header
        const retryAfter = error.response.headers['retry-after'];
        const delay = retryAfter 
          ? parseInt(retryAfter) * 1000 
          : Math.pow(2, attempt) * 1000; // Exponential backoff
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue; // Retry
      }
      throw error; // Other errors - don't retry
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Best Practices

1. **Set appropriate limits** based on your server capacity:
   - Monitor actual connection counts in production
   - Load test to find safe maximums
   - Leave headroom for traffic spikes

2. **Use both limits together**:
   - `MaxConnections` caps total memory/resource usage
   - `MaxUpgradesPerSec` prevents CPU spikes during storms

3. **Configure IdleTimeout**:
   - Frees slots from inactive clients
   - Works with heartbeats to detect real disconnections

4. **Client-side retry logic**:
   - Respect `Retry-After` headers
   - Use exponential backoff
   - Add jitter to prevent synchronized retries

5. **Monitor metrics**:
   - Track rate limit hits (`429` responses)
   - Track connection limit hits (`503` responses)
   - Alert on sustained rate limiting (may need capacity increase)

## Production Configuration

For a production deployment:

```go
app := protomux.New(&protomux.Config{
    // Scale based on server resources
    MaxConnections:    10000,  // Monitor RAM usage
    MaxUpgradesPerSec: 100,    // Monitor CPU during spikes
    
    // Keep connections healthy
    HeartbeatInterval: 30 * time.Second,
    IdleTimeout:       5 * time.Minute,
    
    // Observability
    Logger: slog.New(slog.NewJSONHandler(os.Stdout, nil)),
})
```

## Next Steps

- Add monitoring/metrics to track admission control events
- Implement client-side retry logic with exponential backoff
- Load test with your expected connection patterns
- Tune limits based on server capacity and traffic patterns
- Combine with authentication (see [JWT example](https://github.com/protomux/examples/tree/main/jwt))
- Add per-user rate limiting using middleware

## Related Documentation

- [THUNDERING_HERD.md](https://github.com/protomux/protomux/blob/main/THUNDERING_HERD.md) - Detailed design document
- [Server Configuration](https://github.com/protomux/protomux#configuration) - Full config reference
- [Testing Guide](https://github.com/protomux/protomux/blob/main/TESTING.md) - Testing strategies
- [Examples Overview](https://github.com/protomux/examples) - All available examples
