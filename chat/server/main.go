package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	chatpb "chatserver/generated"

	"github.com/protomux/protomux"
	"google.golang.org/protobuf/proto"
)

func main() {
	app := protomux.New(nil)

	// Register SendMessage handler (raw for now): expects JSON of SendMessageRequest
	app.RegisterProto(&chatpb.SendMessageRequest{}, &chatpb.SendMessageResponse{}, func(c *protomux.Ctx, msg proto.Message) (proto.Message, error) {
		r := msg.(*chatpb.SendMessageRequest)
		evt := &chatpb.MessageEvent{Room: r.GetRoom(), User: r.GetUser(), Text: r.GetText(), TsUnixMs: time.Now().UnixMilli()}
		b, _ := proto.Marshal(evt)
		app.Publish(topicForRoom(r.GetRoom()), "examples.chat.MessageEvent", b)
		return &chatpb.SendMessageResponse{Status: "ok"}, nil
	})

	// JoinRoom now emits PresenceEvent JOIN/LEAVE (no counts).
	app.RegisterProto(&chatpb.JoinRoomRequest{}, &chatpb.JoinRoomResponse{}, func(c *protomux.Ctx, msg proto.Message) (proto.Message, error) {
		r := msg.(*chatpb.JoinRoomRequest)
		room := r.GetRoom()
		user := r.GetUser()
		join := &chatpb.PresenceEvent{Room: room, User: user, Action: chatpb.PresenceEvent_JOIN, TsUnixMs: time.Now().UnixMilli()}
		b, _ := proto.Marshal(join)
		app.Publish(topicForRoom(room), "examples.chat.PresenceEvent", b)
		c.OnClose(func() {
			leave := &chatpb.PresenceEvent{Room: room, User: user, Action: chatpb.PresenceEvent_LEAVE, TsUnixMs: time.Now().UnixMilli()}
			lb, _ := proto.Marshal(leave)
			app.Publish(topicForRoom(room), "examples.chat.PresenceEvent", lb)
		})
		return &chatpb.JoinRoomResponse{Status: "ok"}, nil
	})

	// HTTP API mux for posting message externally: POST /rooms/{room}/messages with JSON {"user":"x","text":"hi"}
	mux := http.NewServeMux()
	mux.HandleFunc("/ws", app.ServeHTTP)
	mux.HandleFunc("POST /api/rooms/{id}", func(w http.ResponseWriter, r *http.Request) {
		room := r.PathValue("id")
		var body struct{ User, Text string }
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		event := &chatpb.MessageEvent{Room: room, User: body.User, Text: body.Text, TsUnixMs: time.Now().UnixMilli()}
		b, _ := proto.Marshal(event)
		count := app.Publish(topicForRoom(room), "examples.chat.MessageEvent", b)
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
