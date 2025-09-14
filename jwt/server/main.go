package main

import (
	"context"
	"log/slog"
	"os/signal"
	"syscall"
	"time"

	"github.com/protomux/protomux"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	appCfg := &protomux.Config{
		HeartbeatInterval: 30 * time.Second,
		HTTPAddr:          ":3000",
		Debug:             true,
	}
	app := protomux.New(appCfg)
	// Configure JWT auth via upgrade middleware.
	app.UseUpgrade(protomux.JWTAuth([]byte("dev-secret-change")))

	app.Use(func(c *protomux.Ctx) error {
		return c.Next()
	})
	_ = app.Register("status", "ok", func(c *protomux.Ctx, payload any) (any, error) {
		return []byte("ok"), nil
	})

	// All websocket connections to /ws now require a valid JWT due to the JWTAuth upgrade middleware.
	// Use tools/jwt-generate (or any HS256 generator) to mint a token:
	//   Authorization: Bearer <token>

	if err := app.ListenAndServe(ctx); err != nil {
		slog.Error("run error", "error", err)
	}
}
