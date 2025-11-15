package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	chatpb "examples/chatserver/generated"

	"github.com/protomux/protomux"
	"google.golang.org/protobuf/proto"
)

func main() {
	app := protomux.New(&protomux.Config{Debug: true})
	app.SetOriginPatterns([]string{"localhost:*"})

	app.RegisterProto(&chatpb.SendMessageRequest{}, &chatpb.SendMessageResponse{}, func(c *protomux.Ctx, msg proto.Message) (proto.Message, error) {
		r := msg.(*chatpb.SendMessageRequest)
		event := &chatpb.MessageEvent{Room: r.GetRoom(), User: r.GetUser(), Text: r.GetText(), TsUnixMs: time.Now().UnixMilli()}
		app.Publish(topicForRoom(r.GetRoom()), "examples.chat.MessageEvent", event)
		return &chatpb.SendMessageResponse{Status: "ok"}, nil
	})

	// JoinRoom now emits PresenceEvent JOIN/LEAVE (no counts).
	app.RegisterProto(&chatpb.JoinRoomRequest{}, &chatpb.JoinRoomResponse{}, func(c *protomux.Ctx, msg proto.Message) (proto.Message, error) {
		r := msg.(*chatpb.JoinRoomRequest)
		room := r.GetRoom()
		user := r.GetUser()
		joinEvent := &chatpb.PresenceEvent{Room: room, User: user, Action: chatpb.PresenceEvent_JOIN, TsUnixMs: time.Now().UnixMilli()}
		app.Publish(topicForRoom(room), "examples.chat.PresenceEvent", joinEvent)

		c.OnClose(func() {
			leaveEvent := &chatpb.PresenceEvent{Room: room, User: user, Action: chatpb.PresenceEvent_LEAVE, TsUnixMs: time.Now().UnixMilli()}
			app.Publish(topicForRoom(room), "examples.chat.PresenceEvent", leaveEvent)
		})
		return &chatpb.JoinRoomResponse{Status: "ok"}, nil
	})

	// HTTP API mux for posting message externally: POST /rooms/{room}/messages with JSON {"user":"x","text":"hi"}
	mux := http.NewServeMux()
	mux.HandleFunc("/ws", app.ServeHTTP)
	mux.HandleFunc("POST /api/rooms/{id}", func(w http.ResponseWriter, r *http.Request) {
		room := r.PathValue("id")
		var body struct {
			User string `json:"user"`
			Text string `json:"text"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		event := &chatpb.MessageEvent{Room: room, User: body.User, Text: body.Text, TsUnixMs: time.Now().UnixMilli()}
		count := app.Publish(topicForRoom(room), "examples.chat.MessageEvent", event)

		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(fmt.Sprintf("{\"published\":%d}", count)))
	})

	addr := ":8085"
	log.Printf("chat server listening on %s (ws at /ws)", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}

func topicForRoom(room string) string {
	return "chat:room:" + room
}
