package main

import (
	"context"
	"errors"
	"log"
	"log/slog"
	"os/signal"
	"syscall"
	"time"

	"github.com/protomux/protomux"
	"github.com/protomux/protomux/middleware/jwt"
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
	// Configure JWT auth via new middleware subpackage upgrade middleware.
	app.UseUpgrade(jwt.New([]byte("dev-secret-change")))

	// Status handler (no auth)
	app.Register("status", "ok", func(c *protomux.Ctx, payload any) (any, error) {
		claims, _ := protomux.JWTClaimsFromContext(c.BaseContext())
		log.Printf("status claims: %+v", claims)
		return []byte("ok"), nil
	})

	// Protected handler
	adminAuth := func(c *protomux.Ctx) error {
		claims, _ := protomux.JWTClaimsFromContext(c.BaseContext())
		if claims == nil {
			return errors.New("missing claims")
		}
		if v, ok := claims["role"]; !ok || v != "admin" {
			return errors.New("forbidden: admin role required")
		}
		log.Printf("admin claims: %+v", claims)
		return nil
	}
	app.RegisterWithAuth("admin.echo", "admin.ok", adminAuth, func(c *protomux.Ctx, payload any) (any, error) {
		return payload, nil
	})

	//   Authorization: Bearer <token>
	// Use tools/jwt-generate (or any HS256 generator) to mint a token:

	if err := app.ListenAndServe(ctx); err != nil {
		slog.Error("run error", "error", err)
	}
}
