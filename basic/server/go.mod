module github.com/protomux/examples/basic/server

go 1.25.0

require (
	github.com/protomux/protomux v0.0.0
	google.golang.org/grpc v1.75.1
	google.golang.org/protobuf v1.36.9
)

require (
	github.com/coder/websocket v1.8.14 // indirect
	github.com/golang-jwt/jwt/v5 v5.3.0 // indirect
	golang.org/x/net v0.41.0 // indirect
	golang.org/x/sys v0.33.0 // indirect
	golang.org/x/text v0.26.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20250707201910-8d1bb00bc6a7 // indirect
)

replace github.com/protomux/protomux => ../../../protomux
