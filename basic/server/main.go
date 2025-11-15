package main

import (
	"context"
	"log/slog"
	"os/signal"
	"syscall"
	"time"

	bookpb "examples/basic/generated"

	"github.com/protomux/protomux"
	"google.golang.org/protobuf/proto"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	db := newMemoryDB()
	app := newServer(db)

	if err := app.ListenAndServe(ctx); err != nil {
		slog.Error("run error", "error", err)
	}
}

func newServer(db *memoryDB) *protomux.App {
	appConfig := &protomux.Config{
		HeartbeatInterval: 30 * time.Second,
		HTTPAddr:          ":3000",
		Debug:             true,
	}
	app := protomux.New(appConfig)
	app.SetOriginPatterns([]string{"localhost:*"})

	app.RegisterProto(&bookpb.ListBooksRequest{}, &bookpb.ListBooksResponse{}, func(c *protomux.Ctx, req proto.Message) (proto.Message, error) {
		books := db.List()
		pb := make([]*bookpb.Book, 0, len(books))
		for i := range books {
			book := books[i]
			pb = append(pb, &bookpb.Book{Id: book.ID, Title: book.Title})
		}
		return &bookpb.ListBooksResponse{Books: pb}, nil
	})
	app.RegisterProto(&bookpb.CreateBookRequest{}, &bookpb.CreateBookResponse{}, func(c *protomux.Ctx, req proto.Message) (proto.Message, error) {
		r := req.(*bookpb.CreateBookRequest)
		book := db.Create(r.GetTitle())
		return &bookpb.CreateBookResponse{Book: &bookpb.Book{Id: book.ID, Title: book.Title}}, nil
	})
	app.Register("status", "ok", func(c *protomux.Ctx, payload any) (any, error) {
		return []byte("ok"), nil
	})
	return app
}
