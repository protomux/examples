// Example demonstrating connection admission control
package main

import (
	"context"
	"log"
	"log/slog"
	"os/signal"
	"syscall"
	"time"

	"github.com/protomux/protomux"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// Configure connection admission control to prevent thundering herd
	app := protomux.New(&protomux.Config{
		HTTPAddr:          ":8080",
		Debug:             true,
		Logger:            slog.Default(),
		HeartbeatInterval: 30 * time.Second,

		// Connection admission control (thundering herd prevention)
		MaxConnections:    1000, // Maximum 1,000 concurrent connections
		MaxUpgradesPerSec: 10,   // Maximum 10 new connections per second

		// Related settings for connection health
		IdleTimeout: 1 * time.Minute, // Close idle connections
	})

	// Register a simple handler
	app.Register("ping", "pong", func(c *protomux.Ctx, req any) (any, error) {
		return []byte("pong"), nil
	})

	log.Printf("Starting server with admission control:")

	if err := app.ListenAndServe(ctx); err != nil {
		log.Fatal(err)
	}
}
