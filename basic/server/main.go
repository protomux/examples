package main

import (
	"context"
	"log/slog"
	"os/signal"
	"syscall"
	"time"

	bookpb "examples/basic/generated"

	"github.com/protomux/protomux"
	"github.com/protomux/protomux/middleware/cors"
	"google.golang.org/protobuf/proto"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// In-memory DB
	db := newMemoryDB()

	// HTTP/WebSocket only after gRPC removal
	appCfg := &protomux.Config{
		HeartbeatInterval: 30 * time.Second,
		HTTPAddr:          ":3000",
		Debug:             true,
	}
	app := protomux.New(appCfg)
	// Allow localhost origins for example usage (dev only)
	app.UseUpgrade(cors.New([]string{"http://localhost:*", "https://localhost:*"}))

	app.Use(func(c *protomux.Ctx) error {
		return c.Next()
	})
	_ = app.RegisterProto(&bookpb.ListBooksRequest{}, &bookpb.ListBooksResponse{}, func(c *protomux.Ctx, req proto.Message) (proto.Message, error) {
		books := db.List()
		pb := make([]*bookpb.Book, 0, len(books))
		for i := range books {
			b := books[i]
			pb = append(pb, &bookpb.Book{Id: b.ID, Title: b.Title})
		}
		return &bookpb.ListBooksResponse{Books: pb}, nil
	})
	_ = app.RegisterProto(&bookpb.CreateBookRequest{}, &bookpb.CreateBookResponse{}, func(c *protomux.Ctx, req proto.Message) (proto.Message, error) {
		r := req.(*bookpb.CreateBookRequest)
		b := db.Create(r.GetTitle())
		return &bookpb.CreateBookResponse{Book: &bookpb.Book{Id: b.ID, Title: b.Title}}, nil
	})
	_ = app.Register("status", "ok", func(c *protomux.Ctx, payload any) (any, error) {
		return []byte("ok"), nil
	})

	if err := app.ListenAndServe(ctx); err != nil {
		slog.Error("run error", "error", err)
	}
}
