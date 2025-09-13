package main

import (
	"log/slog"
	"net/http"
	"os"
	"time"

	bookpb "github.com/protomux/examples/basic/server/generated"
	"github.com/protomux/protomux"
	"google.golang.org/protobuf/proto"
)

func main() {
	db := newMemoryDB()

	app := protomux.New(&protomux.Config{HeartbeatInterval: 30 * time.Second, Debug: true})

	// Simple JWT auth middleware (header already validated at upgrade if configured there; placeholder here)
	app.Use(func(c *protomux.Ctx) error {
		// Could inspect c.Conn().Request() for claims; skip for brevity
		return c.Next()
	})

	// Register protobuf handlers
	_ = app.RegisterProto(&bookpb.ListBooksRequest{}, &bookpb.ListBooksResponse{}, func(c *protomux.Ctx, req proto.Message) (proto.Message, error) {
		_ = req.(*bookpb.ListBooksRequest)
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
		created := db.Create(r.Title)
		return &bookpb.CreateBookResponse{Book: &bookpb.Book{Id: created.ID, Title: created.Title}}, nil
	})

	// Basic health raw handler
	_ = app.Register("ping", "pong", func(c *protomux.Ctx, payload any) (any, error) {
		return []byte("pong"), nil
	})

	addr := ":3000"
	slog.Info("protomux example listening", "addr", addr)
	if err := http.ListenAndServe(addr, app); err != nil {
		slog.Error("server error", "error", err)
		os.Exit(1)
	}
}
